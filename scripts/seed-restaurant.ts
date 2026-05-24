/**
 * Script de seed manuel pour initialiser le restaurant Fernand
 *
 * Ce script crée le restaurant avec ID fixe et configuration de base.
 * Utilise SUPABASE_SERVICE_ROLE_KEY pour bypasser RLS.
 *
 * Usage:
 *   npx tsx scripts/seed-restaurant.ts
 */

const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Configuration du restaurant
const RESTAURANT_ID = "3c7a5ee5-b778-497f-9ed0-7309136dc587";
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"; // User ID factice pour démo

const RESTAURANT_DATA = {
  id: RESTAURANT_ID,
  user_id: DEMO_USER_ID,
  name: "Restaurant Fernand",
  email: "contact@fernand.fr",
  phone: "+33939035450",
  address: "123 Rue de la Gastronomie, 75001 Paris",
  max_capacity: 40, // 40 couverts maximum
  default_reservation_duration: 90, // 90 minutes par défaut

  // Horaires d'ouverture (format JSON)
  opening_hours: {
    monday: {
      lunch: { start: "12:00", end: "14:00", capacity: 20 },
      dinner: { start: "19:00", end: "22:00", capacity: 30 }
    },
    tuesday: {
      lunch: { start: "12:00", end: "14:00", capacity: 20 },
      dinner: { start: "19:00", end: "22:00", capacity: 30 }
    },
    wednesday: {
      lunch: { start: "12:00", end: "14:00", capacity: 20 },
      dinner: { start: "19:00", end: "22:00", capacity: 30 }
    },
    thursday: {
      lunch: { start: "12:00", end: "14:00", capacity: 20 },
      dinner: { start: "19:00", end: "22:00", capacity: 30 }
    },
    friday: {
      lunch: { start: "12:00", end: "14:00", capacity: 20 },
      dinner: { start: "19:00", end: "23:00", capacity: 40 }
    },
    saturday: {
      lunch: { start: "12:00", end: "14:30", capacity: 25 },
      dinner: { start: "19:00", end: "23:00", capacity: 40 }
    },
    sunday: {
      // Fermé le dimanche
    }
  },

  // Jours de fermeture exceptionnels
  closed_dates: [
    "2026-01-01", // Nouvel an
    "2026-12-25", // Noël
    "2026-12-26"  // Lendemain de Noël
  ],

  // SMS activé pour confirmations
  sms_enabled: true
};

async function seedRestaurant() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Variables d'environnement manquantes:");
    console.error("   - NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
    console.error("   - SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_KEY ? "✓" : "✗");
    process.exit(1);
  }

  console.log("🌱 Seed du restaurant Fernand\n");
  console.log("📋 Configuration:");
  console.log(`   - Restaurant ID: ${RESTAURANT_ID}`);
  console.log(`   - Nom: ${RESTAURANT_DATA.name}`);
  console.log(`   - Capacité max: ${RESTAURANT_DATA.max_capacity} couverts`);
  console.log(`   - Durée réservation: ${RESTAURANT_DATA.default_reservation_duration} min`);
  console.log("");

  // 1. Créer un utilisateur factice dans auth.users si nécessaire
  console.log("👤 Création de l'utilisateur factice...");

  // Créer l'utilisateur via Supabase Admin API
  const createUserResponse = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users`,
    {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "demo@fernand.fr",
        password: "demo-password-fernand-2026",
        email_confirm: true,
        user_metadata: {
          name: "Demo User Fernand",
          role: "restaurant_owner"
        }
      })
    }
  );

  let actualUserId = DEMO_USER_ID;

  if (!createUserResponse.ok) {
    const errorText = await createUserResponse.text();

    // Si l'utilisateur existe déjà, récupérer son ID
    if (errorText.includes("already") || errorText.includes("exists")) {
      console.log("   ℹ️ Utilisateur demo@fernand.fr existe déjà, récupération de l'ID...");

      // Lister les users pour trouver celui avec cet email
      const listUsersResponse = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          }
        }
      );

      if (listUsersResponse.ok) {
        const usersData = await listUsersResponse.json();
        const demoUser = usersData.users?.find((u: any) => u.email === "demo@fernand.fr");

        if (demoUser) {
          actualUserId = demoUser.id;
          console.log(`   ✅ Utilisateur trouvé: ${actualUserId}`);
        } else {
          console.error("   ❌ Impossible de trouver l'utilisateur");
          process.exit(1);
        }
      }
    } else {
      console.error("   ❌ Erreur création utilisateur:", errorText);
      process.exit(1);
    }
  } else {
    const userData = await createUserResponse.json();
    actualUserId = userData.id;
    console.log(`   ✅ Utilisateur créé: ${actualUserId}`);
  }

  // Mettre à jour RESTAURANT_DATA avec le vrai user_id
  RESTAURANT_DATA.user_id = actualUserId;

  // 2. Vérifier si le restaurant existe déjà
  console.log("\n🏪 Vérification du restaurant...");

  const checkRestaurantResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/restaurants?id=eq.${RESTAURANT_ID}&select=id`,
    {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    }
  );

  const existingRestaurants = await checkRestaurantResponse.json();

  if (existingRestaurants && existingRestaurants.length > 0) {
    console.log("   ⚠️ Restaurant existe déjà, mise à jour...");

    // Mettre à jour le restaurant
    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/restaurants?id=eq.${RESTAURANT_ID}`,
      {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          name: RESTAURANT_DATA.name,
          email: RESTAURANT_DATA.email,
          phone: RESTAURANT_DATA.phone,
          address: RESTAURANT_DATA.address,
          max_capacity: RESTAURANT_DATA.max_capacity,
          default_reservation_duration: RESTAURANT_DATA.default_reservation_duration,
          opening_hours: RESTAURANT_DATA.opening_hours,
          closed_dates: RESTAURANT_DATA.closed_dates,
          sms_enabled: RESTAURANT_DATA.sms_enabled
        })
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error("   ❌ Erreur mise à jour:", error);
      process.exit(1);
    }

    console.log("   ✅ Restaurant mis à jour");
  } else {
    console.log("   📝 Création du restaurant...");

    // Créer le restaurant
    const createResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/restaurants`,
      {
        method: "POST",
        headers: {
          "apikey": SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(RESTAURANT_DATA)
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error("   ❌ Erreur création restaurant:", error);
      process.exit(1);
    }

    const created = await createResponse.json();
    console.log("   ✅ Restaurant créé:", created[0]?.id);
  }

  // 3. Résumé
  console.log("\n✅ Seed terminé avec succès !\n");
  console.log("📊 Résumé:");
  console.log(`   - Restaurant ID: ${RESTAURANT_ID}`);
  console.log(`   - User ID: ${DEMO_USER_ID}`);
  console.log(`   - Nom: ${RESTAURANT_DATA.name}`);
  console.log(`   - Téléphone: ${RESTAURANT_DATA.phone}`);
  console.log("");
  console.log("📅 Horaires configurés:");
  console.log("   - Lundi-Jeudi: 12h-14h (déj) / 19h-22h (dîner)");
  console.log("   - Vendredi: 12h-14h (déj) / 19h-23h (dîner)");
  console.log("   - Samedi: 12h-14h30 (déj) / 19h-23h (dîner)");
  console.log("   - Dimanche: FERMÉ");
  console.log("");
  console.log("🎉 Le restaurant est prêt pour les tests !");
}

seedRestaurant().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});
