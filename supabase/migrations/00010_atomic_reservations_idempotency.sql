-- =============================================
-- 00010 — Anti-surbooking & idempotence (audit backend/BDD)
-- =============================================
-- Pousse l'intégrité dans la base au lieu du code applicatif :
--
--   1. reservations.idempotency_key + index unique : un retry webhook (ou un
--      INSERT lent qui aboutit en arrière-plan après le timeout de 5 s) rejoue
--      la même réservation au lieu d'en créer une seconde.
--   2. Index unique partiel anti-doublons sur le créneau actif
--      (restaurant, téléphone, date, heure) : garde DB derrière la garde
--      applicative checkDuplicateReservation.
--      NOTE : la clé inclut l'heure, pas seulement la date, car le flux
--      force_create autorise légitimement une 2e réservation le même jour
--      (ex. midi + soir). Le dialogue "vous avez déjà une table…" reste géré
--      en applicatif sur (téléphone, date).
--   3. create_reservation_atomic() : recompte les couverts du service DANS la
--      transaction d'insertion, sous verrou FOR UPDATE de la ligne restaurant,
--      et lève CAPACITY_EXCEEDED en cas de dépassement. Ferme la fenêtre
--      TOCTOU entre check_availability et l'INSERT (2 appels simultanés).
--
-- ⚠️ PRÉ-REQUIS avant d'appliquer : s'il existe déjà des doublons actifs sur
-- un même créneau, la création de l'index unique échouera. Les repérer avec :
--
--   SELECT restaurant_id, customer_phone, reservation_date, reservation_time, COUNT(*)
--   FROM reservations
--   WHERE status IN ('pending', 'confirmed')
--   GROUP BY 1, 2, 3, 4
--   HAVING COUNT(*) > 1;
--
-- et annuler (status = 'cancelled') les lignes en trop avant de relancer.
--
-- SQL idempotent : ré-exécutable sans erreur (IF NOT EXISTS / OR REPLACE).
-- Aucune valeur d'enum ajoutée (pas de piège "enum + usage même transaction").

-- ---------------------------------------------
-- 1. Clé d'idempotence des réservations
-- ---------------------------------------------
-- Calculée côté application : "<vapi_call_id>:<date>:<heure>".
-- NULL pour les réservations sans appel associé (manuel, web).

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

COMMENT ON COLUMN reservations.idempotency_key IS
  'Clé d''idempotence "<vapi_call_id>:<date>:<heure>" — un retry du webhook renvoie la réservation existante au lieu d''en créer une nouvelle';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_reservations_idempotency_key
  ON reservations (restaurant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------
-- 2. Anti-doublons durs sur le créneau actif
-- ---------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uniq_reservations_active_slot
  ON reservations (restaurant_id, customer_phone, reservation_date, reservation_time)
  WHERE status IN ('pending', 'confirmed');

-- ---------------------------------------------
-- 3. Idempotence des lignes calls
-- ---------------------------------------------
-- L'upsert onConflict: "vapi_call_id" du webhook s'appuie sur la contrainte
-- UNIQUE(vapi_call_id) créée en 00001 (index "calls_vapi_call_id_key").
-- Recréée ici de façon idempotente au cas où elle aurait été supprimée.

CREATE UNIQUE INDEX IF NOT EXISTS calls_vapi_call_id_key ON calls (vapi_call_id);

-- ---------------------------------------------
-- 4. Insertion atomique avec contrôle de capacité
-- ---------------------------------------------
-- Reflète EXACTEMENT la règle métier de lib/vapi/availability.ts :
--   - service déterminé par la coupure 15h00 (LUNCH_CUTOFF_HOUR) ;
--   - capacité effective = floor(max_capacity_service * (1 - buffer)) où le
--     buffer (CAPACITY_BUFFER_RATIO, 10 %) est passé par l'application pour
--     garder une source de vérité unique côté TS ;
--   - couverts occupés = somme des réservations pending/confirmed du même
--     service le même jour.
-- La vérification des horaires d'ouverture reste applicative (elle ne crée
-- pas de risque de surbooking).
--
-- Erreurs remontées à l'application :
--   - P0001 / message CAPACITY_EXCEEDED  → créneau complet (perdu la course)
--   - P0002 / message RESTAURANT_NOT_FOUND
--   - 23505 (unique_violation)           → doublon actif sur le créneau

