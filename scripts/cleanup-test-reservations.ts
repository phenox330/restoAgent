/**
 * Script pour supprimer les réservations de test
 * Usage: npx tsx scripts/cleanup-test-reservations.ts
 *
 * Cible les réservations créées par les scripts de test
 * (téléphone +33612345678). Affiche un aperçu avant suppression.
 */

// Charger dotenv AVANT tous les imports ES6
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const TEST_PHONE = "+33612345678";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanup() {
  console.log(`🧹 Nettoyage des réservations de test (${TEST_PHONE})\n`);

  const { data: toDelete, error: selectError } = await supabase
    .from("reservations")
    .select("id, customer_name, reservation_date, reservation_time, number_of_guests, status")
    .eq("customer_phone", TEST_PHONE);

  if (selectError) {
    console.error("❌ Erreur lecture:", selectError.message);
    process.exit(1);
  }

  if (!toDelete || toDelete.length === 0) {
    console.log("✅ Aucune réservation de test à supprimer. Base déjà propre.");
    process.exit(0);
  }

  console.log(`📋 ${toDelete.length} réservation(s) à supprimer:\n`);
  toDelete.forEach((r, i) => {
    console.log(
      `   ${i + 1}. ${r.reservation_date} ${r.reservation_time} - ${r.number_of_guests} pers. (${r.status}) [${r.customer_name}]`
    );
  });

  const { error: deleteError } = await supabase
    .from("reservations")
    .delete()
    .eq("customer_phone", TEST_PHONE);

  if (deleteError) {
    console.error("\n❌ Erreur suppression:", deleteError.message);
    process.exit(1);
  }

  console.log(`\n✅ ${toDelete.length} réservation(s) de test supprimée(s).`);
}

cleanup().catch(console.error);
