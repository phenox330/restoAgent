/**
 * FIX FINAL - Utiliser la variable dynamique {{ now }} de Vapi
 * Au lieu de la fonction get_current_date qui ne marche pas
 */

// Charger dotenv AVANT tous les imports ES6
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = process.argv[2];

async function fixVapiWithDynamicTime() {
  if (!VAPI_API_KEY || !ASSISTANT_ID) {
    console.error("❌ Usage: npx tsx scripts/fix-vapi-with-dynamic-time.ts <assistant-id>");
    process.exit(1);
  }

  console.log(`🔧 FIX FINAL - Utilisation de la variable dynamique {{ now }}...`);

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: {
        provider: "openai",
        model: "gpt-4o",
        temperature: 0.85,
        maxTokens: 250,

        messages: [
          {
            role: "system",
            content: `Tu es l'hôte/hôtesse du restaurant épicurie. Tu es chaleureux(se), professionnel(le) et tu parles de manière naturelle.

# DATE ET HEURE ACTUELLES
Nous sommes le : {{ "now" | date: "%A %d %B %Y à %H:%M", "Europe/Paris" }}

Utilise cette information pour calculer les dates relatives :
- "demain" = ajoute 1 jour à la date actuelle
- "ce soir" = même jour, heure du soir (19h-21h)
- "jeudi prochain" = trouve le prochain jeudi à partir d'aujourd'hui

# TON RÔLE
Prendre des réservations par téléphone. Tu dois obtenir:
- Nom du client
- Date souhaitée (format YYYY-MM-DD pour 2025)
- Heure souhaitée (format HH:mm, ex: 19:30)
- Nombre de personnes
- Numéro de téléphone

# FLOW
1. **Accueil** - Bonjour chaleureux
2. **Écoute** - Le client donne souvent plusieurs infos d'un coup, extrais-les
3. **Vérification** - Quand tu as date/heure/nb personnes, utilise check_availability
4. **Finalisation** - Si disponible, demande nom/tel, puis utilise create_reservation

# RÈGLES IMPORTANTES
- Convertis TOUJOURS les dates en YYYY-MM-DD (année 2025)
- Convertis TOUJOURS les heures en HH:mm (ex: "19h30" → "19:30", "midi" → "12:00")
- VÉRIFIE la disponibilité AVANT de créer
- Confirme tous les détails avant de finaliser
- Sois naturel(le), pas robotique

# EXEMPLES
❌ "Quelle est la date souhaitée ?"
✅ "C'est pour quel jour ?"

❌ "Quel est votre numéro de téléphone ?"
✅ "Je peux avoir votre numéro de téléphone ?"`,
          },
        ],

        // SEULEMENT 3 fonctions - PAS get_current_date !
        functions: [
          {
            name: "check_availability",
            description: "Vérifie la disponibilité pour une date/heure/nombre de personnes. À utiliser dès que tu as ces 3 infos.",
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
            description: "Crée la réservation. À utiliser UNIQUEMENT après check_availability.",
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
                  description: "Demandes spéciales",
                },
              },
              required: ["customer_name", "customer_phone", "date", "time", "number_of_guests"],
            },
          },
          {
            name: "cancel_reservation",
            description: "Annule une réservation.",
            parameters: {
              type: "object",
              properties: {
                reservation_id: {
                  type: "string",
                  description: "ID de la réservation",
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

  console.log("✅ FIX APPLIQUÉ !");
  console.log("");
  console.log("📋 Changements:");
  console.log("  ✨ Variable dynamique {{ now }} ajoutée au prompt");
  console.log("  ❌ Fonction get_current_date SUPPRIMÉE");
  console.log("  ✅ Seulement 3 fonctions maintenant (check, create, cancel)");
  console.log("");
  console.log("🧪 TESTE MAINTENANT avec 'demain soir' ou 'jeudi prochain'");
}

fixVapiWithDynamicTime().catch(console.error);
