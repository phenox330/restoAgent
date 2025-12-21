// @ts-nocheck
import { createClient } from "@supabase/supabase-js";
import { checkAvailability } from "./availability";
import type { Database } from "@/types/database";

// Client Supabase avec service role pour bypass RLS
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CheckAvailabilityArgs {
  restaurant_id: string;
  date: string;
  time: string;
  number_of_guests: number;
}

interface CreateReservationArgs {
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  date: string;
  time: string;
  number_of_guests: number;
  special_requests?: string;
  call_id?: string;
}

interface CancelReservationArgs {
  reservation_id: string;
}

interface FindAndCancelReservationArgs {
  restaurant_id: string;
  customer_name: string;
  customer_phone?: string;
}

interface FindAndUpdateReservationArgs {
  restaurant_id: string;
  customer_name: string;
  customer_phone?: string;
  new_date?: string;
  new_time?: string;
  new_number_of_guests?: number;
}

// Tool 0: Obtenir la date actuelle
export async function handleGetCurrentDate() {
  console.log("📅 get_current_date called");

  const now = new Date();

  // Calculer quelques dates utiles
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Jours de la semaine en français
  const jours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

  const result = {
    success: true,
    message: `Nous sommes le ${jours[now.getDay()]} ${now.getDate()} ${mois[now.getMonth()]} ${now.getFullYear()}`,
    current_date: now.toISOString().split('T')[0], // Format YYYY-MM-DD
    current_time: now.toTimeString().split(' ')[0].substring(0, 5), // Format HH:mm
    day_of_week: jours[now.getDay()],
    tomorrow_date: tomorrow.toISOString().split('T')[0],
    tomorrow_day: jours[tomorrow.getDay()],
    next_week_date: nextWeek.toISOString().split('T')[0],
    year: now.getFullYear(),
    full_datetime: now.toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  console.log("📅 get_current_date result:", JSON.stringify(result, null, 2));

  return result;
}

// Tool 1: Vérifier les disponibilités
export async function handleCheckAvailability(args: CheckAvailabilityArgs) {
  console.log("🔍 check_availability called with:", JSON.stringify(args, null, 2));

  const result = await checkAvailability(supabaseAdmin, {
    restaurantId: args.restaurant_id,
    date: args.date,
    time: args.time,
    numberOfGuests: args.number_of_guests,
  });

  console.log("🔍 check_availability result:", JSON.stringify(result, null, 2));

  if (result.available) {
    // Format de date en français
    const dateObj = new Date(args.date);
    const jours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const jourNom = jours[dateObj.getDay()];

    return {
      success: true,
      message: `Oui, nous avons de la disponibilité pour ${args.number_of_guests} ${args.number_of_guests === 1 ? 'personne' : 'personnes'} le ${jourNom} ${args.date} à ${args.time}.`,
      available: true,
    };
  } else {
    return {
      success: false,
      message: result.reason,
      available: false,
    };
  }
}

// Tool 2: Créer une réservation
export async function handleCreateReservation(args: CreateReservationArgs) {
  console.log("📝 create_reservation called with:", JSON.stringify(args, null, 2));

  try {
    // Vérifier d'abord la disponibilité
    console.log("📝 Checking availability before creating reservation...");
    const availability = await checkAvailability(supabaseAdmin, {
      restaurantId: args.restaurant_id,
      date: args.date,
      time: args.time,
      numberOfGuests: args.number_of_guests,
    });

    console.log("📝 Availability check result:", JSON.stringify(availability, null, 2));

    if (!availability.available) {
      console.log("❌ Not available:", availability.reason);
      return {
        success: false,
        message: `Désolé, ${availability.reason}`,
      };
    }

    // Créer la réservation
    console.log("📝 Creating reservation in database...");

    // Ne passer call_id que s'il existe dans la table calls
    const reservationData: any = {
      restaurant_id: args.restaurant_id,
      customer_name: args.customer_name,
      customer_phone: args.customer_phone,
      customer_email: args.customer_email || null,
      reservation_date: args.date,
      reservation_time: args.time,
      number_of_guests: args.number_of_guests,
      special_requests: args.special_requests || null,
      source: "phone",
      status: "pending",
    };

    // Vérifier si le call existe avant de l'associer
    if (args.call_id) {
      const { data: callExists } = await supabaseAdmin
        .from("calls")
        .select("id")
        .eq("vapi_call_id", args.call_id)
        .single();

      if (callExists) {
        reservationData.call_id = callExists.id;
        console.log("✅ Call ID linked:", callExists.id);
      } else {
        console.log("⚠️ Call ID not found in database, creating reservation without call_id");
      }
    }

    const { data: reservation, error } = await supabaseAdmin
      .from("reservations")
      .insert(reservationData)
      .select()
      .single();

    if (error) {
      console.error("❌ Database error:", error);
      return {
        success: false,
        message: "Désolé, une erreur est survenue lors de la création de la réservation. Veuillez réessayer.",
      };
    }

    console.log("✅ Reservation created successfully:", reservation.id);

    // Format de date en français pour le message
    const dateObj = new Date(args.date);
    const jours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const jourNom = jours[dateObj.getDay()];

    return {
      success: true,
      message: `Parfait ! Votre réservation est confirmée pour ${args.number_of_guests} ${args.number_of_guests === 1 ? 'personne' : 'personnes'} le ${jourNom} ${args.date} à ${args.time}. À bientôt !`,
      reservation_id: reservation.id,
    };
  } catch (error) {
    console.error("❌ Error creating reservation:", error);
    return {
      success: false,
      message: "Désolé, une erreur est survenue. Veuillez réessayer ou nous rappeler.",
    };
  }
}

// Tool 3: Annuler une réservation
export async function handleCancelReservation(args: CancelReservationArgs) {
  console.log("❌ cancel_reservation called with:", JSON.stringify(args, null, 2));

  try {
    const { error } = await supabaseAdmin
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", args.reservation_id);

    if (error) {
      console.error("❌ Database error:", error);
      return {
        success: false,
        message: `Erreur lors de l'annulation: ${error.message}`,
      };
    }

    console.log("✅ Reservation cancelled successfully:", args.reservation_id);
    return {
      success: true,
      message: "Réservation annulée avec succès",
    };
  } catch (error) {
    console.error("❌ Error cancelling reservation:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de l'annulation",
    };
  }
}

// Tool 4: Rechercher et annuler une réservation par nom
export async function handleFindAndCancelReservation(args: FindAndCancelReservationArgs) {
  console.log("🔍 find_and_cancel_reservation called with:", JSON.stringify(args, null, 2));

  try {
    // Rechercher la réservation active (non annulée, non complétée) par nom
    let query = supabaseAdmin
      .from("reservations")
      .select("*")
      .eq("restaurant_id", args.restaurant_id)
      .ilike("customer_name", `%${args.customer_name}%`)
      .in("status", ["pending", "confirmed"])
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });

    // Si le téléphone est fourni, l'utiliser pour affiner la recherche
    if (args.customer_phone) {
      query = query.eq("customer_phone", args.customer_phone);
    }

    const { data: reservations, error: searchError } = await query;

    if (searchError) {
      console.error("❌ Database error:", searchError);
      return {
        success: false,
        message: `Erreur lors de la recherche: ${searchError.message}`,
      };
    }

    if (!reservations || reservations.length === 0) {
      console.log("⚠️ No reservation found for:", args.customer_name);
      return {
        success: false,
        message: `Aucune réservation trouvée au nom de ${args.customer_name}. La réservation a peut-être déjà été annulée ou le nom ne correspond pas exactement.`,
      };
    }

    // Si plusieurs réservations trouvées, prendre la plus proche dans le futur
    const reservation = reservations[0];

    // Annuler la réservation trouvée
    const { error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", reservation.id);

    if (updateError) {
      console.error("❌ Database error:", updateError);
      return {
        success: false,
        message: `Erreur lors de l'annulation: ${updateError.message}`,
      };
    }

    console.log("✅ Reservation found and cancelled:", reservation.id);

    // Formater la date pour le message de confirmation
    const reservationDate = new Date(reservation.reservation_date);
    const dateStr = reservationDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      success: true,
      message: `Réservation annulée avec succès. Il s'agissait de la réservation pour ${reservation.number_of_guests} personne${reservation.number_of_guests > 1 ? 's' : ''} le ${dateStr} à ${reservation.reservation_time}.`,
    };
  } catch (error) {
    console.error("❌ Error in find_and_cancel_reservation:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la recherche et l'annulation",
    };
  }
}

