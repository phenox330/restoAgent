-- =============================================
-- Migration: PRD Features
-- Description: Ajoute les fonctionnalités du PRD:
--   - Capacité par service (midi/soir)
--   - Recherche phonétique (pg_trgm)
--   - Waitlist
--   - Score de confiance et token d'annulation
--   - Numéro de fallback pour transfert humain
-- =============================================

-- =============================================
-- EXTENSIONS
-- =============================================

-- Extension pour recherche phonétique (fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- ALTER TABLE: restaurants
-- =============================================

-- Capacité par service (midi et soir)
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS max_capacity_lunch INTEGER,
ADD COLUMN IF NOT EXISTS max_capacity_dinner INTEGER,
ADD COLUMN IF NOT EXISTS fallback_phone TEXT,
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN NOT NULL DEFAULT true;

-- Migration des données existantes: répartir la capacité
UPDATE restaurants
SET
  max_capacity_lunch = COALESCE(max_capacity / 2, 25),
  max_capacity_dinner = COALESCE(max_capacity, 50),
  fallback_phone = phone
WHERE max_capacity_lunch IS NULL;

-- Rendre les colonnes NOT NULL après migration
ALTER TABLE restaurants
ALTER COLUMN max_capacity_lunch SET NOT NULL,
ALTER COLUMN max_capacity_dinner SET NOT NULL;

-- Valeurs par défaut
ALTER TABLE restaurants
ALTER COLUMN max_capacity_lunch SET DEFAULT 25,
ALTER COLUMN max_capacity_dinner SET DEFAULT 50;

-- =============================================
-- ALTER TABLE: reservations
-- =============================================

-- Score de confiance IA (0.00 à 1.00)
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS needs_confirmation BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS cancellation_token UUID DEFAULT uuid_generate_v4();

-- Contrainte sur le score de confiance
ALTER TABLE reservations
ADD CONSTRAINT confidence_score_range 
CHECK (confidence_score >= 0 AND confidence_score <= 1);

-- Index pour le token d'annulation (recherche rapide)
CREATE INDEX IF NOT EXISTS idx_reservations_cancellation_token 
ON reservations(cancellation_token);

-- Index pour les réservations à confirmer
CREATE INDEX IF NOT EXISTS idx_reservations_needs_confirmation 
ON reservations(needs_confirmation) 
WHERE needs_confirmation = true;

-- Index trigram sur customer_name pour recherche phonétique
CREATE INDEX IF NOT EXISTS idx_reservations_customer_name_trgm 
ON reservations USING gin (customer_name gin_trgm_ops);

-- Index pour anti-doublons (phone + date)
CREATE INDEX IF NOT EXISTS idx_reservations_phone_date 
ON reservations(customer_phone, reservation_date);

-- =============================================
-- TABLE: waitlist
-- =============================================

CREATE TYPE waitlist_status AS ENUM (
  'waiting',           -- En attente d'une place
  'needs_manager_call', -- Groupe > 8 pers, nécessite rappel manager
  'contacted',         -- Client contacté
  'converted',         -- Converti en réservation
  'expired',           -- Expiré (date passée)
  'cancelled'          -- Annulé par le client
);

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  -- Informations client
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  
  -- Créneaux souhaités
  desired_date DATE NOT NULL,
  desired_time TIME,
  desired_service TEXT CHECK (desired_service IN ('lunch', 'dinner', 'any')),
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  
  -- Statut
  status waitlist_status NOT NULL DEFAULT 'waiting',
  
  -- Notes
  notes TEXT,
  
  -- Référence vers réservation si converti
  converted_reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  
  -- Référence appel Vapi
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT phone_format CHECK (customer_phone ~ '^[0-9+\-\s()]+$')
);

