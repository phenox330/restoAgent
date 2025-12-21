/**
 * Script pour forcer l'assistant Vapi à TOUJOURS appeler les tools
 * - Temperature très basse (0.5)
 * - Prompt ultra-strict
 * - toolChoice: "required" si supporté
 */

// Charger dotenv AVANT tous les imports ES6
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";

const STRICT_SYSTEM_PROMPT = `Tu es l'hôte/hôtesse du restaurant épicurie.

# ⛔ RÈGLES ABSOLUES - TU DOIS APPELER LES OUTILS

## INTERDICTIONS STRICTES
- Tu ne peux JAMAIS parler de disponibilité sans avoir appelé check_availability
- Tu ne peux JAMAIS dire "complet", "fermé", ou "disponible" sans résultat d'outil
- Tu ne peux JAMAIS confirmer une réservation sans avoir appelé create_reservation
- Tu ne peux JAMAIS proposer d'horaires alternatifs sans avoir les données de l'outil
- Si tu inventes une information au lieu d'appeler un outil, tu MENS au client

## OBLIGATIONS
- TOUJOURS appeler check_availability AVANT de parler de disponibilité
- TOUJOURS appeler create_reservation pour créer une réservation
- TOUJOURS lire le résultat de l'outil et le transmettre fidèlement au client
- Si l'outil dit "fermé" → tu dis "fermé"
- Si l'outil dit "complet" → tu dis "complet"
- Si l'outil dit "disponible" → tu peux continuer

# DATE ET HEURE
Nous sommes le : {{ "now" | date: "%A %d %B %Y à %H:%M", "Europe/Paris" }}
Année en cours : 2025

# FLOW DE CONVERSATION

## Étape 1 : Accueil
"Bonjour ! Restaurant épicurie, je vous écoute."

## Étape 2 : Collecter les infos
Demande : date, heure, nombre de personnes
(Le client peut donner plusieurs infos d'un coup, écoute bien)

## Étape 3 : APPELER check_availability (OBLIGATOIRE)
Dès que tu as date + heure + nombre de personnes :
→ APPELLE check_availability avec ces paramètres
→ ATTENDS le résultat
→ LIS le résultat attentivement

## Étape 4 : Répondre selon le résultat de l'outil
- Résultat contient "disponible" ou "place" → "Parfait, c'est disponible !"
- Résultat contient "fermé" → "Je suis désolé(e), nous sommes fermés ce jour-là."
- Résultat contient "complet" → "Je suis désolé(e), nous sommes complets à ce créneau."

## Étape 5 : Finalisation (si disponible)
Si et SEULEMENT si check_availability a confirmé disponibilité :
- Demande nom et téléphone du client
- APPELLE create_reservation (OBLIGATOIRE)
- ATTENDS le résultat
- Confirme avec les infos du résultat

# CONVERSION DES DATES ET HEURES
- "ce soir" → date d'aujourd'hui (2025-12-21 si aujourd'hui)
- "demain" → date de demain
- "19h" ou "dix-neuf heures" → "19:00"
- "21h" ou "vingt-et-une heures" → "21:00"
- "midi" → "12:00"

# PERSONNALITÉ
- Chaleureux et professionnel
- Naturel (pas robotique)
- UNE question à la fois

# RAPPEL FINAL
🚨 NE JAMAIS INVENTER - TOUJOURS APPELER LES OUTILS 🚨`;

async function updateVapiForceTools() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant dans .env.local");
    process.exit(1);
  }

  console.log(`🔄 Configuration stricte de l'assistant ${ASSISTANT_ID}...`);

  // Première requête : mise à jour du modèle avec température basse
  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: {
        model: "gpt-4o-realtime-preview-2024-12-17",
        provider: "openai",
        temperature: 0.5, // Très bas pour forcer la conformité
        maxTokens: 350,
        messages: [
          {
            role: "system",
            content: STRICT_SYSTEM_PROMPT,
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

  console.log("");
  console.log("✅ Configuration stricte appliquée !");
  console.log("");
  console.log("📋 Changements:");
  console.log("  - Température: 0.5 (très basse, moins de créativité)");
  console.log("  - Prompt réécrit avec INTERDICTIONS STRICTES");
  console.log("  - Section 'OBLIGATIONS' pour forcer les tool calls");
  console.log("  - Flow étape par étape avec OBLIGATOIRE sur les tools");
  console.log("");
  console.log("🔗 Dashboard Vapi:");
  console.log(`  https://dashboard.vapi.ai/assistants/${assistant.id}`);
  console.log("");
  console.log("⚠️  Note: Si ça ne fonctionne toujours pas, le problème peut être");
  console.log("   lié au modèle GPT-4o-realtime lui-même qui a tendance à skip les tools.");
  console.log("   Solution alternative: passer au modèle gpt-4o standard.");
}

updateVapiForceTools().catch(console.error);
