-- =============================================
-- Migration 00008: Bot on/off toggle
-- Description: Permet d'activer/désactiver l'agent vocal par restaurant.
--   OFF → les appels sont transférés vers fallback_phone (gestion manuelle),
--   via reconfiguration du numéro Vapi (fallbackDestination).
-- =============================================

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS bot_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN restaurants.bot_enabled IS
  'Si true, l''agent vocal gère les appels. Si false, les appels sont transférés vers fallback_phone (gestion manuelle).';
