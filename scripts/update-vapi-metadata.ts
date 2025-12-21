/**
 * Script pour mettre à jour les metadata d'un assistant Vapi
 * Usage: npx tsx scripts/update-vapi-metadata.ts
 */

// Charger dotenv AVANT tous les imports ES6
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";
const NEW_RESTAURANT_ID = "fd796afe-61aa-42e3-b2f4-4438a258638b";

async function updateVapiMetadata() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant dans .env.local");
    process.exit(1);
  }

  console.log(`🔄 Mise à jour de l'assistant ${ASSISTANT_ID}...`);
  console.log(`🏪 Nouveau restaurant_id: ${NEW_RESTAURANT_ID}`);

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      metadata: {
        restaurant_id: NEW_RESTAURANT_ID,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ Erreur:", error);
    process.exit(1);
  }

  const assistant = await response.json();

  console.log("");
  console.log("✅ Assistant mis à jour avec succès !");
  console.log("");
  console.log("📋 Détails:");
  console.log("  ID:", assistant.id);
  console.log("  Nom:", assistant.name);
  console.log("  Server URL:", assistant.serverUrl);
  console.log("  Metadata:", JSON.stringify(assistant.metadata, null, 2));
  console.log("");
  console.log("🔗 Dashboard Vapi:");
  console.log(`  https://dashboard.vapi.ai/assistants/${assistant.id}`);
}

updateVapiMetadata().catch(console.error);
