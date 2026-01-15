/**
 * Script pour afficher et préparer une migration SQL Supabase
 *
 * Usage:
 *   npx tsx scripts/run-migration.ts <migration-file>
 *   npx tsx scripts/run-migration.ts supabase/migrations/00006_add_request_type_to_reservations.sql
 *
 * Note: Ce script affiche le SQL à exécuter manuellement dans le dashboard Supabase.
 * L'exécution automatique nécessiterait une connexion PostgreSQL directe ou Supabase CLI.
 */

const { resolve } = require("path");
const { readFileSync } = require("fs");

async function displayMigration() {
  const migrationFile = process.argv[2] || "supabase/migrations/00006_add_request_type_to_reservations.sql";

  console.log("🗄️  Migration SQL - Story 1.2\n");
  console.log(`📄 Fichier: ${migrationFile}\n`);

  // Lire le fichier SQL
  let sqlContent: string;
  try {
    sqlContent = readFileSync(resolve(process.cwd(), migrationFile), "utf-8");
  } catch (error) {
    console.error("❌ Erreur lecture fichier:", error);
    console.error("   Assurez-vous que le fichier existe:", migrationFile);
    process.exit(1);
  }

  console.log("📋 Contenu SQL à exécuter:\n");
  console.log("╔" + "═".repeat(78) + "╗");
  sqlContent.split("\n").forEach(line => {
    console.log("║ " + line.padEnd(77) + "║");
  });
  console.log("╚" + "═".repeat(78) + "╝");
  console.log("");

  console.log("📝 Instructions d'exécution:\n");
  console.log("   1. Allez sur le SQL Editor de votre projet Supabase:");
  console.log("      👉 https://supabase.com/dashboard/project/_/sql/new\n");
  console.log("   2. Copiez le SQL ci-dessus dans l'éditeur\n");
  console.log("   3. Cliquez sur 'Run' pour exécuter la migration\n");
  console.log("   4. Vérifiez que l'exécution s'est bien passée (pas d'erreurs rouges)\n");

  console.log("✅ Migration prête à être appliquée !\n");
}

displayMigration().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});
