-- ⚠️ EXECUTE CES COMMANDES DANS SUPABASE SQL EDITOR

-- IMPORTANT: auth.role() retourne NULL pour le service role
-- On détecte le service role avec auth.uid() IS NULL

-- Supprimer les anciennes policies incorrectes
DROP POLICY IF EXISTS "Service role can update all reservations" ON reservations;
DROP POLICY IF EXISTS "Service role can insert all reservations" ON reservations;

-- Policy 1: Permet au service role de modifier les réservations
CREATE POLICY "Service role can update all reservations"
  ON reservations FOR UPDATE
  USING (auth.uid() IS NULL)
  WITH CHECK (auth.uid() IS NULL);

-- Policy 2: Permet au service role de créer des réservations
CREATE POLICY "Service role can insert all reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() IS NULL);
