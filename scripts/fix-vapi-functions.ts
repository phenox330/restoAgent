/**
 * Script pour CORRIGER l'assistant Vapi en ajoutant get_current_date
 * Usage: npx tsx scripts/fix-vapi-functions.ts <assistant-id> <server-url> <restaurant-id>
 */

// Charger dotenv AVANT tous les imports ES6
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = process.argv[2];
const SERVER_URL = process.argv[3];
const RESTAURANT_ID = process.argv[4];

async function fixVapiAssistant() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant");
    process.exit(1);
  }

  if (!ASSISTANT_ID || !SERVER_URL || !RESTAURANT_ID) {
    console.error("❌ Usage: npx tsx scripts/fix-vapi-functions.ts <assistant-id> <server-url> <restaurant-id>");
    console.error("Exemple: npx tsx scripts/fix-vapi-functions.ts abc123 https://y-lemon-ten.vercel.app/api/webhooks/vapi 12345");
    process.exit(1);
  }

  console.log(`🔧 Correction de l'assistant ${ASSISTANT_ID}...`);
  console.log(`📡 Server URL: ${SERVER_URL}`);
  console.log(`🏪 Restaurant ID: ${RESTAURANT_ID}`);

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serverUrl: SERVER_URL,

      metadata: {
        restaurant_id: RESTAURANT_ID,
      },

      model: {
        provider: "openai",
        model: "gpt-4o",
        functions: [
          {
            name: "get_current_date",
            description: "Obtient la date et l'heure actuelles. Utilise cette fonction quand le client dit 'demain', 'ce soir', 'jeudi prochain', etc. pour calculer la date exacte.",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "check_availability",
            description: "Vérifie la disponibilité du restaurant pour une date, heure et nombre de personnes donnés. À utiliser dès que tu as ces 3 informations, AVANT de créer la réservation.",
            parameters: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                  description: "Date au format YYYY-MM-DD (exemple: 2025-12-19)",
                },
                time: {
                  type: "string",
                  description: "Heure au format HH:mm (ex: 19:30)",
                },
                number_of_guests: {
                  type: "number",
                  description: "Nombre de personnes",
                },
              },
              required: ["date", "time", "number_of_guests"],
            },
          },
          {
            name: "create_reservation",
            description: "Crée la réservation dans le système. À utiliser UNIQUEMENT après avoir vérifié la disponibilité avec check_availability et obtenu confirmation qu'il y a de la place.",
            parameters: {
              type: "object",
              properties: {
                customer_name: {
                  type: "string",
                  description: "Nom complet du client",
                },
                customer_phone: {
                  type: "string",
                  description: "Numéro de téléphone du client",
                },
                customer_email: {
                  type: "string",
                  description: "Email du client (optionnel)",
                },
                date: {
                  type: "string",
                  description: "Date au format YYYY-MM-DD",
                },
                time: {
                  type: "string",
                  description: "Heure au format HH:mm",
                },
                number_of_guests: {
                  type: "number",
                  description: "Nombre de personnes",
                },
                special_requests: {
                  type: "string",
                  description: "Demandes spéciales mentionnées par le client (allergies, occasion spéciale, etc.)",
                },
              },
              required: ["customer_name", "customer_phone", "date", "time", "number_of_guests"],
            },
          },
          {
            name: "cancel_reservation",
            description: "Annule une réservation existante. Nécessite l'ID unique de la réservation.",
            parameters: {
              type: "object",
              properties: {
                reservation_id: {
                  type: "string",
                  description: "L'identifiant unique de la réservation à annuler",
                },
              },
              required: ["reservation_id"],
            },
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ Erreur:", error);
    process.exit(1);
  }

  const assistant = await response.json();

  console.log("✅ Assistant corrigé avec succès !");
  console.log("");
  console.log("📋 Fonctions maintenant disponibles:");
  console.log("  1. get_current_date - AJOUTÉE ✨");
  console.log("  2. check_availability");
  console.log("  3. create_reservation");
  console.log("  4. cancel_reservation");
  console.log("");
  console.log("🔗 Dashboard:");
  console.log(`https://dashboard.vapi.ai/assistants/${assistant.id}`);
  console.log("");
  console.log("✨ L'agent peut maintenant gérer les dates relatives (demain, ce soir, etc.) !");
}

fixVapiAssistant().catch(console.error);
