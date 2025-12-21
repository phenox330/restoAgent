/**
 * Script pour lister tous les assistants Vapi existants
 * Usage: npx tsx scripts/list-vapi-assistants.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;

async function listVapiAssistants() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant dans .env.local");
    process.exit(1);
  }

  console.log("🔍 Récupération des assistants Vapi...\n");

  try {
    const response = await fetch("https://api.vapi.ai/assistant", {
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

    const assistants = await response.json();

    if (!assistants || assistants.length === 0) {
      console.log("⚠️  Aucun assistant Vapi trouvé");
      console.log("\n💡 Tu dois créer un assistant avec:");
      console.log("   npx tsx scripts/create-vapi-assistant.ts");
      process.exit(0);
    }

    console.log(`✅ ${assistants.length} assistant(s) trouvé(s):\n`);

    assistants.forEach((assistant: any, index: number) => {
      const functionsCount = assistant.model?.functions?.length || assistant.functions?.length || 0;
      console.log(`${index + 1}. ${assistant.name || "Sans nom"}`);
      console.log(`   ID: ${assistant.id}`);
      console.log(`   Server URL: ${assistant.serverUrl || "Non configurée"}`);
      console.log(`   Restaurant ID: ${assistant.metadata?.restaurant_id || "Non configuré"}`);
      console.log(`   Fonctions: ${functionsCount}`);
      console.log(`   🔗 https://dashboard.vapi.ai/assistants/${assistant.id}`);
      console.log("");
    });

    console.log("💡 Pour mettre à jour un assistant, utilise:");
    console.log("   npx tsx scripts/update-vapi-assistant-full.ts");
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

listVapiAssistants().catch(console.error);
