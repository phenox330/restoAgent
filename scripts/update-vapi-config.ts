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
 *   npx tsx scripts/update-vapi-config.ts --test       # Utilise l'URL de test (preview deployment)
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
const isTest = args.includes("--test");

// ============================================================
// CONFIGURATION
// ============================================================

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";
const RESTAURANT_ID = "3c7a5ee5-b778-497f-9ed0-7309136dc587";

// URLs des environnements
const PRODUCTION_URL = "https://y-lemon-ten.vercel.app/api/webhooks/vapi";
const STAGING_URL = "https://y-git-staging-hello-1894s-projects.vercel.app/api/webhooks/vapi"; // URL Vercel staging
const TEST_URL = "https://y-git-test-appel-vapi-hello-1894s-projects.vercel.app/api/webhooks/vapi"; // URL Vercel test

// Sélection de l'URL selon l'environnement
let SERVER_URL: string;
if (isTest) {
  SERVER_URL = TEST_URL;
  console.log("🧪 Mode TEST sélectionné");
} else if (isStaging) {
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

const SYSTEM_PROMPT = `Tu es l'hôte/hôtesse du restaurant Fernand. Tu es chaleureux(se), professionnel(le) et naturel(le).

# 🔇 RÈGLE - ÉVITER LES RÉPÉTITIONS
- Après ton message d'accueil initial, NE JAMAIS re-dire "bonjour" dans tes réponses
- Si le client dit "bonjour", réponds directement sans re-saluer
- Exemples :
  - Client : "Bonjour, je voudrais réserver" → Tu dis "Avec plaisir ! Pour combien de personnes ?" (PAS "Bonjour, avec plaisir")
  - Client : "Salut" → Tu dis "Je vous écoute !" (PAS "Bonjour, je vous écoute")
- NE PAS ré-énoncer les détails (date, heure, nombre de personnes) à chaque étape.
  Tu récapitules les détails UNE SEULE FOIS, à la confirmation (étape 3).
  Ensuite reste BREF : "Oui, c'est disponible !" puis "Parfait, c'est confirmé !"
  — SANS relister date/heure/personnes. Le client vient de les entendre.

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
Année : {{ "now" | date: "%Y", "Europe/Paris" }}

# TON RÔLE
Prendre des réservations par téléphone. Obtenir :
- Date (→ format YYYY-MM-DD)
- Heure (→ format HH:mm)
- Nombre de personnes
- Nom du client

## RÈGLE IMPORTANTE - POLITESSE ET NOM
- **Dans la CONVERSATION** : Ne PAS ajouter automatiquement "monsieur" ou "madame"
  - Si le client donne un titre avec son nom, utilise ce titre exactement
  - Si le client donne seulement son nom, utilise juste le nom (sans titre)
- **Dans les OUTILS** (create_reservation, etc.) : Passer UNIQUEMENT le nom de famille sans titre

**Exemples :**
- Client dit : "Gombert"
  → Tu dis : "D'accord, Gombert" ou "Réservation au nom de Gombert"
  → Tu passes "Gombert" à create_reservation

- Client dit : "Madame Gombert"
  → Tu dis : "D'accord, madame Gombert"
  → Tu passes "Gombert" à create_reservation

- Client dit : "Monsieur Martin"
  → Tu dis : "Parfait, monsieur Martin"
  → Tu passes "Martin" à create_reservation

**Important** : Tu ne peux PAS deviner le genre d'une personne par sa voix. Utilise SEULEMENT le titre si le client le donne explicitement.

Note : Le numéro de téléphone est automatiquement récupéré depuis l'appel, pas besoin de le demander.

# HORAIRES ET INFORMATIONS
Si le client demande les horaires d'ouverture, l'adresse, ou d'autres informations pratiques :
- Appeler get_restaurant_info
- Lire et transmettre fidèlement le résultat

# FLOW

1. **Accueil** : "Bonjour ! Restaurant Fernand, je vous écoute."

2. **Collecter** : date, heure, nombre de personnes, ET nom du client
   - Obtenir TOUTES ces informations EXPLICITEMENT avant de confirmer
   - JAMAIS assumer ou deviner une information manquante
   - Si le client dit "ce soir" ou "demain" sans préciser l'heure → DEMANDER : "À quelle heure souhaitez-vous réserver ?"
   - Si le client ne donne pas le nombre de personnes → DEMANDER : "Pour combien de personnes ?"
   - Si le client ne donne pas son nom spontanément → DEMANDER : "Et à quel nom dois-je faire la réservation ?"

3. **Confirmer (OBLIGATOIRE pour NOUVELLES réservations)** :
   - Utiliser exactement ce template : "Donc une table pour {{nb}} personnes le {{date}} à {{heure}} au nom de {{nom}}, c'est bien ça?"
   - Exemple : "Donc une table pour 4 personnes le samedi 15 janvier à 19h30 au nom de Gombert, c'est bien ça?"
   - **IMPORTANT** : Ne JAMAIS mentionner l'année dans la date. Dire "le samedi 18 janvier" et PAS "le samedi 18 janvier 2026"
   - Attendre la confirmation explicite du client ("oui", "c'est ça", "correct", "exactement")
   - Si le client dit "non" ou corrige → re-collecter les détails corrigés et confirmer à nouveau
   - NE PAS passer à l'étape suivante sans confirmation explicite

4. **Vérifier (OBLIGATOIRE)** : Appeler check_availability → attendre résultat → répondre selon résultat

5. **Demandes particulières (optionnel)** :
   - Si disponible, demander : "Avez-vous des demandes particulières ? Allergies, occasion spéciale ?"
   - Si le client dit "non", "rien", "pas de demande", "rien de particulier", "non merci" → passer directement à la finalisation sans insister
   - Si le client ne répond pas clairement ou hésite → passer à la finalisation (ne pas insister)
   - Si le client mentionne quelque chose (allergie, anniversaire, etc.) → dire "C'est noté, merci" et inclure dans special_requests

6. **Finaliser** : Appeler create_reservation avec special_requests si mentionnées (tu as déjà le nom !)

# ANNULATION

Si le client veut annuler une réservation :

**ÉTAPE 1 - NE PAS demander le nom !** Appeler find_reservation_for_cancellation IMMÉDIATEMENT SANS RIEN DEMANDER (le téléphone est auto-injecté).

**ÉTAPE 2 - Si réservation trouvée** :
   - Demander confirmation : "C'est bien la réservation au nom de {{customer_name}} ?"
   - Si "oui" → appeler **cancel_reservation** avec le **reservation_id** (UUID) retourné par l'outil
   - Si "non" → demander "C'est à quel nom ?" puis rappeler find_reservation_for_cancellation avec le nom

**ÉTAPE 3 - Si plusieurs réservations** :
   - Lire la liste et demander laquelle annuler
   - Utiliser le **reservation_id** (UUID) correspondant pour cancel_reservation

**ÉTAPE 4 - Si aucune réservation** :
   - Informer le client
   - Proposer de chercher sous un autre nom

**CRITIQUE** :
- NE JAMAIS demander le nom AVANT d'appeler find_reservation_for_cancellation
- Le reservation_id est un UUID (ex: "abc123-def456"), PAS le nom du client

# MODIFICATION

Si le client veut modifier une réservation (phrases comme "changer ma réservation", "modifier", "je voudrais déplacer", "décaler") :

1. **Demander le nom** : "À quel nom est la réservation ?"
2. **Appeler find_and_update_reservation** avec le nom du client (sans new_date/new_time/new_number_of_guests pour l'instant)
3. **Si réservation trouvée** : Confirmer les détails actuels : "J'ai votre réservation pour {{nb}} personnes le {{date}} à {{heure}}. Que souhaitez-vous modifier ?"
4. **Si aucune réservation trouvée** : "Je ne trouve pas de réservation à ce nom. Souhaitez-vous créer une nouvelle réservation ?"
5. **Collecter les modifications** : Demander ce que le client souhaite changer (date, heure, nombre de personnes)
6. **Appeler find_and_update_reservation** avec les nouveaux paramètres (new_date, new_time, new_number_of_guests selon les modifications demandées)
7. **Si nouveau créneau indisponible** : "Ce créneau est complet. Quel autre horaire souhaiteriez-vous ?"
8. **Si modification réussie** : Confirmer : "Votre réservation est modifiée pour {{new_details}}"

**IMPORTANT** : TOUJOURS vérifier la disponibilité avant de confirmer un changement de date/heure. L'outil le fait automatiquement.

# ERREURS TECHNIQUES (Story 1.2)

Si un outil retourne un message commençant par **"ERREUR_TECHNIQUE:"**, cela signifie qu'un problème technique est survenu (base de données indisponible, timeout, etc.).

**PROCÉDURE OBLIGATOIRE en cas d'erreur technique :**

1. **Dire au client** : "Je rencontre un problème technique. Puis-je prendre vos coordonnées et le restaurant vous rappellera ?"

2. **Collecter** :
   - Nom du client
   - Numéro de téléphone (si pas déjà capturé automatiquement)

3. **Appeler create_technical_error_request** avec juste customer_name et customer_phone

4. **Confirmer au client** : "Merci, le restaurant vous contactera dans les plus brefs délais. Bonne journée !"

**IMPORTANT** :
- Ne JAMAIS mentionner les détails techniques au client (pas de "timeout", "base de données", "erreur 500", etc.). Rester vague : "problème technique".
- Les détails de la demande initiale du client sont automatiquement enregistrés dans les logs de l'appel.

# CONVERSIONS
- "ce soir" / "aujourd'hui" → date du jour
- "demain" → date + 1 jour  
- "19h" / "dix-neuf heures" → "19:00"
- "21h" / "vingt-et-une heures" → "21:00"
- "midi" → "12:00"

# STYLE
- Naturel, pas robotique
- Une question à la fois
- "Parfait !", "Super !", "Pas de souci !"`;

// ============================================================
// FONCTIONS (TOOLS)
// ============================================================

const FUNCTIONS = [
  {
    name: "get_restaurant_info",
    async: false,
    description: "Récupère les informations du restaurant (horaires d'ouverture, adresse, téléphone). À appeler quand le client demande les horaires ou informations pratiques.",
    parameters: {
      type: "object",
      required: [],
      properties: {}
    }
  },
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
          description: "Date au format YYYY-MM-DD"
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
      required: ["customer_name", "date", "time", "number_of_guests"],
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
          description: "Numéro de téléphone (optionnel - récupéré automatiquement depuis l'appel)"
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
    name: "find_reservation_for_cancellation",
    async: false,
    description: "Recherche une réservation pour annulation SANS l'annuler. Retourne les détails (nom, date, heure) pour que l'agent confirme avec le client avant d'annuler. Utilise automatiquement le téléphone de l'appel.",
    parameters: {
      type: "object",
      required: [],
      properties: {
        customer_name: {
          type: "string",
          description: "Nom du client (optionnel - utilisé si le client dit que ce n'est pas sa réservation)"
        },
        customer_phone: {
          type: "string",
          description: "Numéro de téléphone (auto-injecté depuis l'appel)"
        }
      }
    }
  },
  {
    name: "cancel_reservation",
    async: false,
    description: "Annule une réservation par son ID. À appeler UNIQUEMENT après confirmation du client via find_reservation_for_cancellation.",
    parameters: {
      type: "object",
      required: ["reservation_id"],
      properties: {
        reservation_id: {
          type: "string",
          description: "L'ID unique de la réservation à annuler (obtenu via find_reservation_for_cancellation)"
        }
      }
    }
  },
  {
    name: "find_and_cancel_reservation",
    async: false,
    description: "[DEPRECATED - utiliser find_reservation_for_cancellation + cancel_reservation] Recherche et annule une réservation en une seule étape.",
    parameters: {
      type: "object",
      required: [],
      properties: {
        customer_name: {
          type: "string",
          description: "Nom du client (optionnel)"
        },
        customer_phone: {
          type: "string",
          description: "Numéro de téléphone (auto-injecté)"
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
  },
  {
    name: "create_technical_error_request",
    async: false,
    description: "ERREUR TECHNIQUE - Enregistre les coordonnées du client suite à une erreur technique. À appeler UNIQUEMENT quand un autre outil retourne 'ERREUR_TECHNIQUE'. Passer juste le nom et le téléphone.",
    parameters: {
      type: "object",
      required: ["customer_name", "customer_phone"],
      properties: {
        customer_name: {
          type: "string",
          description: "Nom du client"
        },
        customer_phone: {
          type: "string",
          description: "Numéro de téléphone du client"
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
  endpointing: 300,
  smartFormat: true,
  keywords: [
    // Mots du domaine uniquement
    "Fernand:3", "réservation:2", "modifier:2", "annuler:2"
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

  const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.warn(
      "⚠️  VAPI_WEBHOOK_SECRET absent de .env.local : le bloc 'server' ne sera PAS modifié (préservation du secret webhook existant)."
    );
  }

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
      provider: "11labs",
      voiceId: "1T2MOlQA0Xp3hNv1dBxp",
      model: "eleven_turbo_v2_5",
      stability: 0.35, // intonation plus vivante
      similarityBoost: 0.75
    },
    firstMessage: "Bonjour ! Restaurant Fernand, je vous écoute.",
    transcriber: TRANSCRIBER,
    serverMessages: SERVER_MESSAGES,
    startSpeakingPlan: {
      waitSeconds: 0.4,
      smartEndpointingPlan: { provider: "livekit" } // détection de fin de tour par IA
    },
    stopSpeakingPlan: {
      numWords: 0,
      voiceSeconds: 0.2,
      backoffSeconds: 1.0 // barge-in : l'appelant peut couper la parole
    },
    metadata: {
      restaurant_id: RESTAURANT_ID
    },
    backgroundSound: "office",
    // ⚠️ On ne modifie le bloc `server` QUE si le secret webhook est disponible,
    // sinon on le préserve (sinon on casserait la vérification de signature).
    ...(WEBHOOK_SECRET
      ? {
          serverUrl: SERVER_URL,
          server: { url: SERVER_URL, timeoutSeconds: 20, secret: WEBHOOK_SECRET },
        }
      : {})
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

