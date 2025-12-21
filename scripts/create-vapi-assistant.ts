/**
 * Script pour créer un assistant Vapi automatiquement
 * Usage: npx tsx scripts/create-vapi-assistant.ts
 */

// Charger dotenv AVANT d'utiliser les variables d'environnement
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const RESTAURANT_ID = "TON_RESTAURANT_ID_ICI"; // À remplacer
const SERVER_URL = "https://famous-spiders-tan.loca.lt/api/webhooks/vapi";

async function createVapiAssistant() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant dans .env.local");
    process.exit(1);
  }

  console.log("🚀 Création de l'assistant Vapi...");

  const response = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Assistant Restaurant Test",

      // Configuration du modèle
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `Tu es l'assistant vocal d'un restaurant.

Ta mission est de prendre des réservations par téléphone de manière professionnelle et efficace.

PROCESSUS DE RÉSERVATION :
1. Accueille chaleureusement le client
2. Demande son nom complet
3. Demande la date souhaitée (exemple: "le 25 décembre")
4. Demande l'heure souhaitée (exemple: "19h30")
5. Demande le nombre de personnes
6. VÉRIFIE LA DISPONIBILITÉ avec la fonction check_availability
7. Si disponible :
   - Demande le numéro de téléphone du client
   - CRÉE LA RÉSERVATION avec create_reservation
   - CONFIRME tous les détails au client (nom, date, heure, nombre de personnes)
8. Si pas disponible :
   - Explique pourquoi (restaurant fermé, complet, etc.)
   - Propose d'autres créneaux horaires si possible

RÈGLES IMPORTANTES :
- Sois poli, chaleureux et professionnel
- Convertis TOUJOURS les dates au format YYYY-MM-DD (exemple: 25 décembre 2024 → 2024-12-25)
- Convertis TOUJOURS les heures au format HH:mm (exemple: 19h30 → 19:30)
- Répète TOUJOURS les détails de la réservation pour confirmation avant de créer
- Si le client donne une date relative (demain, jeudi prochain), calcule la date exacte
- Ne crée JAMAIS de réservation sans avoir vérifié la disponibilité d'abord`,
          },
        ],
      },

      // Voice configuration
      voice: {
        provider: "11labs",
        voiceId: "rachel",
      },

      // Server URL - C'EST ICI QU'ON LE MET !
      serverUrl: SERVER_URL,

      // Metadata avec le restaurant_id
      metadata: {
        restaurant_id: RESTAURANT_ID,
      },

      // Les 3 fonctions
      functions: [
        {
          name: "check_availability",
          description: "Vérifie si le restaurant a de la place disponible pour une réservation à une date et heure données. À utiliser AVANT de créer une réservation.",
          parameters: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description: "Date de la réservation au format YYYY-MM-DD (exemple: 2024-12-25)",
              },
              time: {
                type: "string",
                description: "Heure de la réservation au format HH:mm (exemple: 19:30)",
              },
              number_of_guests: {
                type: "number",
                description: "Nombre de personnes pour la réservation",
              },
            },
            required: ["date", "time", "number_of_guests"],
          },
        },
        {
          name: "create_reservation",
          description: "Crée une nouvelle réservation pour le client. À utiliser UNIQUEMENT après avoir vérifié la disponibilité avec check_availability.",
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
                description: "Adresse email du client (optionnel)",
              },
              date: {
                type: "string",
                description: "Date de la réservation au format YYYY-MM-DD",
              },
              time: {
                type: "string",
                description: "Heure de la réservation au format HH:mm",
              },
              number_of_guests: {
                type: "number",
                description: "Nombre de personnes",
              },
              special_requests: {
                type: "string",
                description: "Demandes spéciales du client (allergies, anniversaire, etc.)",
              },
            },
            required: ["customer_name", "customer_phone", "date", "time", "number_of_guests"],
          },
        },
        {
          name: "cancel_reservation",
          description: "Annule une réservation existante en utilisant son ID unique.",
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
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ Erreur:", error);
    process.exit(1);
  }

  const assistant = await response.json();

  console.log("✅ Assistant créé avec succès !");
  console.log("");
  console.log("📋 Détails de l'assistant :");
  console.log("ID:", assistant.id);
  console.log("Nom:", assistant.name);
  console.log("Server URL:", assistant.serverUrl);
  console.log("");
  console.log("🔗 Lien dashboard:");
  console.log(`https://dashboard.vapi.ai/assistants/${assistant.id}`);
  console.log("");
  console.log("💡 Prochaine étape: Attache un numéro de téléphone à cet assistant dans le dashboard Vapi");
}

createVapiAssistant().catch(console.error);