-- Index pour recherches
CREATE INDEX IF NOT EXISTS idx_waitlist_restaurant_id ON waitlist(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_desired_date ON waitlist(desired_date);
CREATE INDEX IF NOT EXISTS idx_waitlist_restaurant_date ON waitlist(restaurant_id, desired_date);

-- Trigger pour updated_at
CREATE TRIGGER update_waitlist_updated_at
  BEFORE UPDATE ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY: waitlist
-- =============================================

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les entrées waitlist de leurs restaurants
CREATE POLICY "Users can view waitlist of own restaurants"
  ON waitlist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = waitlist.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent créer des entrées waitlist pour leurs restaurants
CREATE POLICY "Users can create waitlist for own restaurants"
  ON waitlist FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = waitlist.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent modifier les entrées waitlist de leurs restaurants
CREATE POLICY "Users can update waitlist of own restaurants"
  ON waitlist FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = waitlist.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = waitlist.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent supprimer les entrées waitlist de leurs restaurants
CREATE POLICY "Users can delete waitlist of own restaurants"
  ON waitlist FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = waitlist.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- =============================================
-- FONCTIONS SQL
-- =============================================

-- Fonction: Recherche phonétique de réservations
CREATE OR REPLACE FUNCTION fuzzy_search_reservations(
  p_restaurant_id UUID,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_min_similarity FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  reservation_date DATE,
  reservation_time TIME,
  number_of_guests INTEGER,
  status reservation_status,
  similarity_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.customer_name,
    r.customer_phone,
    r.reservation_date,
    r.reservation_time,
    r.number_of_guests,
    r.status,
    similarity(r.customer_name, p_name)::FLOAT as similarity_score
  FROM reservations r
  WHERE r.restaurant_id = p_restaurant_id
    AND r.status IN ('pending', 'confirmed')
    AND (
      similarity(r.customer_name, p_name) >= p_min_similarity
      OR (p_phone IS NOT NULL AND r.customer_phone = p_phone)
    )
  ORDER BY 
    -- Priorité au téléphone exact
    CASE WHEN p_phone IS NOT NULL AND r.customer_phone = p_phone THEN 0 ELSE 1 END,
    -- Puis par similarité du nom
    similarity(r.customer_name, p_name) DESC,
    -- Puis par date la plus proche
    r.reservation_date ASC
  LIMIT 10;
END;
$$;

-- Fonction: Vérifier doublon de réservation
CREATE OR REPLACE FUNCTION check_duplicate_reservation(
  p_restaurant_id UUID,
  p_phone TEXT,
  p_date DATE
)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  reservation_time TIME,
  number_of_guests INTEGER,
  status reservation_status
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.customer_name,
    r.reservation_time,
    r.number_of_guests,
    r.status
  FROM reservations r
  WHERE r.restaurant_id = p_restaurant_id
    AND r.customer_phone = p_phone
    AND r.reservation_date = p_date
    AND r.status IN ('pending', 'confirmed')
  ORDER BY r.reservation_time ASC
  LIMIT 1;
END;
$$;

-- Fonction: Obtenir la capacité du service (midi ou soir)
CREATE OR REPLACE FUNCTION get_service_capacity(
  p_restaurant_id UUID,
  p_time TIME
)
RETURNS TABLE (
  service_type TEXT,
  max_capacity INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_lunch_cutoff TIME := '15:00:00';
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN p_time < v_lunch_cutoff THEN 'lunch'
      ELSE 'dinner'
    END as service_type,
    CASE 
      WHEN p_time < v_lunch_cutoff THEN r.max_capacity_lunch
      ELSE r.max_capacity_dinner
    END as max_capacity
  FROM restaurants r
  WHERE r.id = p_restaurant_id;
END;
$$;

-- Fonction: Compter les couverts réservés pour un service
CREATE OR REPLACE FUNCTION get_service_booked_count(
  p_restaurant_id UUID,
  p_date DATE,
  p_time TIME
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_lunch_cutoff TIME := '15:00:00';
  v_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(r.number_of_guests), 0)
  INTO v_count
  FROM reservations r
  WHERE r.restaurant_id = p_restaurant_id
    AND r.reservation_date = p_date
    AND r.status IN ('pending', 'confirmed')
    AND (
      (p_time < v_lunch_cutoff AND r.reservation_time < v_lunch_cutoff)
      OR
      (p_time >= v_lunch_cutoff AND r.reservation_time >= v_lunch_cutoff)
    );
  
  RETURN v_count;
END;
$$;

-- Fonction: Trouver des créneaux alternatifs
CREATE OR REPLACE FUNCTION find_alternative_slots(
  p_restaurant_id UUID,
  p_date DATE,
  p_party_size INTEGER,
  p_days_ahead INTEGER DEFAULT 3
)
RETURNS TABLE (
  available_date DATE,
  service_type TEXT,
  available_capacity INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(p_date, p_date + p_days_ahead, '1 day'::interval)::DATE as check_date
  ),
  services AS (
    SELECT 'lunch' as svc, '12:00:00'::TIME as svc_time
    UNION ALL
    SELECT 'dinner' as svc, '20:00:00'::TIME as svc_time
  )
  SELECT 
    d.check_date as available_date,
    s.svc as service_type,
    (
      CASE 
        WHEN s.svc = 'lunch' THEN r.max_capacity_lunch
        ELSE r.max_capacity_dinner
      END
      - COALESCE((
        SELECT SUM(res.number_of_guests)
        FROM reservations res
        WHERE res.restaurant_id = p_restaurant_id
          AND res.reservation_date = d.check_date
          AND res.status IN ('pending', 'confirmed')
          AND (
            (s.svc = 'lunch' AND res.reservation_time < '15:00:00'::TIME)
            OR
            (s.svc = 'dinner' AND res.reservation_time >= '15:00:00'::TIME)
          )
      ), 0)
    )::INTEGER as available_capacity
  FROM date_range d
  CROSS JOIN services s
  CROSS JOIN restaurants r
  WHERE r.id = p_restaurant_id
  HAVING (
    CASE 
      WHEN s.svc = 'lunch' THEN r.max_capacity_lunch
      ELSE r.max_capacity_dinner
    END
    - COALESCE((
      SELECT SUM(res.number_of_guests)
      FROM reservations res
      WHERE res.restaurant_id = p_restaurant_id
        AND res.reservation_date = d.check_date
        AND res.status IN ('pending', 'confirmed')
        AND (
          (s.svc = 'lunch' AND res.reservation_time < '15:00:00'::TIME)
          OR
          (s.svc = 'dinner' AND res.reservation_time >= '15:00:00'::TIME)
        )
    ), 0)
  ) >= p_party_size
  ORDER BY d.check_date, s.svc;
END;
$$;

-- =============================================
-- VUES UTILES
-- =============================================

-- Vue pour les réservations nécessitant confirmation
CREATE OR REPLACE VIEW reservations_needs_confirmation AS
SELECT
  r.*,
  rest.name as restaurant_name,
  rest.user_id as restaurant_user_id
FROM reservations r
JOIN restaurants rest ON rest.id = r.restaurant_id
WHERE r.needs_confirmation = true
  AND r.status IN ('pending', 'confirmed');

-- Vue pour la waitlist active
CREATE OR REPLACE VIEW waitlist_active AS
SELECT
  w.*,
  rest.name as restaurant_name,
  rest.user_id as restaurant_user_id
FROM waitlist w
JOIN restaurants rest ON rest.id = w.restaurant_id
WHERE w.status IN ('waiting', 'needs_manager_call')
  AND w.desired_date >= CURRENT_DATE;

-- =============================================
-- COMMENTAIRES
-- =============================================

COMMENT ON COLUMN restaurants.max_capacity_lunch IS 'Capacité maximale pour le service du midi';
COMMENT ON COLUMN restaurants.max_capacity_dinner IS 'Capacité maximale pour le service du soir';
COMMENT ON COLUMN restaurants.fallback_phone IS 'Numéro de téléphone pour transfert vers humain';
COMMENT ON COLUMN restaurants.sms_enabled IS 'Activer/désactiver les SMS de confirmation';

COMMENT ON COLUMN reservations.confidence_score IS 'Score de confiance IA (0-1). < 0.7 nécessite confirmation manuelle';
COMMENT ON COLUMN reservations.needs_confirmation IS 'True si la réservation nécessite validation humaine';
COMMENT ON COLUMN reservations.cancellation_token IS 'Token unique pour lien d''annulation SMS';

COMMENT ON TABLE waitlist IS 'Liste d''attente pour les créneaux complets ou groupes > 8 personnes';
COMMENT ON FUNCTION fuzzy_search_reservations IS 'Recherche phonétique de réservations avec pg_trgm';
COMMENT ON FUNCTION check_duplicate_reservation IS 'Vérifie si une réservation existe déjà pour ce téléphone et cette date';
COMMENT ON FUNCTION get_service_capacity IS 'Retourne la capacité max du service (midi/soir) selon l''heure';
COMMENT ON FUNCTION get_service_booked_count IS 'Compte les couverts déjà réservés pour un service donné';
COMMENT ON FUNCTION find_alternative_slots IS 'Trouve des créneaux alternatifs disponibles';
