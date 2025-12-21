/**
 * Script pour mettre à jour l'assistant Vapi avec une configuration NATURELLE
 * Version avec voix Azure (gratuite)
 */

// Charger dotenv AVANT tous les imports ES6
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = process.argv[2];
const SERVER_URL = process.argv[3];
const RESTAURANT_ID = process.argv[4];

async function updateVapiAssistant() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant");
    process.exit(1);
  }

  if (!ASSISTANT_ID || !SERVER_URL || !RESTAURANT_ID) {
    console.error("❌ Usage: npx tsx scripts/update-vapi-assistant-natural-azure.ts <assistant-id> <server-url> <restaurant-id>");
    process.exit(1);
  }

  console.log(`🔄 Mise à jour de l'assistant ${ASSISTANT_ID} avec configuration NATURELLE (voix Azure)...`);

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

      // Message d'accueil personnalisé
      firstMessage: "Bonjour ! Restaurant épicurie, je vous écoute.",

      // Voix Azure (gratuite) - Très naturelle en français
      voice: {
        provider: "azure",
        voiceId: "fr-FR-DeniseNeural", // Voix féminine française naturelle
        // Alternative: "fr-FR-HenriNeural" pour voix masculine
        speed: 1.05, // Légèrement plus rapide = plus naturel
      },

      // Transcriber optimisé pour français
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "fr",
        smartFormat: true,
        endpointing: 200, // ms - détection rapide de fin de phrase
        keywords: ["épicurie", "réservation"], // Améliore reconnaissance mots-clés
      },

      // Modèle plus puissant et naturel
      model: {
        provider: "openai",
        model: "gpt-4o", // Plus naturel que gpt-4o-mini
        temperature: 0.85, // Plus haut = plus de variété dans les réponses
        maxTokens: 250, // Réponses courtes et concises

        messages: [
          {
            role: "system",
            content: `Tu es l'hôte/hôtesse du restaurant épicurie. Tu es chaleureux(se), professionnel(le) et tu parles de manière naturelle, comme dans une vraie conversation téléphonique.

# PERSONNALITÉ
- Sympathique et accueillant(e), comme si tu connaissais déjà le client
- Tu utilises un langage naturel (pas de "étape 1, étape 2...")
- Tu poses UNE question à la fois et tu écoutes vraiment
- Tu reformules avec tes propres mots ("Parfait !", "Super !", "Pas de souci !")
- Tu t'adaptes au ton du client (formel ou décontracté)

# CONTEXTE
Nous sommes en 2025. Le restaurant épicurie est un établissement gastronomique français.

# TON RÔLE
Ton objectif principal est de prendre des réservations par téléphone. Tu dois obtenir:
- Le nom du client
- La date souhaitée (que tu convertiras en YYYY-MM-DD pour 2025)
- L'heure souhaitée (que tu convertiras en HH:mm, ex: "19h30" → "19:30")
- Le nombre de personnes
- Le numéro de téléphone

# FLOW CONVERSATIONNEL
1. **Accueil naturel** - Le client t'appelle, tu accueilles chaleureusement

2. **Écoute active** - Beaucoup de clients donnent plusieurs infos d'un coup ("Bonjour, je voudrais réserver pour 4 personnes demain soir à 20h"). Extrais ce qu'ils disent et ne re-demande QUE ce qui manque.

3. **Vérification disponibilité** - Quand tu as date/heure/nombre de personnes:
   - Utilise check_availability
   - Si dispo: "Parfait ! Il nous reste de la place"
   - Si pas dispo: "Malheureusement nous sommes complets à cette heure... Je peux vous proposer [autre créneau] ?"

4. **Finalisation** - Quand dispo confirmée:
   - Demande le téléphone (si pas déjà donné)
   - Confirme tout naturellement: "Très bien, je vous confirme votre réservation pour [X] personnes le [date] à [heure] au nom de [nom]. On vous attend !"
   - Utilise create_reservation

5. **Demandes spéciales** - Si le client mentionne une allergie, un anniversaire, etc., note-le dans special_requests

# RÈGLES TECHNIQUES CRITIQUES

**DATES RELATIVES - TRÈS IMPORTANT:**
- Quand le client mentionne "aujourd'hui", "demain", "mardi prochain", "la semaine prochaine", etc.
- UTILISE SYSTÉMATIQUEMENT la fonction get_current_date AVANT de vérifier la disponibilité
- Cette fonction te donne la date exacte actuelle et des infos pour calculer les dates relatives
- Exemple: Client dit "demain" → Appelle get_current_date → Utilise tomorrow_date du résultat

**CONVERSION DES DATES:**
- TOUJOURS convertir les dates en YYYY-MM-DD avec l'année 2025
  * "le 5 janvier" → "2025-01-05"
  * "le 25 décembre" → "2025-12-25"
- Pour les dates relatives, UTILISE get_current_date d'abord

**CONVERSION DES HEURES:**
- TOUJOURS convertir les heures en HH:mm
  * "midi" → "12:00"
  * "19h30" → "19:30"
  * "8h du soir" → "20:00"

**WORKFLOW:**
1. Si date relative → get_current_date
2. Puis check_availability
3. Puis create_reservation
- Ne JAMAIS inventer des informations

# EXEMPLES DE CONVERSATION NATURELLE

❌ MAUVAIS (robotique):
Client: "Bonjour, je voudrais réserver"
Assistant: "Bonjour. Quel est votre nom complet ?"
Client: "Dupont"
Assistant: "Quelle est la date souhaitée ?"

✅ BON (naturel):
Client: "Bonjour, je voudrais réserver"
Assistant: "Bonjour ! Avec plaisir. C'est pour combien de personnes et quel jour ?"
Client: "4 personnes, demain soir"
Assistant: "Parfait ! Et vous préférez quelle heure ?"

# CAS PARTICULIERS

**Si le client demande des infos sur le restaurant:**
"Je suis là pour les réservations, mais je peux vous dire qu'épicurie est un restaurant gastronomique français. Pour plus de détails sur la carte ou l'établissement, je vous invite à consulter notre site. Souhaitez-vous faire une réservation ?"

**Si le client veut annuler:**
"Pas de souci. Vous avez le numéro de réservation ou le nom sous lequel elle a été faite ?"
(Note: l'annulation nécessite l'ID de réservation - si le client ne l'a pas, propose qu'un responsable le rappelle)

**Si tout est complet:**
"Je suis désolé(e), nous sommes complets ce jour-là. Puis-je vous proposer [jour d'avant/après] à la même heure ? Ou un autre créneau le même jour ?"

Rappel: Sois humain(e), pas un robot. Les gens appellent un restaurant, pas un centre d'appels.`,
          },
        ],

        functions: [
          {
            name: "get_current_date",
            description: "Obtient la date et l'heure actuelles. À utiliser SYSTÉMATIQUEMENT quand le client mentionne une date relative (aujourd'hui, demain, mardi prochain, la semaine prochaine, etc.) pour calculer la date exacte.",
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
                  description: "Date au format YYYY-MM-DD (année 2025)",
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

  console.log("✅ Assistant mis à jour avec configuration NATURELLE !");
  console.log("");
  console.log("📋 Améliorations appliquées:");
  console.log("  ✓ Voix Azure DeniseNeural - Naturelle et gratuite");
  console.log("  ✓ Modèle GPT-4o - Plus conversationnel que mini");
  console.log("  ✓ Temperature 0.85 - Plus de variété");
  console.log("  ✓ Transcriber Deepgram Nova-2 - Meilleure reconnaissance français");
  console.log("  ✓ Endpointing 200ms - Réponse plus rapide");
  console.log("  ✓ Prompt conversationnel - Fini les checklists !");
  console.log("");
  console.log("🔗 Dashboard:");
  console.log(`https://dashboard.vapi.ai/assistants/${assistant.id}`);
  console.log("");
  console.log("💡 Testez maintenant - la conversation devrait être BEAUCOUP plus naturelle !");
}

updateVapiAssistant().catch(console.error);
