-- =============================================
-- Migration: SMS Reminder Tracking
-- Description: Ajoute le tracking des rappels SMS envoyés
--   - Champ reminder_sent_at pour éviter les doublons
--   - Index pour les requêtes de rappel
-- =============================================

-- Ajout du champ pour tracker les rappels SMS envoyés
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Index partiel pour trouver rapidement les réservations sans rappel envoyé
-- Utilisé par le cron job de rappels
CREATE INDEX IF NOT EXISTS idx_reservations_reminder_sent 
ON reservations(reminder_sent_at) 
WHERE reminder_sent_at IS NULL;

-- Index composite pour la requête du cron job
-- (réservations confirmées pour demain, sans rappel envoyé)
CREATE INDEX IF NOT EXISTS idx_reservations_reminder_pending
ON reservations(reservation_date, status, reminder_sent_at)
WHERE status = 'confirmed' AND reminder_sent_at IS NULL;

-- Commentaire sur la colonne
COMMENT ON COLUMN reservations.reminder_sent_at IS 'Timestamp de l''envoi du SMS de rappel (24h avant). NULL si non envoyé.';