// Tool 5: Rechercher et modifier une réservation
export async function handleFindAndUpdateReservation(args: FindAndUpdateReservationArgs) {
  console.log("✏️ find_and_update_reservation called with:", JSON.stringify(args, null, 2));

  try {
    // Rechercher la réservation active par nom
    let query = supabaseAdmin
      .from("reservations")
      .select("*")
      .eq("restaurant_id", args.restaurant_id)
      .ilike("customer_name", `%${args.customer_name}%`)
      .in("status", ["pending", "confirmed"])
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });

    if (args.customer_phone) {
      query = query.eq("customer_phone", args.customer_phone);
    }

    const { data: reservations, error: searchError } = await query;

    if (searchError) {
      console.error("❌ Database error:", searchError);
      return {
        success: false,
        message: `Erreur lors de la recherche: ${searchError.message}`,
      };
    }

    if (!reservations || reservations.length === 0) {
      console.log("⚠️ No reservation found for:", args.customer_name);
      return {
        success: false,
        message: `Aucune réservation trouvée au nom de ${args.customer_name}.`,
      };
    }

    const reservation = reservations[0];

    // Préparer les nouvelles valeurs (garder les anciennes si non fournies)
    const newDate = args.new_date || reservation.reservation_date;
    const newTime = args.new_time || reservation.reservation_time;
    const newGuests = args.new_number_of_guests || reservation.number_of_guests;

    // Si la date ou l'heure ou le nombre de personnes change, vérifier la disponibilité
    if (args.new_date || args.new_time || args.new_number_of_guests) {
      const availabilityResult = await checkAvailability(supabaseAdmin, {
        restaurantId: args.restaurant_id,
        date: newDate,
        time: newTime,
        numberOfGuests: newGuests,
      });

      if (!availabilityResult.available) {
        console.log("⚠️ New slot not available");
        return {
          success: false,
          message: availabilityResult.message,
        };
      }
    }

    // Mettre à jour la réservation
    console.log("🔄 Attempting to update reservation:", {
      id: reservation.id,
      old_date: reservation.reservation_date,
      old_time: reservation.reservation_time,
      old_guests: reservation.number_of_guests,
      new_date: newDate,
      new_time: newTime,
      new_guests: newGuests,
    });

    const { data: updateData, error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({
        reservation_date: newDate,
        reservation_time: newTime,
        number_of_guests: newGuests,
      })
      .eq("id", reservation.id)
      .select();

    if (updateError) {
      console.error("❌ Database update error:", updateError);
      return {
        success: false,
        message: `Erreur lors de la modification: ${updateError.message}`,
      };
    }

    if (!updateData || updateData.length === 0) {
      console.error("❌ Update returned no data - possible RLS issue");
      return {
        success: false,
        message: "Erreur: La modification n'a pas pu être effectuée. Veuillez réessayer.",
      };
    }

    console.log("✅ Reservation updated successfully:", {
      id: reservation.id,
      updated_data: updateData,
    });

    // Formater la nouvelle date pour le message
    const reservationDate = new Date(newDate);
    const dateStr = reservationDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      success: true,
      message: `Réservation modifiée avec succès. Vous êtes maintenant ${newGuests} personne${newGuests > 1 ? 's' : ''} le ${dateStr} à ${newTime}.`,
    };
  } catch (error) {
    console.error("❌ Error in find_and_update_reservation:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la modification",
    };
  }
}

// Router pour gérer les appels de fonctions
export async function handleToolCall(toolName: string, args: any) {
  switch (toolName) {
    case "get_current_date":
      return handleGetCurrentDate();
    case "check_availability":
      return handleCheckAvailability(args);
    case "create_reservation":
      return handleCreateReservation(args);
    case "cancel_reservation":
      return handleCancelReservation(args);
    case "find_and_cancel_reservation":
      return handleFindAndCancelReservation(args);
    case "find_and_update_reservation":
      return handleFindAndUpdateReservation(args);
    default:
      return {
        success: false,
        message: `Fonction inconnue: ${toolName}`,
      };
  }
}
