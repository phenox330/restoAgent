/**
 * 🔧 Script principal pour mettre à jour la configuration Vapi
 * 
 * Ce script gère TOUTE la configuration de l'assistant Vapi :
 * - System prompt
 * - Fonctions (tools)
 * - Transcriber (Deepgram)
 * - Server URL
 * - Metadata
 * 
 * Usage: 
 *   npx tsx scripts/update-vapi-config.ts              # Utilise l'URL par défaut (production)
 *   npx tsx scripts/update-vapi-config.ts --staging    # Utilise l'URL de staging
 *   npx tsx scripts/update-vapi-config.ts --production # Utilise l'URL de production
 * 
 * IMPORTANT: Avant toute modification, exécutez:
 *   npx tsx scripts/backup-vapi-config.ts
 */

const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

// ============================================================
// ARGUMENTS DE LIGNE DE COMMANDE
// ============================================================

const args = process.argv.slice(2);
const isStaging = args.includes("--staging");
const isProduction = args.includes("--production");

// ============================================================
// CONFIGURATION
// ============================================================

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";
const RESTAURANT_ID = "fd796afe-61aa-42e3-b2f4-4438a258638b";

// URLs des environnements
const PRODUCTION_URL = "https://y-lemon-ten.vercel.app/api/webhooks/vapi";
const STAGING_URL = "https://y-git-staging-hello-1894s-projects.vercel.app/api/webhooks/vapi"; // URL Vercel staging

// Sélection de l'URL selon l'environnement
let SERVER_URL: string;
if (isStaging) {
  SERVER_URL = STAGING_URL;
  console.log("🔶 Mode STAGING sélectionné");
} else if (isProduction) {
  SERVER_URL = PRODUCTION_URL;
  console.log("🟢 Mode PRODUCTION sélectionné");
} else {
  // Par défaut : production (ou variable d'env si définie)
  SERVER_URL = process.env.VAPI_SERVER_URL || PRODUCTION_URL;
  console.log("⚪ Mode par défaut (production)");
}

// ============================================================
// SYSTEM PROMPT
// ============================================================

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

# 📱 RÈGLE CRITIQUE - NUMÉRO DE TÉLÉPHONE

Quand le client donne son numéro de téléphone :
1. ÉCOUTE attentivement TOUS les chiffres
2. RÉPÈTE le numéro EN ENTIER chiffre par chiffre pour confirmation
3. ATTENDS la confirmation du client AVANT de créer la réservation

Exemple correct :
- Client : "Mon numéro c'est le 07 81 82 73 38"
- Toi : "Je répète pour être sûr : 0-7-8-1-8-2-7-3-3-8. C'est bien ça ?"
- Client : "Oui c'est ça"
- Toi : [Maintenant tu peux appeler create_reservation]

Si le client dit "non" ou corrige :
- Demande-lui de répéter le numéro
- Répète à nouveau pour confirmation

# FLOW

1. **Accueil** : "Bonjour ! Restaurant épicurie, je vous écoute."

2. **Collecter** : date, heure, nombre de personnes

3. **Vérifier (OBLIGATOIRE)** : Appeler check_availability → attendre résultat → répondre selon résultat

4. **Finaliser** : Si disponible, demander nom/tel → CONFIRMER LE NUMÉRO → appeler create_reservation

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

