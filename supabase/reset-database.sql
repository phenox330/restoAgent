-- =============================================
-- SCRIPT DE RESET COMPLET DE LA BASE DE DONNÉES
-- ⚠️  ATTENTION : Ce script supprime TOUTES les données
-- =============================================

-- Désactiver les contraintes de clés étrangères temporairement
SET session_replication_role = 'replica';

-- =============================================
-- SUPPRIMER LES TABLES (dans l'ordre inverse des dépendances)
-- =============================================

DROP TABLE IF EXISTS waitlist CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- =============================================
-- SUPPRIMER LES VUES
-- =============================================

DROP VIEW IF EXISTS waitlist_active CASCADE;
DROP VIEW IF EXISTS reservations_needs_confirmation CASCADE;
DROP VIEW IF EXISTS reservation_stats CASCADE;
DROP VIEW IF EXISTS reservations_today CASCADE;

-- =============================================
-- SUPPRIMER LES FONCTIONS
-- =============================================

DROP FUNCTION IF EXISTS find_alternative_slots(UUID, DATE, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_service_booked_count(UUID, DATE, TIME) CASCADE;
DROP FUNCTION IF EXISTS get_service_capacity(UUID, TIME) CASCADE;
DROP FUNCTION IF EXISTS check_duplicate_reservation(UUID, TEXT, DATE) CASCADE;
DROP FUNCTION IF EXISTS fuzzy_search_reservations(UUID, TEXT, TEXT, FLOAT) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =============================================
-- SUPPRIMER LES TYPES ENUM
-- =============================================

DROP TYPE IF EXISTS waitlist_status CASCADE;
DROP TYPE IF EXISTS call_status CASCADE;
DROP TYPE IF EXISTS reservation_source CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;

-- =============================================
-- SUPPRIMER LES EXTENSIONS (optionnel - commenté par défaut)
-- =============================================

-- DÉCOMMENTEZ CES LIGNES SI VOUS VOULEZ SUPPRIMER LES EXTENSIONS AUSSI
-- DROP EXTENSION IF EXISTS pg_trgm CASCADE;
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- =============================================
-- MESSAGE DE CONFIRMATION
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Base de données réinitialisée avec succès !';
  RAISE NOTICE 'Vous pouvez maintenant exécuter les migrations :';
  RAISE NOTICE '  npx supabase db push';
END $$;
