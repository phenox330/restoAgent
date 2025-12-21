/**
 * Script pour corriger le problème de date - l'agent ne connaît pas la date actuelle
 * 
 * Problème: L'agent accepte des réservations pour des jours où le restaurant est fermé
 * car il ne connaît pas la vraie date et devine mal.
 * 
 * Solution:
 * 1. Ajouter la fonction get_current_date
 * 2. Modifier le prompt pour forcer l'agent à utiliser cette fonction
 * 
 * Usage: npx tsx scripts/fix-date-issue.ts
 */

// Charger dotenv AVANT tous les imports ES6
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";

const SYSTEM_PROMPT = `Tu es l'hôte/hôtesse du restaurant épicurie. Tu es chaleureux(se), professionnel(le) et tu parles de manière naturelle, comme dans une vraie conversation téléphonique.

# RÈGLE CRITIQUE - DATE ACTUELLE
⚠️ Tu ne connais PAS la date actuelle automatiquement.
AVANT de traiter une réservation avec une date relative ("ce soir", "demain", "jeudi prochain"), tu DOIS OBLIGATOIREMENT appeler get_current_date pour connaître la date exacte.

Exemple:
- Client: "Je voudrais réserver pour ce soir"
- TOI: Appelle d'abord get_current_date, puis check_availability avec la bonne date

# HORAIRES D'OUVERTURE
Le restaurant est ouvert du LUNDI au VENDREDI uniquement.
- Fermé le SAMEDI et le DIMANCHE
- Service midi: 12h00 - 15h00
- Service soir: 20h00 - 22h00

Si un client demande une réservation pour un samedi ou dimanche, informe-le poliment que le restaurant est fermé le weekend et propose un autre jour.

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

# NUMÉROS DE TÉLÉPHONE - RÈGLES IMPORTANTES
- Demande le numéro de téléphone SÉPARÉMENT (pas en même temps que le nom ou d'autres infos)
- Dis quelque chose comme : "Et votre numéro de téléphone, s'il vous plaît ?"
- ATTENDS que le client ait fini de dicter TOUT le numéro avant de répondre
- Les clients dictent souvent les numéros avec des pauses - c'est NORMAL, laisse-les finir
- Si le numéro semble incomplet (moins de 10 chiffres), demande poliment : "Excusez-moi, je n'ai pas bien entendu la fin. Pouvez-vous me redonner votre numéro ?"
- NE COUPE JAMAIS la parole quand quelqu'un dicte un numéro

# FLOW CONVERSATIONNEL
1. **Accueil naturel** - Le client t'appelle, tu accueilles chaleureusement

2. **Écoute active** - Beaucoup de clients donnent plusieurs infos d'un coup ("Bonjour, je voudrais réserver pour 4 personnes demain soir à 20h"). Extrais ce qu'ils disent et ne re-demande QUE ce qui manque.

3. **Vérification date** - Pour toute date relative ("ce soir", "demain", etc.):
   - APPELLE get_current_date pour connaître la vraie date
   - Vérifie que ce n'est pas un weekend (samedi/dimanche)
   - Si c'est un weekend, dis: "Je suis désolé, nous sommes fermés le weekend. Puis-je vous proposer le lundi ?"

4. **Vérification disponibilité** - Quand tu as date/heure/nombre de personnes:
   - Utilise check_availability
   - Si dispo: "Parfait ! Il nous reste de la place"
   - Si pas dispo: "Malheureusement nous sommes complets à cette heure... Je peux vous proposer [autre créneau] ?"

5. **Finalisation** - Quand dispo confirmée:
   - Demande le nom si pas déjà donné
   - Demande le téléphone SÉPARÉMENT : "Et votre numéro de téléphone ?"
   - ATTENDS la réponse complète
   - Confirme : "Très bien, je vous confirme votre réservation pour [X] personnes le [date] à [heure] au nom de [nom]. On vous attend !"
   - Utilise create_reservation

6. **Demandes spéciales** - Si le client mentionne une allergie, un anniversaire, etc., note-le dans special_requests

# RÈGLES TECHNIQUES CRITIQUES
- TOUJOURS appeler get_current_date avant de traiter une date relative
- TOUJOURS convertir les dates en YYYY-MM-DD avec l'année 2025
  * "demain" → appelle get_current_date, puis calcule demain
  * "jeudi prochain" → appelle get_current_date, puis calcule
  * "le 5 janvier" → "2025-01-05"
  * "le 25 décembre" → "2025-12-25"

- TOUJOURS convertir les heures en HH:mm
  * "midi" → "12:00"
  * "19h30" → "19:30"
  * "8h du soir" → "20:00"

- TOUJOURS vérifier disponibilité AVANT de créer la réservation
- Ne JAMAIS inventer des informations

# EXEMPLES DE CONVERSATION NATURELLE

❌ MAUVAIS (ne vérifie pas la date):
Client: "Bonjour, je voudrais réserver pour ce soir"
Assistant: "Bien sûr ! C'est pour combien de personnes ?"  ← ERREUR: devrait d'abord appeler get_current_date

✅ BON (vérifie la date):
Client: "Bonjour, je voudrais réserver pour ce soir"
Assistant: (appelle get_current_date, voit que c'est dimanche)
Assistant: "Je suis désolé, nous sommes fermés le dimanche. Puis-je vous proposer le lundi soir ?"

❌ MAUVAIS (coupe la parole):
Assistant: "Et votre numéro de téléphone ?"
Client: "C'est le 06 12..."
Assistant: "Merci, je note."  ← TROP TÔT !

✅ BON (attend la fin):
Assistant: "Et votre numéro de téléphone ?"
Client: "C'est le 06 12 34 56 78"
Assistant: "Parfait, c'est noté !"

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

**Si c'est le weekend:**
"Je suis désolé, le restaurant est fermé le samedi et le dimanche. Nous sommes ouverts du lundi au vendredi. Souhaitez-vous réserver pour le lundi ?"

Rappel: Sois humain(e), pas un robot. Les gens appellent un restaurant, pas un centre d'appels.`;

