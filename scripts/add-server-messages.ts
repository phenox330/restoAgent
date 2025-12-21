/**
 * Script pour ajouter serverMessages à l'assistant Vapi
 * Pour recevoir les événements call-started et call-ended
 */

// Charger dotenv AVANT tous les imports ES6
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";

async function addServerMessages() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant");
    process.exit(1);
  }

  console.log(`🔄 Ajout de serverMessages à l'assistant ${ASSISTANT_ID}...`);
  console.log("");

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serverMessages: [
        "conversation-update",
        "end-of-call-report",
        "function-call",
        "hang",
        "model-output",
        "phone-call-control",
        "speech-update",
        "status-update",
        "transcript",
        "tool-calls",
        "transfer-destination-request",
        "user-interrupted"
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ Erreur:", error);
    process.exit(1);
  }

  const assistant = await response.json();

  console.log("✅ serverMessages ajouté avec succès !");
  console.log("");
  console.log("📋 Événements configurés:");
  console.log(JSON.stringify(assistant.serverMessages || [], null, 2));
  console.log("");
  console.log("🔗 Dashboard:");
  console.log(`https://dashboard.vapi.ai/assistants/${assistant.id}`);
}

addServerMessages().catch(console.error);
