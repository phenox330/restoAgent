/**
 * Script de test pour le flow complet de détection de doublon
 * 
 * Ce script teste:
 * 1. Création d'une première réservation
 * 2. Détection d'un doublon lors de la création d'une deuxième réservation
 * 3. Création forcée avec force_create: true
 * 4. Modification d'une réservation existante
 * 
 * Usage: npx tsx scripts/test-duplicate-detection.ts [restaurant_id]
 */

// Charger dotenv AVANT tous les imports ES6
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

// Maintenant les imports ES6 peuvent utiliser les variables d'environnement
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import {
  handleCreateReservation,
  handleFindAndUpdateReservation,
} from "../lib/vapi/tools";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Données de test
const TEST_CUSTOMER = {
  name: "Test Client",
  phone: "+33612345678",
  email: "test@example.com",
};

const TEST_DATE = (() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD
})();

const TEST_TIME = "20:00";
const TEST_GUESTS = 4;

async function getRestaurantId(): Promise<string> {
  const restaurantIdArg = process.argv[2];

  if (restaurantIdArg) {
    // Vérifier que le restaurant existe
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("id, name")
      .eq("id", restaurantIdArg)
      .single();

    if (error || !restaurant) {
      console.error(`❌ Restaurant avec l'ID "${restaurantIdArg}" non trouvé`);
      process.exit(1);
    }

    console.log(`✅ Restaurant trouvé: ${restaurant.name} (${restaurant.id})\n`);
    return restaurant.id;
  }

  // Récupérer le premier restaurant disponible
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name")
    .limit(1);

  if (error || !restaurants || restaurants.length === 0) {
    console.error("❌ Aucun restaurant trouvé dans la base de données");
    console.log("\n💡 Créez d'abord un restaurant ou passez l'ID en argument:");
    console.log("   npx tsx scripts/test-duplicate-detection.ts <restaurant_id>");
    process.exit(1);
  }

  const restaurant = restaurants[0];
  console.log(`✅ Restaurant trouvé: ${restaurant.name} (${restaurant.id})\n`);
  return restaurant.id;
}

async function cleanupTestReservations(restaurantId: string) {
  console.log("🧹 Nettoyage des réservations de test existantes...\n");

  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("restaurant_id", restaurantId)
    .eq("customer_phone", TEST_CUSTOMER.phone)
    .eq("reservation_date", TEST_DATE);

  if (error) {
    console.warn("⚠️  Erreur lors du nettoyage:", error.message);
  } else {
    console.log("✅ Nettoyage terminé\n");
  }
}

