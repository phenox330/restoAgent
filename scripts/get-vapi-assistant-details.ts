/**
 * Script pour récupérer tous les détails d'un assistant Vapi
 * Usage: npx tsx scripts/get-vapi-assistant-details.ts <assistant-id>
 */

// Charger dotenv AVANT tous les imports ES6
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = process.argv[2];

async function getAssistantDetails() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant dans .env.local");
    process.exit(1);
  }

  if (!ASSISTANT_ID) {
    console.error("❌ Usage: npx tsx scripts/get-vapi-assistant-details.ts <assistant-id>");
    process.exit(1);
  }

  console.log(`🔍 Récupération des détails de l'assistant ${ASSISTANT_ID}...\n`);

  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Erreur:", error);
      process.exit(1);
    }

    const assistant = await response.json();

    console.log("📋 Configuration complète:\n");
    console.log(JSON.stringify(assistant, null, 2));

    console.log("\n\n=== RÉSUMÉ ===\n");
    console.log(`Nom: ${assistant.name || "Sans nom"}`);
    console.log(`ID: ${assistant.id}`);
    console.log(`Server URL: ${assistant.serverUrl || "Non configurée"}`);
    console.log(`Restaurant ID: ${assistant.metadata?.restaurant_id || "Non configuré"}`);
    console.log(`\nFonctions (model.functions): ${assistant.model?.functions?.length || 0}`);
    if (assistant.model?.functions) {
      assistant.model.functions.forEach((fn: any, i: number) => {
        console.log(`  ${i + 1}. ${fn.name}`);
      });
    }
    console.log(`\nFonctions (tools): ${assistant.model?.tools?.length || 0}`);
    if (assistant.model?.tools) {
      assistant.model.tools.forEach((tool: any, i: number) => {
        console.log(`  ${i + 1}. ${tool.type} - ${tool.function?.name || "N/A"}`);
      });
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

getAssistantDetails().catch(console.error);
