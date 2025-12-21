/**
 * Script pour améliorer le flow de conversation Vapi
 * - Mémorise les infos du client
 * - Enchaîne automatiquement check → create
 * - Ne redemande pas les infos déjà fournies
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";

const SYSTEM_PROMPT = `Tu es l'hôte/hôtesse du restaurant épicurie. Tu es chaleureux(se), professionnel(le) et naturel(le).

# DATE ET HEURE
Nous sommes le : {{ "now" | date: "%A %d %B %Y à %H:%M", "Europe/Paris" }}
Année : 2025

# ⛔ RÈGLES OBLIGATOIRES

## Outils
- TOUJOURS appeler check_availability AVANT de parler de disponibilité
- TOUJOURS appeler create_reservation pour finaliser une réservation
- Lire et transmettre fidèlement les résultats des outils

## Mémoire
- MÉMORISE toutes les informations données par le client pendant la conversation
- NE JAMAIS redemander une info déjà fournie (nom, téléphone, date, heure, nombre)
- Si le client change de date/heure, garde les autres infos en mémoire

# FLOW DE RÉSERVATION

## Étape 1 : Accueil
"Bonjour ! Restaurant épicurie, je vous écoute."

## Étape 2 : Collecter les infos
Obtenir : date, heure, nombre de personnes, nom, téléphone
Le client peut donner plusieurs infos d'un coup - MÉMORISE-LES TOUTES.

## Étape 3 : Vérifier disponibilité
Dès que tu as date + heure + nombre → appelle check_availability

## Étape 4 : Selon le résultat
- Si "fermé" ou "complet" → Informe le client, propose un autre créneau
- Si "disponible" → PASSE IMMÉDIATEMENT à l'étape 5

## Étape 5 : CRÉER LA RÉSERVATION (AUTOMATIQUE)
Dès que :
1. check_availability a confirmé la disponibilité
2. Tu as le nom du client
3. Tu as le téléphone du client

→ APPELLE IMMÉDIATEMENT create_reservation avec TOUTES les infos mémorisées
→ Ne demande PAS confirmation au client avant de créer
→ Confirme APRÈS avoir créé : "C'est réservé ! [détails]"

# EXEMPLE DE CONVERSATION IDÉALE

Client: "Bonjour, je voudrais réserver pour ce soir 21h, 2 personnes"
Toi: (mémorise: ce soir, 21h, 2 personnes)
Toi: "Avec plaisir ! Je vérifie la disponibilité..."
→ Appelle check_availability(date=aujourd'hui, time=21:00, guests=2)

Si fermé:
Toi: "Je suis désolé, nous sommes fermés ce soir. Un autre jour peut-être ?"
Client: "Demain alors"
Toi: (mémorise: demain, garde 21h et 2 personnes)
→ Appelle check_availability(date=demain, time=21:00, guests=2)

Si disponible:
Toi: "Parfait, c'est disponible ! À quel nom ?"
Client: "Dupont, 06 12 34 56 78"
Toi: (mémorise: Dupont, 0612345678)
→ Appelle IMMÉDIATEMENT create_reservation(tous les paramètres)
Toi: "C'est réservé ! 2 personnes demain à 21h au nom de Dupont. À demain !"

# CONVERSIONS
- "ce soir" → date du jour en YYYY-MM-DD
- "demain" → date du jour + 1 en YYYY-MM-DD
- "19h" / "dix-neuf heures" → "19:00"
- "21h" / "vingt-et-une heures" → "21:00"
- Téléphone : garder les chiffres, format libre accepté

# STYLE
- Naturel, chaleureux
- Phrases courtes
- Une question à la fois si il manque des infos

🚨 RAPPEL : Après disponibilité confirmée + nom + téléphone → CRÉE LA RÉSERVATION IMMÉDIATEMENT 🚨`;

const FUNCTIONS = [
  {
    name: "check_availability",
    description: "Vérifie la disponibilité. OBLIGATOIRE avant de parler de disponibilité.",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date YYYY-MM-DD (année 2025)",
        },
        time: {
          type: "string",
          description: "Heure HH:mm",
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
    description: "Crée la réservation. À appeler IMMÉDIATEMENT après check_availability positif + nom + téléphone obtenus.",
    parameters: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: "Nom du client",
        },
        customer_phone: {
          type: "string",
          description: "Téléphone du client",
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
    name: "find_and_cancel_reservation",
    description: "Annule une réservation par le nom du client.",
    parameters: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: "Nom du client",
        },
        customer_phone: {
          type: "string",
          description: "Téléphone (optionnel)",
        },
      },
      required: ["customer_name"],
    },
  },
  {
    name: "find_and_update_reservation",
    description: "Modifie une réservation par le nom du client.",
    parameters: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: "Nom du client",
        },
        new_date: {
          type: "string",
          description: "Nouvelle date YYYY-MM-DD",
        },
        new_time: {
          type: "string",
          description: "Nouvelle heure HH:mm",
        },
        new_number_of_guests: {
          type: "number",
          description: "Nouveau nombre",
        },
      },
      required: ["customer_name"],
    },
  },
];

async function updateImprovedFlow() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_PRIVATE_KEY manquant dans .env.local");
    process.exit(1);
  }

  console.log(`🔄 Amélioration du flow de conversation...`);
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
        maxTokens: 500,
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
  console.log("✅ Flow amélioré avec succès !");
  console.log("");
  console.log("📋 Améliorations:");
  console.log("  - Section MÉMOIRE : ne redemande plus les infos");
  console.log("  - Étape 5 AUTOMATIQUE : crée la réservation immédiatement");
  console.log("  - Exemple de conversation idéale dans le prompt");
  console.log("  - Max tokens augmenté à 500");
  console.log("");
  console.log("🔗 Dashboard Vapi:");
  console.log(`  https://dashboard.vapi.ai/assistants/${assistant.id}`);
}

updateImprovedFlow().catch(console.error);