async function testFlow(restaurantId: string) {
  console.log("=".repeat(60));
  console.log("🧪 TEST DU FLOW DE DÉTECTION DE DOUBLON");
  console.log("=".repeat(60));
  console.log(`\n📅 Date de test: ${TEST_DATE}`);
  console.log(`👤 Client: ${TEST_CUSTOMER.name} (${TEST_CUSTOMER.phone})`);
  console.log(`🕐 Heure: ${TEST_TIME}`);
  console.log(`👥 Nombre de personnes: ${TEST_GUESTS}\n`);

  // Nettoyer les réservations de test existantes
  await cleanupTestReservations(restaurantId);

  // ============================================
  // TEST 1: Création de la première réservation
  // ============================================
  console.log("📝 TEST 1: Création de la première réservation");
  console.log("-".repeat(60));

  const firstReservation = await handleCreateReservation({
    restaurant_id: restaurantId,
    customer_name: TEST_CUSTOMER.name,
    customer_phone: TEST_CUSTOMER.phone,
    customer_email: TEST_CUSTOMER.email,
    date: TEST_DATE,
    time: TEST_TIME,
    number_of_guests: TEST_GUESTS,
  });

  if (firstReservation.success) {
    console.log("✅ Première réservation créée avec succès");
    console.log(`   ID: ${firstReservation.reservation_id}`);
    console.log(`   Message: ${firstReservation.message}\n`);
  } else {
    console.error("❌ Échec de la création de la première réservation");
    console.error(`   Erreur: ${firstReservation.message}\n`);
    return;
  }

  // ============================================
  // TEST 2: Détection du doublon
  // ============================================
  console.log("🔍 TEST 2: Détection du doublon (même téléphone + même date)");
  console.log("-".repeat(60));

  const duplicateAttempt = await handleCreateReservation({
    restaurant_id: restaurantId,
    customer_name: TEST_CUSTOMER.name,
    customer_phone: TEST_CUSTOMER.phone,
    customer_email: TEST_CUSTOMER.email,
    date: TEST_DATE,
    time: "20:00", // Heure différente mais même date
    number_of_guests: 2, // Nombre différent
  });

  if (
    duplicateAttempt.success === false &&
    duplicateAttempt.has_existing_reservation === true
  ) {
    console.log("✅ Doublon détecté correctement");
    console.log(`   Message: ${duplicateAttempt.message}`);
    if (duplicateAttempt.existing_reservation) {
      console.log(
        `   Réservation existante: ${duplicateAttempt.existing_reservation.id}`
      );
      console.log(
        `   Heure existante: ${duplicateAttempt.existing_reservation.reservation_time}`
      );
      console.log(
        `   Personnes existantes: ${duplicateAttempt.existing_reservation.number_of_guests}`
      );
    }
    console.log("");
  } else {
    console.error("❌ ÉCHEC: Le doublon n'a pas été détecté");
    console.error(`   Résultat: ${JSON.stringify(duplicateAttempt, null, 2)}\n`);
    return;
  }

  // ============================================
  // TEST 3: Création forcée avec force_create
  // ============================================
  console.log("💪 TEST 3: Création forcée avec force_create: true");
  console.log("-".repeat(60));

  const forcedReservation = await handleCreateReservation({
    restaurant_id: restaurantId,
    customer_name: TEST_CUSTOMER.name,
    customer_phone: TEST_CUSTOMER.phone,
    customer_email: TEST_CUSTOMER.email,
    date: TEST_DATE,
    time: "20:00",
    number_of_guests: 2,
    force_create: true, // Force la création malgré le doublon
  });

  if (forcedReservation.success) {
    console.log("✅ Deuxième réservation créée avec force_create");
    console.log(`   ID: ${forcedReservation.reservation_id}`);
    console.log(`   Message: ${forcedReservation.message}\n`);
  } else {
    console.error("❌ Échec de la création forcée");
    console.error(`   Erreur: ${forcedReservation.message}\n`);
    // Ne pas retourner ici, continuer avec le test suivant
  }

  // ============================================
  // TEST 4: Modification d'une réservation existante
  // ============================================
  console.log("✏️  TEST 4: Modification d'une réservation existante");
  console.log("-".repeat(60));

  // Récupérer l'ID de la première réservation
  const { data: existingReservation } = await supabase
    .from("reservations")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("customer_phone", TEST_CUSTOMER.phone)
    .eq("reservation_date", TEST_DATE)
    .eq("reservation_time", TEST_TIME)
    .in("status", ["pending", "confirmed"])
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!existingReservation) {
    console.warn("⚠️  Impossible de trouver la réservation à modifier");
    console.log("   (Le test continue avec les autres scénarios)\n");
  } else {
    const updateResult = await handleFindAndUpdateReservation({
      restaurant_id: restaurantId,
      customer_name: TEST_CUSTOMER.name,
      customer_phone: TEST_CUSTOMER.phone,
      new_time: "21:00", // Modifier l'heure
      new_number_of_guests: 5, // Modifier le nombre de personnes
    });

    if (updateResult.success) {
      console.log("✅ Réservation modifiée avec succès");
      console.log(`   Message: ${updateResult.message}\n`);
    } else {
      console.error("❌ Échec de la modification");
      console.error(`   Erreur: ${updateResult.message}\n`);
    }
  }

  // ============================================
  // RÉSUMÉ
  // ============================================
  console.log("=".repeat(60));
  console.log("📊 RÉSUMÉ DES TESTS");
  console.log("=".repeat(60));

  // Vérifier combien de réservations existent maintenant
  const { data: finalReservations, count } = await supabase
    .from("reservations")
    .select("id, reservation_time, number_of_guests, status", { count: "exact" })
    .eq("restaurant_id", restaurantId)
    .eq("customer_phone", TEST_CUSTOMER.phone)
    .eq("reservation_date", TEST_DATE)
    .in("status", ["pending", "confirmed"]);

  console.log(`\n📋 Réservations finales pour ${TEST_DATE}: ${count || 0}`);
  if (finalReservations && finalReservations.length > 0) {
    finalReservations.forEach((res, index) => {
      console.log(
        `   ${index + 1}. ${res.reservation_time} - ${res.number_of_guests} personnes (${res.status})`
      );
    });
  }

  console.log("\n✅ Tests terminés!");
  console.log("\n💡 Pour nettoyer les réservations de test:");
  console.log(
    `   DELETE FROM reservations WHERE customer_phone = '${TEST_CUSTOMER.phone}' AND reservation_date = '${TEST_DATE}';`
  );
}

async function main() {
  try {
    const restaurantId = await getRestaurantId();
    await testFlow(restaurantId);
  } catch (error) {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  }
}

main();