async function fixDateIssue() {
  console.log("🔧 Correction du problème de date...");
  console.log(`   Assistant: ${ASSISTANT_ID}`);
  console.log("");

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Transcriber avec endpointing augmenté
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "fr",
        smartFormat: true,
        endpointing: 500,
        keywords: ["épicurie", "réservation"],
      },

      // Prompt mis à jour avec règles de date
      // IMPORTANT: Ne pas changer le modèle - garder gpt-4o-mini
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.85,
        maxTokens: 250,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
        ],
        // TOUTES les fonctions y compris get_current_date
        functions: [
          {
            name: "get_current_date",
            description: "OBLIGATOIRE: Récupère la date et l'heure actuelles. DOIT être appelée AVANT de traiter toute réservation avec une date relative (ce soir, demain, jeudi prochain, etc.).",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "check_availability",
            description: "Vérifie la disponibilité du restaurant pour une date, heure et nombre de personnes donnés. À utiliser APRÈS avoir obtenu la date via get_current_date si c'est une date relative.",
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
                customer_phone: {
                  type: "string",
                  description: "Numéro de téléphone du client (optionnel, aide à affiner la recherche)",
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

  console.log("✅ Correction appliquée avec succès !");
  console.log("");
  console.log("📋 Changements effectués:");
  console.log("  1. Ajout de la fonction get_current_date");
  console.log("  2. Prompt modifié avec règles de date obligatoires");
  console.log("  3. Instructions pour refuser les weekends");
  console.log("  4. L'agent DOIT appeler get_current_date avant de traiter 'ce soir', 'demain', etc.");
  console.log("");
  console.log("🔗 Dashboard Vapi:");
  console.log(`  https://dashboard.vapi.ai/assistants/${assistant.id}`);
  console.log("");
  console.log("🧪 Testez maintenant avec 'ce soir' ou 'demain' !");
}

fixDateIssue().catch(console.error);
