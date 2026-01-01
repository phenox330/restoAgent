-- Migration: Permettre phone_number NULL dans la table calls
-- Raison: Lors d'un appel (surtout webCall depuis dashboard Vapi),
--         le numéro de l'appelant n'est pas toujours disponible immédiatement

ALTER TABLE calls
  ALTER COLUMN phone_number DROP NOT NULL;

-- Note: La contrainte phone_format reste active pour valider le format
-- quand un numéro est fourni, mais autorise maintenant NULL
