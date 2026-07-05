// Tools annexes : liste d'attente, transfert vers un humain, demande sur erreur technique.
import { addToWaitlist } from "../waitlist";
import { handleTransferCall } from "../transfer";
import { redactPII } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  AddToWaitlistArgs,
  TransferCallArgs,
  CreateTechnicalErrorRequestArgs,
  ReservationInsert,
} from "./types";

// Tool 6: Ajouter à la liste d'attente
export async function handleAddToWaitlist(args: AddToWaitlistArgs) {
  console.log("📋 add_to_waitlist called with:", JSON.stringify(redactPII(args), null, 2));

  const result = await addToWaitlist({
    restaurantId: args.restaurant_id,
    customerName: args.customer_name,
    customerPhone: args.customer_phone,
    customerEmail: args.customer_email,
    desiredDate: args.date,
    desiredTime: args.time,
    partySize: args.number_of_guests,
    notes: args.notes,
    callId: args.call_id,
  });

  return result;
}


// Tool 7: Transférer l'appel vers un humain
export async function handleTransfer(args: TransferCallArgs) {
  console.log("🔄 transfer_call called with:", JSON.stringify(redactPII(args), null, 2));
  return handleTransferCall(args);
}


// Tool 8: Créer une demande suite à une erreur technique
export async function handleCreateTechnicalErrorRequest(
  args: CreateTechnicalErrorRequestArgs
) {
  console.log(
    "⚠️ create_technical_error_request called with:",
    JSON.stringify(redactPII(args), null, 2)
  );

  try {
    // Valider les champs requis
    if (!args.customer_name || args.customer_name.trim() === "") {
      return {
        success: false,
        message: "Le nom du client est requis.",
      };
    }

    if (!args.customer_phone || args.customer_phone.trim() === "") {
      return {
        success: false,
        message: "Le numéro de téléphone est requis.",
      };
    }

    // Préparer les données de base
    const errorRequestData: ReservationInsert = {
      restaurant_id: args.restaurant_id,
      customer_name: args.customer_name.trim(),
      customer_phone: args.customer_phone.trim(),
      customer_email: null,
      // reservation_date / reservation_time omis volontairement : la colonne est
      // nullable sans défaut, donc NULL est stocké (détails dans internal_notes).
      number_of_guests: 1, // Valeur par défaut (contrainte DB > 0)
      duration: 90,
      status: "pending_request",
      source: "phone",
      request_type: "technical_error",
      special_requests: "Demande suite à une erreur technique",
      internal_notes: `Erreur technique survenue pendant l'appel. Client a fourni ses coordonnées pour rappel. Consulter les logs de l'appel pour les détails de la demande.${args.call_id ? ` Vapi Call ID: ${args.call_id}` : ""}`,
    };

    // Vérifier si le call existe dans la table calls avant de l'associer
    // (même pattern que handleCreateReservation)
    if (args.call_id) {
      const { data: callExists } = await getSupabaseAdmin()
        .from("calls")
        .select("id")
        .eq("vapi_call_id", args.call_id)
        .single();

      if (callExists) {
        errorRequestData.call_id = callExists.id;
        console.log("✅ Call ID linked to error request:", callExists.id);
      } else {
        console.log(
          "⚠️ Call ID not found in database, creating technical error request without call_id"
        );
      }
    }

    // Créer l'enregistrement de type "technical_error"
    const { data: errorRequest, error: insertError } = await getSupabaseAdmin()
      .from("reservations")
      .insert(errorRequestData)
      .select()
      .single();

    if (insertError) {
      console.error(
        "❌ Error creating technical error request:",
        insertError
      );
      return {
        success: false,
        message: "Une erreur est survenue lors de l'enregistrement de votre demande.",
      };
    }

    console.log(
      "✅ Technical error request created:",
      errorRequest.id
    );

    // Message de confirmation simple
    const confirmationMessage = `Merci ${args.customer_name}. J'ai bien noté vos coordonnées. Le restaurant vous contactera dans les plus brefs délais pour finaliser votre demande. Bonne journée !`;

    return {
      success: true,
      message: confirmationMessage,
      request_id: errorRequest.id,
    };
  } catch (error) {
    console.error(
      "❌ Exception in create_technical_error_request:",
      error
    );
    return {
      success: false,
      message: "Une erreur est survenue. Veuillez contacter directement le restaurant.",
    };
  }
}

// Router pour gérer les appels de fonctions
