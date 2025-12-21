-- ⚠️ EXECUTE CES 2 COMMANDES DANS SUPABASE SQL EDITOR
-- Ne copie que ces 2 lignes, rien d'autre !

-- Policy 1: Permet au service role de modifier les réservations
CREATE POLICY "Service role can update all reservations"
  ON reservations FOR UPDATE
  USING (auth.role() = 'service_role');

-- Policy 2: Permet au service role de créer des réservations
CREATE POLICY "Service role can insert all reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
