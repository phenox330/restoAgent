// @ts-nocheck
/**
 * Module de transfert d'appel vers humain (Human Fallback)
 * Gère les conditions de transfert et l'appel à l'API Vapi
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Client Supabase avec service role
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Seuils pour déclenchement du transfert
const TRANSFER_THRESHOLDS = {
  largeGroupSize: 8,           // Groupe > 8 personnes
  maxFailedAttempts: 3,        // Échecs répétés d'extraction
  lowConfidenceScore: 0.5,     // Score de confiance très bas
};

export type TransferReason =
  | "large_group"              // Groupe > 8 personnes
  | "repeated_failure"         // Échec répété de compréhension
  | "explicit_request"         // Demande explicite du client
  | "negative_sentiment"       // Frustration détectée
  | "privatization"           // Demande de privatisation
  | "complex_request";         // Demande complexe

interface TransferContext {
  restaurantId: string;
  callId?: string;
  reason: TransferReason;
  guestCount?: number;
  failedAttempts?: number;
  confidenceScore?: number;
  customerRequest?: string;
}

interface TransferResult {
  shouldTransfer: boolean;
  transferNumber?: string;
  message?: string;
  reason?: TransferReason;
}

/**
 * Évalue si un appel doit être transféré vers un humain
 */
export async function evaluateTransferCondition(
  context: TransferContext
): Promise<TransferResult> {
  // Récupérer les infos du restaurant pour le numéro de fallback
  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("fallback_phone, phone, name")
    .eq("id", context.restaurantId)
    .single();

  if (!restaurant) {
    return {
      shouldTransfer: false,
      message: "Restaurant non trouvé",
    };
  }

  // Déterminer le numéro de transfert (fallback_phone ou phone par défaut)
  const transferNumber = restaurant.fallback_phone || restaurant.phone;

  // Évaluer les conditions de transfert
  switch (context.reason) {
    case "large_group":
      if (context.guestCount && context.guestCount > TRANSFER_THRESHOLDS.largeGroupSize) {
        return {
          shouldTransfer: true,
          transferNumber,
          reason: "large_group",
          message: `Pour les groupes de ${context.guestCount} personnes, je vais vous transférer vers notre responsable qui pourra finaliser votre demande. Un instant s'il vous plaît.`,
        };
      }
      break;

    case "repeated_failure":
      if (context.failedAttempts && context.failedAttempts >= TRANSFER_THRESHOLDS.maxFailedAttempts) {
        return {
          shouldTransfer: true,
          transferNumber,
          reason: "repeated_failure",
          message: "Je m'excuse, j'ai du mal à comprendre. Je vais vous transférer vers un membre de notre équipe qui pourra vous aider. Un instant.",
        };
      }
      break;

    case "explicit_request":
      return {
        shouldTransfer: true,
        transferNumber,
        reason: "explicit_request",
        message: "Bien sûr, je vous transfère immédiatement vers un responsable. Un instant s'il vous plaît.",
      };

    case "negative_sentiment":
      return {
        shouldTransfer: true,
        transferNumber,
        reason: "negative_sentiment",
        message: "Je comprends votre frustration. Je vais vous mettre en relation avec un membre de notre équipe qui pourra mieux vous aider.",
      };

    case "privatization":
      return {
        shouldTransfer: true,
        transferNumber,
        reason: "privatization",
        message: "Pour une privatisation, je vais vous transférer vers notre responsable événementiel qui pourra discuter des détails avec vous.",
      };

    case "complex_request":
      return {
        shouldTransfer: true,
        transferNumber,
        reason: "complex_request",
        message: "Cette demande nécessite une attention particulière. Je vais vous transférer vers un responsable.",
      };
  }

  return {
    shouldTransfer: false,
  };
}

/**
 * Effectue le transfert d'appel via l'API Vapi
 * Retourne les instructions pour que l'IA effectue le transfert
 */
export async function initiateTransfer(
  context: TransferContext
): Promise<{
  success: boolean;
  action?: string;
  transferNumber?: string;
  message?: string;
}> {
  const evaluation = await evaluateTransferCondition(context);

  if (!evaluation.shouldTransfer) {
    return {
      success: false,
      message: "Conditions de transfert non remplies",
    };
  }

  // Logger le transfert
  console.log("📞 Initiating transfer:", {
    restaurantId: context.restaurantId,
    callId: context.callId,
    reason: evaluation.reason,
    transferNumber: evaluation.transferNumber,
  });

  // Si on a un call_id, mettre à jour les métadonnées de l'appel
  if (context.callId) {
    try {
      await supabaseAdmin
        .from("calls")
        .update({
          vapi_metadata: {
            transfer_initiated: true,
            transfer_reason: evaluation.reason,
            transfer_time: new Date().toISOString(),
          },
        })
        .eq("vapi_call_id", context.callId);
    } catch (error) {
      console.error("Error updating call metadata:", error);
    }
  }

  return {
    success: true,
    action: "transfer",
    transferNumber: evaluation.transferNumber,
    message: evaluation.message,
  };
}

/**
 * Vérifie si un message du client indique qu'il veut parler à un humain
 */
export function detectTransferRequest(message: string): boolean {
  const transferPhrases = [
    "parler à quelqu'un",
    "parler a quelqu un",
    "parler à un humain",
    "parler a un humain",
    "une vraie personne",
    "quelqu'un de réel",
    "un responsable",
    "le gérant",
    "le manager",
    "un conseiller",
    "être transféré",
    "etre transfere",
    "transfert",
    "pas un robot",
    "pas une machine",
  ];

  const lowerMessage = message.toLowerCase();
  return transferPhrases.some((phrase) => lowerMessage.includes(phrase));
}

/**
 * Vérifie si un message indique une demande de privatisation
 */
export function detectPrivatizationRequest(message: string): boolean {
  const privatizationPhrases = [
    "privatiser",
    "privatisation",
    "événement privé",
    "evenement prive",
    "location de salle",
    "louer la salle",
    "réception privée",
    "reception privee",
    "mariage",
    "anniversaire d'entreprise",
    "séminaire",
    "seminaire",
    "groupe entreprise",
  ];

  const lowerMessage = message.toLowerCase();
  return privatizationPhrases.some((phrase) => lowerMessage.includes(phrase));
}

/**
 * Génère la réponse Vapi pour le transfert d'appel
 */
export function generateTransferResponse(params: {
  message: string;
  transferNumber: string;
}): object {
  // Format de réponse Vapi pour déclencher un transfert
  return {
    success: true,
    action: "transfer",
    message: params.message,
    transfer: {
      type: "phone",
      number: params.transferNumber,
      message: params.message,
    },
  };
}

/**
 * Tool handler pour le transfert d'appel
 */
export async function handleTransferCall(args: {
  restaurant_id: string;
  reason: TransferReason;
  call_id?: string;
  guest_count?: number;
  failed_attempts?: number;
}) {
  console.log("🔄 transfer_call called with:", JSON.stringify(args, null, 2));

  const result = await initiateTransfer({
    restaurantId: args.restaurant_id,
    callId: args.call_id,
    reason: args.reason,
    guestCount: args.guest_count,
    failedAttempts: args.failed_attempts,
  });

  if (result.success) {
    return {
      success: true,
      action: "transfer",
      message: result.message,
      transfer_number: result.transferNumber,
      // Instructions spéciales pour Vapi
      vapi_action: {
        type: "transfer",
        destination: {
          type: "phone",
          number: result.transferNumber,
        },
      },
    };
  }

  return {
    success: false,
    message: result.message || "Transfert non disponible pour le moment",
  };
}