CREATE OR REPLACE FUNCTION create_reservation_atomic(
  p_restaurant_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_date DATE,
  p_time TIME,
  p_number_of_guests INTEGER,
  p_customer_email TEXT DEFAULT NULL,
  p_special_requests TEXT DEFAULT NULL,
  p_status reservation_status DEFAULT 'pending',
  p_source reservation_source DEFAULT 'phone',
  p_confidence_score NUMERIC DEFAULT 1.00,
  p_needs_confirmation BOOLEAN DEFAULT false,
  p_call_id UUID DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_capacity_buffer_ratio NUMERIC DEFAULT 0.10
)
RETURNS TABLE (
  reservation_id UUID,
  reservation_cancellation_token UUID,
  was_created BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lunch_cutoff CONSTANT TIME := '15:00:00';
  v_max_capacity INTEGER;
  v_effective_capacity INTEGER;
  v_booked INTEGER;
BEGIN
  -- Verrou sur la ligne restaurant : sérialise les insertions du restaurant.
  -- Le recompte de capacité ci-dessous ne peut donc plus être invalidé par
  -- une insertion concurrente (fenêtre TOCTOU fermée). Pris AVANT le check
  -- d'idempotence pour qu'un retry concurrent de la même écriture attende
  -- l'original et voie sa ligne, au lieu de finir en 23505.
  SELECT CASE WHEN p_time < v_lunch_cutoff
              THEN r.max_capacity_lunch
              ELSE r.max_capacity_dinner
         END
    INTO v_max_capacity
  FROM restaurants r
  WHERE r.id = p_restaurant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESTAURANT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- Rejeu idempotent : si cette écriture a déjà abouti (retry webhook après
  -- timeout, INSERT lent terminé en arrière-plan), rendre la réservation
  -- existante au lieu d'en créer une seconde. was_created = false permet à
  -- l'application de ne pas renvoyer un 2e SMS.
  IF p_idempotency_key IS NOT NULL THEN
    RETURN QUERY
      SELECT r.id, r.cancellation_token, false
      FROM reservations r
      WHERE r.restaurant_id = p_restaurant_id
        AND r.idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  v_effective_capacity := floor(v_max_capacity * (1 - p_capacity_buffer_ratio))::INTEGER;

  SELECT COALESCE(SUM(r.number_of_guests), 0)::INTEGER
    INTO v_booked
  FROM reservations r
  WHERE r.restaurant_id = p_restaurant_id
    AND r.reservation_date = p_date
    AND r.status IN ('pending', 'confirmed')
    AND ((r.reservation_time < v_lunch_cutoff) = (p_time < v_lunch_cutoff));

  IF v_booked + p_number_of_guests > v_effective_capacity THEN
    RAISE EXCEPTION 'CAPACITY_EXCEEDED'
      USING ERRCODE = 'P0001',
            DETAIL = format('remaining=%s', GREATEST(v_effective_capacity - v_booked, 0));
  END IF;

  RETURN QUERY
    INSERT INTO reservations (
      restaurant_id, customer_name, customer_phone, customer_email,
      reservation_date, reservation_time, number_of_guests,
      special_requests, status, source, confidence_score,
      needs_confirmation, call_id, idempotency_key
    )
    VALUES (
      p_restaurant_id, p_customer_name, p_customer_phone, p_customer_email,
      p_date, p_time, p_number_of_guests,
      p_special_requests, p_status, p_source, p_confidence_score,
      p_needs_confirmation, p_call_id, p_idempotency_key
    )
    RETURNING reservations.id, reservations.cancellation_token, true;
END;
$$;

COMMENT ON FUNCTION create_reservation_atomic IS
  'Insère une réservation avec recompte de capacité sous verrou (anti-TOCTOU) et rejeu idempotent par idempotency_key';

-- SECURITY DEFINER = bypass RLS : ne doit être appelable que par le service
-- role (webhook). Sans ce REVOKE, anon/authenticated pourraient créer des
-- réservations chez n'importe quel restaurant via PostgREST.
REVOKE ALL ON FUNCTION create_reservation_atomic(
  UUID, TEXT, TEXT, DATE, TIME, INTEGER, TEXT, TEXT,
  reservation_status, reservation_source, NUMERIC, BOOLEAN, UUID, TEXT, NUMERIC
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION create_reservation_atomic(
  UUID, TEXT, TEXT, DATE, TIME, INTEGER, TEXT, TEXT,
  reservation_status, reservation_source, NUMERIC, BOOLEAN, UUID, TEXT, NUMERIC
) TO service_role;
