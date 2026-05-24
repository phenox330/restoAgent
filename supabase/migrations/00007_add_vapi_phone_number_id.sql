-- =============================================
-- Migration 00007: Multi-tenant Vapi routing
-- Description: Lie chaque restaurant à son numéro Vapi (phoneNumberId)
--   pour router les appels entrants vers le bon restaurant_id,
--   sans dépendre de la metadata hardcodée de l'assistant.
-- =============================================

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS vapi_phone_number_id TEXT;

-- Un numéro Vapi ne peut appartenir qu'à un seul restaurant
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_vapi_phone_number_id
  ON restaurants(vapi_phone_number_id)
  WHERE vapi_phone_number_id IS NOT NULL;

COMMENT ON COLUMN restaurants.vapi_phone_number_id IS
  'ID du numéro de téléphone Vapi (call.phoneNumberId) qui route les appels vers ce restaurant. Source de vérité pour le routing multi-tenant.';