🚨 RAPPEL : TOUJOURS CONFIRMER LE NUMÉRO DE TÉLÉPHONE AVANT DE CRÉER LA RÉSERVATION 🚨`;

// ============================================================
// FONCTIONS (TOOLS)
// ============================================================

const FUNCTIONS = [
  {
    name: "check_availability",
    async: false,
    description: "OBLIGATOIRE - Vérifie la disponibilité. À appeler AVANT de parler de disponibilité.",
    parameters: {
      type: "object",
      required: ["date", "time", "number_of_guests"],
      properties: {
        date: {
          type: "string",
          description: "Date au format YYYY-MM-DD (année 2025)"
        },
        time: {
          type: "string",
          description: "Heure au format HH:mm (ex: 19:30, 21:00)"
        },
        number_of_guests: {
          type: "number",
          description: "Nombre de personnes"
        }
      }
    }
  },
  {
    name: "create_reservation",
    async: false,
    description: "OBLIGATOIRE - Crée la réservation. À appeler UNIQUEMENT après check_availability positif.",
    parameters: {
      type: "object",
      required: ["customer_name", "customer_phone", "date", "time", "number_of_guests"],
      properties: {
        date: {
          type: "string",
          description: "Date YYYY-MM-DD"
        },
        time: {
          type: "string",
          description: "Heure HH:mm"
        },
        customer_name: {
          type: "string",
          description: "Nom complet du client"
        },
        customer_email: {
          type: "string",
          description: "Email (optionnel)"
        },
        customer_phone: {
          type: "string",
          description: "Numéro de téléphone"
        },
        number_of_guests: {
          type: "number",
          description: "Nombre de personnes"
        },
        special_requests: {
          type: "string",
          description: "Demandes spéciales (allergies, anniversaire, etc.)"
        }
      }
    }
  },
  {
    name: "find_and_cancel_reservation",
    async: false,
    description: "Recherche et annule une réservation par le nom du client.",
    parameters: {
      type: "object",
      required: ["customer_name"],
      properties: {
        customer_name: {
          type: "string",
          description: "Nom du client"
        },
        customer_phone: {
          type: "string",
          description: "Téléphone (optionnel, aide à trouver)"
        }
      }
    }
  },
  {
    name: "find_and_update_reservation",
    async: false,
    description: "Recherche et modifie une réservation par le nom du client.",
    parameters: {
      type: "object",
      required: ["customer_name"],
      properties: {
        customer_name: {
          type: "string",
          description: "Nom du client"
        },
        new_date: {
          type: "string",
          description: "Nouvelle date YYYY-MM-DD (si changement)"
        },
        new_time: {
          type: "string",
          description: "Nouvelle heure HH:mm (si changement)"
        },
        new_number_of_guests: {
          type: "number",
          description: "Nouveau nombre de personnes (si changement)"
        }
      }
    }
  }
];

// ============================================================
// TRANSCRIBER (DEEPGRAM)
// ============================================================

const TRANSCRIBER = {
  model: "nova-2",
  language: "fr",
  provider: "deepgram",
  endpointing: 500,
  smartFormat: true,
  keywords: [
    // Chiffres français avec boost pour meilleure reconnaissance
    "zéro:2", "un:2", "deux:2", "trois:2", "quatre:2",
    "cinq:2", "six:2", "sept:2", "huit:2", "neuf:2",
    "dix:2", "onze:2", "douze:2", "treize:2", "quatorze:2",
    "quinze:2", "seize:2", "vingt:2", "trente:2", "quarante:2",
    "cinquante:2", "soixante:2",
    // Mots du domaine
    "épicurie", "réservation"
  ]
};

// ============================================================
// SERVER MESSAGES (événements envoyés au webhook)
// ============================================================

const SERVER_MESSAGES = [
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
];

// ============================================================
// FONCTION PRINCIPALE
// ============================================================

async function updateVapiConfig() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant dans .env.local");
    process.exit(1);
  }

  console.log("🔧 Mise à jour de la configuration Vapi\n");
  console.log("📋 Configuration :");
  console.log(`   - Assistant ID: ${ASSISTANT_ID}`);
  console.log(`   - Restaurant ID: ${RESTAURANT_ID}`);
  console.log(`   - Server URL: ${SERVER_URL}`);
  console.log(`   - Fonctions: ${FUNCTIONS.length}`);
  console.log(`   - Keywords: ${TRANSCRIBER.keywords.length}`);
  console.log("");

  const updatePayload = {
    model: {
      model: "gpt-4o-mini",
      provider: "openai",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        }
      ],
      functions: FUNCTIONS,
      maxTokens: 400,
      temperature: 0.7
    },
    voice: {
      model: "tts-1",
      voiceId: "alloy",
      provider: "openai"
    },
    firstMessage: "Bonjour ! Restaurant épicurie, je vous écoute.",
    transcriber: TRANSCRIBER,
    serverUrl: SERVER_URL,
    serverMessages: SERVER_MESSAGES,
    server: {
      url: SERVER_URL,
      timeoutSeconds: 20
    },
    metadata: {
      restaurant_id: RESTAURANT_ID
    },
    backgroundSound: "office"
  };

  console.log("📤 Envoi de la mise à jour...\n");

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updatePayload)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ Erreur lors de la mise à jour:", error);
    process.exit(1);
  }

  const updatedConfig = await response.json();

  console.log("✅ Configuration mise à jour avec succès !\n");
  console.log("📋 Résumé :");
  console.log(`   - Modèle: ${updatedConfig.model?.model}`);
  console.log(`   - Voix: ${updatedConfig.voice?.provider} / ${updatedConfig.voice?.voiceId}`);
  console.log(`   - Fonctions: ${updatedConfig.model?.functions?.length || 0}`);
  console.log(`   - Server URL: ${updatedConfig.serverUrl}`);
  console.log(`   - Keywords: ${updatedConfig.transcriber?.keywords?.length || 0}`);
  console.log("");
  console.log("🔗 Dashboard: https://dashboard.vapi.ai/assistants/" + ASSISTANT_ID);
}

updateVapiConfig().catch(console.error);

