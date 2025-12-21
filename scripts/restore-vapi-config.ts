/**
 * Restaure la configuration Vapi qui fonctionne
 * Usage: npx tsx scripts/restore-vapi-config.ts [chemin-vers-backup.json]
 * Par défaut, utilise backups/vapi-config-working-LATEST.json
 */

// Charger dotenv AVANT tous les imports ES6
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

// Maintenant les imports ES6 peuvent utiliser les variables d'environnement
import { readFileSync, existsSync } from "fs";

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";

async function restoreConfig() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant");
    process.exit(1);
  }

  // Chemin du backup (argument ou LATEST par défaut)
  const backupPath = process.argv[2] || 'backups/vapi-config-working-LATEST.json';

  if (!existsSync(backupPath)) {
    console.error(`❌ Fichier de backup introuvable: ${backupPath}`);
    process.exit(1);
  }

  console.log(`🔄 Restauration de la configuration depuis: ${backupPath}`);
  console.log("");

  const backupConfig = JSON.parse(readFileSync(backupPath, 'utf-8'));

  // Retirer les champs qui ne doivent pas être modifiés
  const { id, orgId, createdAt, updatedAt, ...configToRestore } = backupConfig;

  console.log("📋 Configuration à restaurer:");
  console.log(`  - Modèle: ${configToRestore.model?.model}`);
  console.log(`  - Voix: ${configToRestore.voice?.provider} / ${configToRestore.voice?.voiceId}`);
  console.log(`  - Fonctions: ${configToRestore.model?.functions?.length || 0}`);
  console.log("");

  // Demander confirmation
  console.log("⚠️  Cette opération va ÉCRASER la configuration actuelle de l'assistant.");
  console.log("Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes...");

  await new Promise(resolve => setTimeout(resolve, 5000));

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(configToRestore),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ Erreur lors de la restauration:", error);
    process.exit(1);
  }

  console.log("✅ Configuration restaurée avec succès !");
  console.log("");
  console.log("🔗 Dashboard:");
  console.log(`https://dashboard.vapi.ai/assistants/${ASSISTANT_ID}`);
  console.log("");
  console.log("💡 Testez l'assistant pour vérifier que tout fonctionne.");
}

restoreConfig().catch(console.error);
