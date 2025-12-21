-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: restaurants
-- =============================================
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,

  -- Configuration
  max_capacity INTEGER NOT NULL DEFAULT 50,
  default_reservation_duration INTEGER NOT NULL DEFAULT 90, -- en minutes

  -- Horaires (JSON pour flexibilité)
  -- Format: { "monday": { "lunch": { "start": "12:00", "end": "14:00" }, "dinner": { "start": "19:00", "end": "22:00" } }, ... }
  opening_hours JSONB NOT NULL DEFAULT '{}',

  -- Jours de fermeture exceptionnels
  -- Format: ["2024-12-25", "2024-01-01"]
  closed_dates JSONB NOT NULL DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT phone_format CHECK (phone ~ '^[0-9+\-\s()]+$')
);

-- Index pour recherche rapide par user_id
CREATE INDEX idx_restaurants_user_id ON restaurants(user_id);

-- =============================================
-- TABLE: reservations
-- =============================================
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE reservation_source AS ENUM ('phone', 'web', 'manual');

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  -- Informations client
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- Détails réservation
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  number_of_guests INTEGER NOT NULL CHECK (number_of_guests > 0),
  duration INTEGER NOT NULL DEFAULT 90, -- en minutes

  -- Statut et source
  status reservation_status NOT NULL DEFAULT 'pending',
  source reservation_source NOT NULL DEFAULT 'phone',

  -- Notes
  special_requests TEXT,
  internal_notes TEXT,

  -- Référence appel Vapi (si applicable)
  call_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT phone_format CHECK (customer_phone ~ '^[0-9+\-\s()]+$'),
  CONSTRAINT valid_date CHECK (reservation_date >= CURRENT_DATE)
);

-- Index pour recherches fréquentes
CREATE INDEX idx_reservations_restaurant_id ON reservations(restaurant_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_restaurant_date ON reservations(restaurant_id, reservation_date);

-- =============================================
-- TABLE: calls
-- =============================================
CREATE TYPE call_status AS ENUM ('in_progress', 'completed', 'failed');

CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  -- Vapi call ID
  vapi_call_id TEXT UNIQUE,

  -- Informations appel
  phone_number TEXT NOT NULL,
  duration INTEGER, -- en secondes
  status call_status NOT NULL DEFAULT 'in_progress',

  -- Transcription et résumé
  transcript TEXT,
  summary TEXT,

  -- Métadonnées Vapi
  vapi_metadata JSONB,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT phone_format CHECK (phone_number ~ '^[0-9+\-\s()]+$')
);

-- Index pour recherches
CREATE INDEX idx_calls_restaurant_id ON calls(restaurant_id);
CREATE INDEX idx_calls_vapi_call_id ON calls(vapi_call_id);
CREATE INDEX idx_calls_started_at ON calls(started_at);

-- Relation optionnelle avec reservations
ALTER TABLE reservations
  ADD CONSTRAINT fk_reservations_call
  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE SET NULL;

-- =============================================
-- FONCTION: updated_at trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES: restaurants
-- =============================================

-- Les utilisateurs peuvent voir leurs propres restaurants
CREATE POLICY "Users can view own restaurants"
  ON restaurants FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres restaurants
CREATE POLICY "Users can create own restaurants"
  ON restaurants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres restaurants
CREATE POLICY "Users can update own restaurants"
  ON restaurants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres restaurants
CREATE POLICY "Users can delete own restaurants"
  ON restaurants FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- POLICIES: reservations
-- =============================================

-- Les utilisateurs peuvent voir les réservations de leurs restaurants
CREATE POLICY "Users can view reservations of own restaurants"
  ON reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = reservations.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent créer des réservations pour leurs restaurants
CREATE POLICY "Users can create reservations for own restaurants"
  ON reservations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = reservations.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent modifier les réservations de leurs restaurants
CREATE POLICY "Users can update reservations of own restaurants"
  ON reservations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = reservations.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = reservations.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent supprimer les réservations de leurs restaurants
CREATE POLICY "Users can delete reservations of own restaurants"
  ON reservations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = reservations.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- =============================================
-- POLICIES: calls
-- =============================================

-- Les utilisateurs peuvent voir les appels de leurs restaurants
CREATE POLICY "Users can view calls of own restaurants"
  ON calls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = calls.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent créer des appels pour leurs restaurants
CREATE POLICY "Users can create calls for own restaurants"
  ON calls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = calls.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent modifier les appels de leurs restaurants
CREATE POLICY "Users can update calls of own restaurants"
  ON calls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = calls.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = calls.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent supprimer les appels de leurs restaurants
CREATE POLICY "Users can delete calls of own restaurants"
  ON calls FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = calls.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- =============================================
-- VUES UTILES
-- =============================================

-- Vue pour les réservations du jour avec infos restaurant
CREATE OR REPLACE VIEW reservations_today AS
SELECT
  r.*,
  rest.name as restaurant_name,
  rest.user_id as restaurant_user_id
FROM reservations r
JOIN restaurants rest ON rest.id = r.restaurant_id
WHERE r.reservation_date = CURRENT_DATE;

-- Vue pour les statistiques de réservations
CREATE OR REPLACE VIEW reservation_stats AS
SELECT
  restaurant_id,
  COUNT(*) as total_reservations,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  COUNT(*) FILTER (WHERE status = 'no_show') as no_show_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  AVG(number_of_guests) as avg_guests
FROM reservations
GROUP BY restaurant_id;
