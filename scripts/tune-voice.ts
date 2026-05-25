/**
 * PATCH chirurgical de l'assistant Vapi : réactivité + naturel de la voix.
 * Ne touche QUE voice, transcriber, startSpeakingPlan, stopSpeakingPlan.
 * NE touche PAS server/secret/metadata/model (évite d'écraser la sécurité webhook).
 *
 * Usage: npx tsx scripts/tune-voice.ts
 */

const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";

// Objets COMPLETS (un PATCH remplace l'objet entier — on garde tous les champs)
const payload = {
  voice: {
    provider: "11labs",
    voiceId: "1T2MOlQA0Xp3hNv1dBxp",
    model: "eleven_turbo_v2_5",
    stability: 0.35, // ↓ (était 0.5) → intonation plus vivante
    similarityBoost: 0.75,
  },
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "fr",
    smartFormat: true,
    endpointing: 300, // ↓ (était 500) → réponse plus rapide
    keywords: ["Fernand:3", "réservation:2", "modifier:2", "annuler:2"],
  },
  // Détection de fin de tour par IA + petit délai
  startSpeakingPlan: {
    waitSeconds: 0.4,
    smartEndpointingPlan: { provider: "livekit" },
  },
  // Barge-in : l'appelant peut couper la parole
  stopSpeakingPlan: {
    numWords: 0,
    voiceSeconds: 0.2,
    backoffSeconds: 1.0,
  },
};

async function main() {
  if (!VAPI_PRIVATE_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquante");
    process.exit(1);
  }

  const res = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_PRIVATE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("❌ Erreur PATCH:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("✅ Voix & turn-taking mis à jour");
  console.log("   voice:", JSON.stringify(data.voice));
  console.log("   transcriber.endpointing:", data.transcriber?.endpointing);
  console.log("   startSpeakingPlan:", JSON.stringify(data.startSpeakingPlan));
  console.log("   stopSpeakingPlan:", JSON.stringify(data.stopSpeakingPlan));
  console.log("   server.url (inchangé):", data.server?.url);
  console.log("   secret présent (inchangé):", !!data.server?.secret || "non exposé par l'API");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
