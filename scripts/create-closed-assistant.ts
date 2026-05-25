/**
 * Crée (une seule fois) l'assistant Vapi "Indisponible".
 * Utilisé quand le bot est OFF : il dit un message poli puis raccroche.
 * Clone la voix/modèle/transcriber de l'assistant principal pour la cohérence.
 *
 * Usage: npx tsx scripts/create-closed-assistant.ts
 * Récupère l'ID affiché et mets-le dans lib/vapi/constants.ts (VAPI_CLOSED_ASSISTANT_ID).
 */

const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
const MAIN_ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";

const CLOSED_MESSAGE =
  "Bonjour, merci d'avoir appelé. Nous ne sommes pas en mesure de prendre votre appel pour le moment. Merci de bien vouloir rappeler un peu plus tard. À bientôt !";

async function main() {
  if (!VAPI_PRIVATE_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquante");
    process.exit(1);
  }

  // Cloner les providers de l'assistant principal
  const mainRes = await fetch(
    `https://api.vapi.ai/assistant/${MAIN_ASSISTANT_ID}`,
    { headers: { Authorization: `Bearer ${VAPI_PRIVATE_KEY}` } }
  );
  const main = await mainRes.json();

  const body = {
    name: "RestoAgent - Indisponible (bot off)",
    firstMessage: CLOSED_MESSAGE,
    firstMessageMode: "assistant-speaks-first",
    voice: main.voice,
    transcriber: main.transcriber,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es un répondeur automatique. Dis uniquement le message d'accueil puis termine immédiatement l'appel avec l'outil endCall. N'engage aucune conversation, ne pose aucune question.",
        },
      ],
    },
    endCallFunctionEnabled: true,
    silenceTimeoutSeconds: 10,
    maxDurationSeconds: 30,
  };

  const res = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_PRIVATE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const created = await res.json();

  if (!res.ok) {
    console.error("❌ Erreur création:", JSON.stringify(created, null, 2));
    process.exit(1);
  }

  console.log("✅ Assistant 'Indisponible' créé");
  console.log("   id:", created.id);
  console.log("\n💡 Mets cet ID dans lib/vapi/constants.ts → VAPI_CLOSED_ASSISTANT_ID");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
