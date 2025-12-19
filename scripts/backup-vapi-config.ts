/**
 * Sauvegarde la configuration Vapi actuelle (qui fonctionne !)
 */

import { config } from "dotenv";
import { resolve } from "path";
import { writeFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";

async function backupConfig() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant");
    process.exit(1);
  }

  console.log("💾 Sauvegarde de la configuration Vapi actuelle...");

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    headers: { Authorization: `Bearer ${VAPI_API_KEY}` },
  });

  if (!response.ok) {
    console.error("❌ Erreur lors de la récupération de la config");
    process.exit(1);
  }

  const config = await response.json();

  // Sauvegarder avec timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backups/vapi-config-working-${timestamp}.json`;

  writeFileSync(filename, JSON.stringify(config, null, 2));
  console.log(`✅ Configuration sauvegardée dans: ${filename}`);

  // Sauvegarder aussi comme "latest"
  writeFileSync('backups/vapi-config-working-LATEST.json', JSON.stringify(config, null, 2));
  console.log(`✅ Copie de sécurité: backups/vapi-config-working-LATEST.json`);

  console.log("");
  console.log("📋 Résumé de la config sauvegardée:");
  console.log(`  - Modèle: ${config.model?.model}`);
  console.log(`  - Voix: ${config.voice?.provider} / ${config.voice?.voiceId}`);
  console.log(`  - Fonctions: ${config.model?.functions?.length || 0}`);
  console.log(`  - Server URL: ${config.serverUrl}`);
}

backupConfig().catch(console.error);
