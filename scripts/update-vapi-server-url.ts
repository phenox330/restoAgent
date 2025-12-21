/**
 * Script pour mettre à jour la Server URL d'un assistant Vapi
 * Usage: npx tsx scripts/update-vapi-server-url.ts <assistant-id> <new-url>
 */

// Charger dotenv AVANT d'utiliser les variables d'environnement
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;

async function updateVapiServerUrl(assistantId: string, serverUrl: string) {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant dans .env.local");
    process.exit(1);
  }

  console.log(`🔄 Mise à jour de l'assistant ${assistantId}...`);
  console.log(`📡 Nouvelle URL: ${serverUrl}`);

  const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serverUrl: serverUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ Erreur:", error);
    process.exit(1);
  }

  const assistant = await response.json();

  console.log("✅ Assistant mis à jour avec succès !");
  console.log("");
  console.log("📋 Détails:");
  console.log("ID:", assistant.id);
  console.log("Nom:", assistant.name);
  console.log("Server URL:", assistant.serverUrl);
  console.log("");
  console.log("🔗 Dashboard:");
  console.log(`https://dashboard.vapi.ai/assistants/${assistant.id}`);
}

// Récupérer les arguments
const assistantId = process.argv[2];
const serverUrl = process.argv[3];

if (!assistantId || !serverUrl) {
  console.error("❌ Usage: npx tsx scripts/update-vapi-server-url.ts <assistant-id> <server-url>");
  console.error("");
  console.error("Exemple:");
  console.error("  npx tsx scripts/update-vapi-server-url.ts c4680ebd-e816-4cf6-b7bd-42e47d64b0e8 https://curvy-bottles-matter.loca.lt/api/webhooks/vapi");
  process.exit(1);
}

updateVapiServerUrl(assistantId, serverUrl).catch(console.error);
