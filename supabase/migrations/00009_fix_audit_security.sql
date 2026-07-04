-- =============================================
-- 00009 — Corrections de sécurité issues de l'audit
-- =============================================
-- Corrige 3 problèmes bloquants :
--   1. Policies RLS qui exposent les écritures à la clé anon publique
--   2. Vues publiques qui contournent RLS (fuite inter-restaurants)
--   3. Contrainte valid_date qui empêche de clôturer les réservations passées

-- ---------------------------------------------
-- 1. Supprimer les policies "service role" erronées
-- ---------------------------------------------
-- `auth.uid() IS NULL` est vrai pour TOUTE requête non authentifiée, y compris
-- celles faites avec la clé publique NEXT_PUBLIC_SUPABASE_ANON_KEY (livrée au
-- navigateur). Ces policies donnaient donc à n'importe qui le droit d'insérer et
-- de modifier les réservations de tous les restaurants.
-- Le service role bypasse RLS nativement : aucune policy n'est nécessaire pour lui.
DROP POLICY IF EXISTS "Service role can update all reservations" ON reservations;
DROP POLICY IF EXISTS "Service role can insert all reservations" ON reservations;

-- ---------------------------------------------
-- 2. Passer les vues en security_invoker
-- ---------------------------------------------
-- Par défaut une vue s'exécute avec les privilèges de son propriétaire et la RLS
-- des tables sous-jacentes n'est PAS appliquée. Ces vues exposées via PostgREST
-- laissaient donc tout utilisateur authentifié lire les données de tous les
-- restaurants. security_invoker = true fait appliquer la RLS de l'appelant.
ALTER VIEW reservations_today SET (security_invoker = true);
ALTER VIEW reservation_stats SET (security_invoker = true);
ALTER VIEW reservations_needs_confirmation SET (security_invoker = true);
ALTER VIEW waitlist_active SET (security_invoker = true);

-- ---------------------------------------------
-- 3. Corriger la contrainte valid_date
-- ---------------------------------------------
-- Postgres ré-évalue les CHECK à chaque UPDATE de la ligne. Avec
-- `reservation_date >= CURRENT_DATE`, une réservation d'hier ne peut plus être
-- passée en `completed`/`no_show` (le flux normal de fin de service échoue).
-- On conserve uniquement la règle structurelle (date requise sauf erreur
-- technique). La validation "date pas dans le passé" est faite côté application
-- à la création, pas comme contrainte de table.
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS valid_date;
ALTER TABLE reservations
  ADD CONSTRAINT valid_date
  CHECK (
    (request_type = 'technical_error' AND reservation_date IS NULL) OR
    (request_type != 'technical_error' AND reservation_date IS NOT NULL)
  );
