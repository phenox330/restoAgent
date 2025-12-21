/**
 * Script pour vérifier si un restaurant existe dans Supabase
 * Usage: npx tsx scripts/check-restaurant.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRestaurant() {
  console.log("🔍 Vérification des restaurants dans Supabase...\n");

  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log("⚠️  Aucun restaurant trouvé dans la base de données");
    console.log("\n💡 Tu dois d'abord créer un restaurant dans l'interface:");
    console.log("   https://y-lemon-ten.vercel.app/dashboard/restaurant");
    process.exit(0);
  }

  console.log(`✅ ${restaurants.length} restaurant(s) trouvé(s):\n`);

  restaurants.forEach((restaurant, index) => {
    console.log(`${index + 1}. ${restaurant.name}`);
    console.log(`   ID: ${restaurant.id}`);
    console.log(`   Adresse: ${restaurant.address || "Non renseignée"}`);
    console.log(`   Téléphone: ${restaurant.phone || "Non renseigné"}`);
    console.log(`   Créé le: ${new Date(restaurant.created_at).toLocaleDateString("fr-FR")}`);
    console.log("");
  });

  if (restaurants.length === 1) {
    console.log("💡 Utilise cet ID pour configurer Vapi:");
    console.log(`   RESTAURANT_ID="${restaurants[0].id}"`);
  } else {
    console.log("💡 Choisis l'ID du restaurant que tu veux utiliser avec Vapi");
  }
}

checkRestaurant().catch(console.error);
