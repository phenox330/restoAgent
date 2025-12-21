/**
 * Script pour mettre à jour l'assistant Vapi avec une configuration NATURELLE
 * Optimisé pour des conversations fluides et humaines
 */

import { config } from "dotenv";
import { resolve } from "path";

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
    console.error("❌ Usage: npx tsx scripts/update-vapi-assistant-natural.ts <assistant-id> <server-url> <restaurant-id>");
    process.exit(1);
  }

  console.log(`🔄 Mise à jour de l'assistant ${ASSISTANT_ID} avec configuration NATURELLE...`);

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

      // Voix OpenAI (requis pour modèle realtime)
      voice: {
        provider: "openai",
        voiceId: "alloy", // Voix féminine naturelle
        // Alternatives: echo, fable, onyx, nova, shimmer
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

      // Note: audioSettings (backgroundSound) n'est pas encore supporté par l'API Vapi
      // pour les assistants. Cette fonctionnalité pourrait être ajoutée dans le futur.

      // Modèle realtime pour appels vocaux
      model: {
        provider: "openai",
        model: "gpt-4o-realtime-preview-2024-12-17",
        temperature: 0.85, // Plus haut = plus de variété dans les réponses
        maxTokens: 250, // Réponses courtes et concises

        messages: [
          {
            role: "system",
            content: `Tu es l'hôte/hôtesse du restaurant épicurie. Tu es chaleureux(se), professionnel(le) et tu parles de manière naturelle, comme dans une vraie conversation téléphonique.

# DATE ET HEURE ACTUELLES
Nous sommes le : {{ "now" | date: "%b %d, %Y, %I:%M %p", "Europe/Paris" }}

Utilise cette information pour calculer les dates relatives (demain, jeudi prochain, etc.)

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
- TOUJOURS convertir les dates en YYYY-MM-DD avec l'année 2025
  * "demain" → calcule la date exacte en 2025
  * "jeudi prochain" → calcule la date exacte en 2025
  * "le 5 janvier" → "2025-01-05"
  * "le 25 décembre" → "2025-12-25"

- TOUJOURS convertir les heures en HH:mm
  * "midi" → "12:00"
  * "19h30" → "19:30"
  * "8h du soir" → "20:00"

- TOUJOURS vérifier disponibilité AVANT de créer la réservation
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
"Pas de souci. La réservation est à quel nom ?"
Puis utilise find_and_cancel_reservation avec le nom (et le téléphone si donné)

**Si le client veut modifier sa réservation:**
"Bien sûr ! La réservation est à quel nom ?"
Utilise UNIQUEMENT le nom du client (pas besoin du téléphone)
Une fois trouvée, demande: "J'ai votre réservation. Que souhaitez-vous modifier ?"
Puis utilise find_and_update_reservation avec le nom + les nouvelles informations

**Si tout est complet:**
"Je suis désolé(e), nous sommes complets ce jour-là. Puis-je vous proposer [jour d'avant/après] à la même heure ? Ou un autre créneau le même jour ?"

Rappel: Sois humain(e), pas un robot. Les gens appellent un restaurant, pas un centre d'appels.`,
          },
        ],

        functions: [
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
          {
            name: "find_and_cancel_reservation",
            description: "Recherche et annule une réservation par le nom du client. À utiliser quand le client veut annuler mais n'a pas son numéro de réservation.",
            parameters: {
              type: "object",
              properties: {
                customer_name: {
                  type: "string",
                  description: "Nom du client (peut être partiel, la recherche est flexible)",
                },
                customer_phone: {
                  type: "string",
                  description: "Numéro de téléphone du client (optionnel, aide à affiner la recherche)",
                },
              },
              required: ["customer_name"],
            },
          },
          {
            name: "find_and_update_reservation",
            description: "Recherche et modifie une réservation PAR LE NOM UNIQUEMENT. Le téléphone n'est PAS nécessaire. Permet de changer la date, l'heure ou le nombre de personnes. Vérifie automatiquement la disponibilité.",
            parameters: {
              type: "object",
              properties: {
                customer_name: {
                  type: "string",
                  description: "Nom du client UNIQUEMENT (suffit pour trouver la réservation)",
                },
                new_date: {
                  type: "string",
                  description: "Nouvelle date au format YYYY-MM-DD (optionnel, ne fournir QUE si le client veut changer la date)",
                },
                new_time: {
                  type: "string",
                  description: "Nouvelle heure au format HH:mm (optionnel, ne fournir QUE si le client veut changer l'heure)",
                },
                new_number_of_guests: {
                  type: "number",
                  description: "Nouveau nombre de personnes (optionnel, ne fournir QUE si le client veut changer le nombre)",
                },
              },
              required: ["customer_name"],
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
  console.log("  - Voix OpenAI (alloy) - Compatible realtime");
  console.log("  - Modèle GPT-4o Realtime - Latence ultra-faible");
  console.log("  - Temperature 0.85 - Plus de variété");
  console.log("  - Transcriber Deepgram Nova-2 - Meilleure reconnaissance français");
  console.log("  - Prompt conversationnel - Fini les checklists !");
  console.log("  - 5 fonctions: réservation, vérification, annulation, modification");
  console.log("");
  console.log("🔗 Dashboard:");
  console.log(`https://dashboard.vapi.ai/assistants/${assistant.id}`);
  console.log("");
  console.log("💡 Testez maintenant - la conversation devrait être BEAUCOUP plus naturelle !");
}

updateVapiAssistant().catch(console.error);
