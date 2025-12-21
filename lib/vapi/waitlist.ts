// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { WaitlistStatus } from "@/types";
import { getServiceType } from "./availability";

// Client Supabase avec service role pour bypass RLS (création paresseuse)
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdminInstance;
}

interface AddToWaitlistParams {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  desiredDate: string;
  desiredTime?: string;
  partySize: number;
  notes?: string;
  callId?: string;
  status?: WaitlistStatus;
}

interface WaitlistResult {
  success: boolean;
  message: string;
  waitlistId?: string;
}

/**
 * Ajoute un client à la liste d'attente
 */
export async function addToWaitlist(
  params: AddToWaitlistParams
): Promise<WaitlistResult> {
  try {
    // Déterminer le service souhaité basé sur l'heure si fournie
    let desiredService: "lunch" | "dinner" | "any" = "any";
    if (params.desiredTime) {
      desiredService = getServiceType(params.desiredTime);
    }

    // Vérifier si le client existe déjà dans la waitlist pour cette date
    const { data: existingEntry } = await getSupabaseAdmin()
      .from("waitlist")
      .select("id, status")
      .eq("restaurant_id", params.restaurantId)
      .eq("customer_phone", params.customerPhone)
      .eq("desired_date", params.desiredDate)
      .in("status", ["waiting", "needs_manager_call"])
      .single();

    if (existingEntry) {
      return {
        success: false,
        message:
          "Vous êtes déjà inscrit sur notre liste d'attente pour cette date. Nous vous contacterons dès qu'une place se libère.",
      };
    }

    // Vérifier et lier au call s'il existe
    let callUuid: string | null = null;
    if (params.callId) {
      const { data: callExists } = await getSupabaseAdmin()
        .from("calls")
        .select("id")
        .eq("vapi_call_id", params.callId)
        .single();

      if (callExists) {
        callUuid = callExists.id;
      }
    }

    // Créer l'entrée waitlist
    const { data: waitlistEntry, error } = await getSupabaseAdmin()
      .from("waitlist")
      .insert({
        restaurant_id: params.restaurantId,
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        customer_email: params.customerEmail || null,
        desired_date: params.desiredDate,
        desired_time: params.desiredTime || null,
        desired_service: desiredService,
        party_size: params.partySize,
        status: params.status || "waiting",
        notes: params.notes || null,
        call_id: callUuid,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error adding to waitlist:", error);
      return {
        success: false,
        message: "Erreur lors de l'inscription sur la liste d'attente",
      };
    }

    console.log("✅ Added to waitlist:", waitlistEntry.id);

    // Message différent selon le statut
    let message: string;
    if (params.status === "needs_manager_call") {
      message = `Vos coordonnées ont été notées. Le gérant vous rappellera sous 24h pour finaliser votre demande de ${params.partySize} personnes.`;
    } else {
      message = `Vous avez été inscrit sur notre liste d'attente. Nous vous contacterons dès qu'une place se libère pour ${params.partySize} personnes.`;
    }

    return {
      success: true,
      message,
      waitlistId: waitlistEntry.id,
    };
  } catch (error) {
    console.error("❌ Error in addToWaitlist:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de l'inscription",
    };
  }
}

/**
 * Vérifie si des alternatives sont disponibles et formate un message pour l'IA
 */
export async function formatAlternativesMessage(
  restaurantId: string,
  date: string,
  partySize: number
): Promise<string | null> {
  try {
    // Utiliser la fonction SQL find_alternative_slots
    const { data: alternatives, error } = await getSupabaseAdmin().rpc(
      "find_alternative_slots",
      {
        p_restaurant_id: restaurantId,
        p_date: date,
        p_party_size: partySize,
        p_days_ahead: 3,
      }
    );

    if (error || !alternatives || alternatives.length === 0) {
      return null;
    }

    // Formater les alternatives en français
    const jours = [
      "dimanche",
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
    ];
    const mois = [
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "août",
      "septembre",
      "octobre",
      "novembre",
      "décembre",
    ];

    const formattedAlts = alternatives.slice(0, 3).map((alt: any) => {
      const altDate = new Date(alt.available_date);
      const jourNom = jours[altDate.getDay()];
      const jour = altDate.getDate();
      const moisNom = mois[altDate.getMonth()];
      const serviceLabel = alt.service_type === "lunch" ? "midi" : "soir";
      return `${jourNom} ${jour} ${moisNom} ${serviceLabel}`;
    });

    if (formattedAlts.length === 1) {
      return `Cependant, nous avons de la disponibilité le ${formattedAlts[0]}. Souhaitez-vous réserver ce créneau ?`;
    }

    const lastAlt = formattedAlts.pop();
    return `Cependant, nous avons de la disponibilité le ${formattedAlts.join(", ")} ou le ${lastAlt}. L'un de ces créneaux vous conviendrait-il ?`;
  } catch (error) {
    console.error("Error formatting alternatives:", error);
    return null;
  }
}

/**
 * Convertit une entrée waitlist en réservation
 */
export async function convertWaitlistToReservation(
  waitlistId: string,
  reservationId: string
): Promise<boolean> {
  try {
    const { error } = await getSupabaseAdmin()
      .from("waitlist")
      .update({
        status: "converted",
        converted_reservation_id: reservationId,
      })
      .eq("id", waitlistId);

    return !error;
  } catch (error) {
    console.error("Error converting waitlist:", error);
    return false;
  }
}

/**
 * Récupère les entrées waitlist actives pour un restaurant et une date
 */
export async function getActiveWaitlist(
  restaurantId: string,
  date?: string
): Promise<any[]> {
  try {
    let query = getSupabaseAdmin()
      .from("waitlist")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .in("status", ["waiting", "needs_manager_call"])
      .order("created_at", { ascending: true });

    if (date) {
      query = query.eq("desired_date", date);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching waitlist:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getActiveWaitlist:", error);
    return [];
  }
}
