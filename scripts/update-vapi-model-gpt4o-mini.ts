/**
 * Script pour passer l'assistant Vapi au modèle gpt-4o-mini
 * Ce modèle est plus fiable pour les tool calls que gpt-4o-realtime
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";

const SYSTEM_PROMPT = `Tu es l'hôte/hôtesse du restaurant épicurie. Tu es chaleureux(se), professionnel(le) et naturel(le).

# ⛔ RÈGLE OBLIGATOIRE - APPELER LES OUTILS

## INTERDICTIONS
- JAMAIS parler de disponibilité sans appeler check_availability
- JAMAIS confirmer une réservation sans appeler create_reservation  
- JAMAIS inventer "complet", "fermé", ou "disponible" - utilise TOUJOURS l'outil

## OBLIGATIONS
- TOUJOURS appeler check_availability avant de parler de disponibilité
- TOUJOURS lire et transmettre fidèlement le résultat de l'outil
- Si l'outil dit "fermé" → dis "nous sommes fermés"
- Si l'outil dit "complet" → dis "nous sommes complets"

# DATE ET HEURE
Nous sommes le : {{ "now" | date: "%A %d %B %Y à %H:%M", "Europe/Paris" }}
Année : 2025

# TON RÔLE  
Prendre des réservations par téléphone. Obtenir :
- Date (→ format YYYY-MM-DD)
- Heure (→ format HH:mm)
- Nombre de personnes
- Nom du client
- Téléphone

# FLOW

1. **Accueil** : "Bonjour ! Restaurant épicurie, je vous écoute."

2. **Collecter** : date, heure, nombre de personnes

3. **Vérifier (OBLIGATOIRE)** : Appeler check_availability → attendre résultat → répondre selon résultat

4. **Finaliser** : Si disponible, demander nom/tel → appeler create_reservation

# CONVERSIONS
- "ce soir" / "aujourd'hui" → date du jour
- "demain" → date + 1 jour  
- "19h" / "dix-neuf heures" → "19:00"
- "21h" / "vingt-et-une heures" → "21:00"
- "midi" → "12:00"

# STYLE
- Naturel, pas robotique
- Une question à la fois
- "Parfait !", "Super !", "Pas de souci !"

🚨 RAPPEL : TOUJOURS APPELER LES OUTILS - NE JAMAIS INVENTER 🚨`;

const FUNCTIONS = [
  {
    name: "check_availability",
    description: "OBLIGATOIRE - Vérifie la disponibilité. À appeler AVANT de parler de disponibilité.",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date au format YYYY-MM-DD (année 2025)",
        },
        time: {
          type: "string",
          description: "Heure au format HH:mm (ex: 19:30, 21:00)",
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
    description: "OBLIGATOIRE - Crée la réservation. À appeler UNIQUEMENT après check_availability positif.",
    parameters: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: "Nom complet du client",
        },
        customer_phone: {
          type: "string",
          description: "Numéro de téléphone",
        },
        customer_email: {
          type: "string",
          description: "Email (optionnel)",
        },
        date: {
          type: "string",
          description: "Date YYYY-MM-DD",
        },
        time: {
          type: "string",
          description: "Heure HH:mm",
        },
        number_of_guests: {
          type: "number",
          description: "Nombre de personnes",
        },
        special_requests: {
          type: "string",
          description: "Demandes spéciales (allergies, anniversaire, etc.)",
        },
      },
      required: ["customer_name", "customer_phone", "date", "time", "number_of_guests"],
    },
  },
  {
    name: "find_and_cancel_reservation",
    description: "Recherche et annule une réservation par le nom du client.",
    parameters: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: "Nom du client",
        },
        customer_phone: {
          type: "string",
          description: "Téléphone (optionnel, aide à trouver)",
        },
      },
      required: ["customer_name"],
    },
  },
  {
    name: "find_and_update_reservation",
    description: "Recherche et modifie une réservation par le nom du client.",
    parameters: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: "Nom du client",
        },
        new_date: {
          type: "string",
          description: "Nouvelle date YYYY-MM-DD (si changement)",
        },
        new_time: {
          type: "string",
          description: "Nouvelle heure HH:mm (si changement)",
        },
        new_number_of_guests: {
          type: "number",
          description: "Nouveau nombre de personnes (si changement)",
        },
      },
      required: ["customer_name"],
    },
  },
];

async function updateToGpt4oMini() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant dans .env.local");
    process.exit(1);
  }

  console.log(`🔄 Changement de modèle vers gpt-4o-mini...`);
  console.log(`   Assistant: ${ASSISTANT_ID}`);

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 400,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
        ],
        functions: FUNCTIONS,
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
  console.log("✅ Modèle changé avec succès !");
  console.log("");
  console.log("📋 Configuration:");
  console.log("  - Modèle: gpt-4o-mini (au lieu de gpt-4o-realtime)");
  console.log("  - Température: 0.7");
  console.log("  - Max tokens: 400");
  console.log("  - Functions: check_availability, create_reservation, find_and_cancel, find_and_update");
  console.log("");
  console.log("✨ Avantages de gpt-4o-mini:");
  console.log("  - Tool calls fiables");
  console.log("  - Rapide");
  console.log("  - Économique");
  console.log("");
  console.log("🔗 Dashboard Vapi:");
  console.log(`  https://dashboard.vapi.ai/assistants/${assistant.id}`);
}

updateToGpt4oMini().catch(console.error);
