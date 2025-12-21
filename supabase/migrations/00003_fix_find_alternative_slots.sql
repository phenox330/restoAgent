-- =============================================
-- Migration: Fix find_alternative_slots function
-- Description: Corrige l'erreur GROUP BY dans la fonction
-- =============================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS find_alternative_slots(UUID, DATE, INTEGER, INTEGER);

-- Recréer la fonction corrigée
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
DECLARE
  v_check_date DATE;
  v_service TEXT;
  v_max_cap INTEGER;
  v_booked INTEGER;
  v_available INTEGER;
  v_lunch_cap INTEGER;
  v_dinner_cap INTEGER;
BEGIN
  -- Récupérer les capacités du restaurant
  SELECT max_capacity_lunch, max_capacity_dinner
  INTO v_lunch_cap, v_dinner_cap
  FROM restaurants
  WHERE id = p_restaurant_id;

  -- Si restaurant non trouvé, retourner vide
  IF v_lunch_cap IS NULL THEN
    RETURN;
  END IF;

  -- Parcourir les jours
  FOR i IN 0..p_days_ahead LOOP
    v_check_date := p_date + i;

    -- Vérifier le service MIDI
    v_max_cap := v_lunch_cap;
    
    SELECT COALESCE(SUM(number_of_guests), 0)
    INTO v_booked
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
      AND reservation_date = v_check_date
      AND status IN ('pending', 'confirmed')
      AND reservation_time < '15:00:00'::TIME;

    v_available := v_max_cap - v_booked;

    IF v_available >= p_party_size THEN
      available_date := v_check_date;
      service_type := 'lunch';
      available_capacity := v_available;
      RETURN NEXT;
    END IF;

    -- Vérifier le service SOIR
    v_max_cap := v_dinner_cap;
    
    SELECT COALESCE(SUM(number_of_guests), 0)
    INTO v_booked
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
      AND reservation_date = v_check_date
      AND status IN ('pending', 'confirmed')
      AND reservation_time >= '15:00:00'::TIME;

    v_available := v_max_cap - v_booked;

    IF v_available >= p_party_size THEN
      available_date := v_check_date;
      service_type := 'dinner';
      available_capacity := v_available;
      RETURN NEXT;
    END IF;

  END LOOP;

  RETURN;
END;
$$;

COMMENT ON FUNCTION find_alternative_slots IS 'Trouve des créneaux alternatifs disponibles (version corrigée)';
