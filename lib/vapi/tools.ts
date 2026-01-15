// @ts-nocheck
import { checkAvailability, checkDuplicateReservation, getServiceType } from "./availability";
import { addToWaitlist, formatAlternativesMessage } from "./waitlist";
import { sendConfirmationSMS } from "@/lib/sms/twilio";
import { JOURS_FR, MOIS_FR } from "@/lib/utils/date-fr";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

// Seuil pour groupes nécessitant validation manager
const LARGE_GROUP_THRESHOLD = 8;

// Seuil de confiance pour validation manuelle
const CONFIDENCE_THRESHOLD = 0.7;

interface CheckAvailabilityArgs {
  restaurant_id: string;
  date: string;
  time: string;
  number_of_guests: number;
}

interface CreateReservationArgs {
  restaurant_id: string;
  customer_name: string;
  customer_phone?: string; // Optionnel - injecté automatiquement depuis Twilio
  customer_email?: string;
  date: string;
  time: string;
  number_of_guests: number;
  special_requests?: string;
  call_id?: string;
  force_create?: boolean;
}

interface CancelReservationArgs {
  reservation_id: string;
}

interface FindAndCancelReservationArgs {
  restaurant_id: string;
  customer_name?: string; // Optionnel - peut chercher uniquement par téléphone
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

/**
 * Calcule le score de confiance basé sur la qualité des données
 */
function calculateConfidenceScore(args: CreateReservationArgs): number {
  let score = 0;

  // Vérifier que tous les champs requis sont remplis (+0.3)
  const requiredFields = [
    args.customer_name,
    args.customer_phone,
    args.date,
    args.time,
    args.number_of_guests,
  ];
  const filledFields = requiredFields.filter(
    (f) => f !== undefined && f !== null && f !== ""
  );
  score += (filledFields.length / requiredFields.length) * 0.3;

  // Format téléphone valide (+0.2)
  const phoneRegex = /^[0-9+\-\s()]{8,}$/;
  if (phoneRegex.test(args.customer_phone)) {
    score += 0.2;
  }

  // Nom client valide (au moins 2 caractères) (+0.15)
  if (args.customer_name && args.customer_name.trim().length >= 2) {
    score += 0.15;
  }

  // Date dans le futur (+0.15)
  const reservationDate = new Date(args.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (reservationDate >= today) {
    score += 0.15;
  }

  // Nombre de couverts raisonnable (1-20) (+0.2)
  if (args.number_of_guests >= 1 && args.number_of_guests <= 20) {
    score += 0.2;
  }

  return Math.min(score, 1);
}

// Tool 0: Obtenir les informations du restaurant (horaires, etc.)
interface GetRestaurantInfoArgs {
  restaurant_id: string;
}

export async function handleGetRestaurantInfo(args: GetRestaurantInfoArgs) {
  console.log("🏪 get_restaurant_info called with:", JSON.stringify(args, null, 2));

  try {
    const { data: restaurant, error } = await getSupabaseAdmin()
      .from("restaurants")
      .select("name, phone, address, opening_hours, closed_dates")
      .eq("id", args.restaurant_id)
      .single();

    if (error || !restaurant) {
      console.error("❌ Restaurant not found:", error);
      return {
        success: false,
        message: "Désolé, je n'ai pas pu récupérer les informations du restaurant.",
      };
    }

    console.log("✅ Restaurant info found:", restaurant.name);

    // Formatter les horaires en texte lisible
    const openingHours = restaurant.opening_hours as any;
    let hoursText = "";

    const daysMap: { [key: string]: string } = {
      monday: "Lundi",
      tuesday: "Mardi",
      wednesday: "Mercredi",
      thursday: "Jeudi",
      friday: "Vendredi",
      saturday: "Samedi",
      sunday: "Dimanche",
    };

    for (const [day, hours] of Object.entries(openingHours)) {
      const dayName = daysMap[day] || day;
      if (hours && typeof hours === "object") {
        const dayHours = hours as any;
        const services = [];

        if (dayHours.lunch) {
          services.push(
            `déjeuner ${dayHours.lunch.start}-${dayHours.lunch.end}`
          );
        }
        if (dayHours.dinner) {
          services.push(`dîner ${dayHours.dinner.start}-${dayHours.dinner.end}`);
        }

        if (services.length > 0) {
          hoursText += `${dayName}: ${services.join(" et ")}. `;
        } else {
          hoursText += `${dayName}: fermé. `;
        }
      } else {
        hoursText += `${dayName}: fermé. `;
      }
    }

    const result = {
      success: true,
      message: `Voici nos horaires d'ouverture : ${hoursText.trim()}`,
      restaurant_name: restaurant.name,
      phone: restaurant.phone,
      address: restaurant.address,
      opening_hours: hoursText.trim(),
      closed_dates: restaurant.closed_dates,
    };

    console.log("🏪 get_restaurant_info result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("❌ Error fetching restaurant info:", error);
    return {
      success: false,
      message: "Désolé, une erreur est survenue en récupérant les informations.",
    };
  }
}

// Tool 1: Obtenir la date actuelle
export async function handleGetCurrentDate() {
  console.log("📅 get_current_date called");

  const now = new Date();

  // Calculer quelques dates utiles
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const result = {
    success: true,
    message: `Nous sommes le ${JOURS_FR.FULL[now.getDay()]} ${now.getDate()} ${MOIS_FR.FULL[now.getMonth()]} ${now.getFullYear()}`,
    current_date: now.toISOString().split("T")[0], // Format YYYY-MM-DD
    current_time: now.toTimeString().split(" ")[0].substring(0, 5), // Format HH:mm
    day_of_week: JOURS_FR.FULL[now.getDay()],
    tomorrow_date: tomorrow.toISOString().split("T")[0],
    tomorrow_day: JOURS_FR.FULL[tomorrow.getDay()],
    next_week_date: nextWeek.toISOString().split("T")[0],
    year: now.getFullYear(),
    full_datetime: now.toLocaleString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  console.log("📅 get_current_date result:", JSON.stringify(result, null, 2));

  return result;
}

// Tool 1: Vérifier les disponibilités
export async function handleCheckAvailability(args: CheckAvailabilityArgs) {
  // 🧪 TEST Story 1.2 - Simuler erreur DB
  throw new Error("Simulated database connection error");

  console.log(
    "🔍 check_availability called with:",
    JSON.stringify(args, null, 2)
  );

  const result = await checkAvailability(getSupabaseAdmin(), {
    restaurantId: args.restaurant_id,
    date: args.date,
    time: args.time,
    numberOfGuests: args.number_of_guests,
  });

  console.log("🔍 check_availability result:", JSON.stringify(result, null, 2));

  if (result.available) {
    // Format de date en français
    const dateObj = new Date(args.date);
    const jourNom = JOURS_FR.FULL[dateObj.getDay()];
    const serviceLabel =
      result.serviceType === "lunch" ? "pour le déjeuner" : "pour le dîner";

    return {
      success: true,
      message: `Oui, nous avons de la disponibilité pour ${args.number_of_guests} ${args.number_of_guests === 1 ? "personne" : "personnes"} le ${jourNom} ${args.date} à ${args.time} ${serviceLabel}.`,
      available: true,
      serviceType: result.serviceType,
    };
  } else {
    // Si pas disponible, proposer des alternatives
    let message = result.reason;

    if (result.alternatives && result.alternatives.length > 0) {
      const alternativesMessage = await formatAlternativesMessage(
        args.restaurant_id,
        args.date,
        args.number_of_guests
      );
      if (alternativesMessage) {
        message += ` ${alternativesMessage}`;
      } else {
        message +=
          " Je peux également vous inscrire sur notre liste d'attente si vous le souhaitez.";
      }
    }

    return {
      success: false,
      message,
      available: false,
      alternatives: result.alternatives,
    };
  }
}

// Tool 2: Créer une réservation
export async function handleCreateReservation(args: CreateReservationArgs) {
  console.log(
    "📝 create_reservation called with:",
    JSON.stringify(args, null, 2)
  );


  try {
    // 0. Validation des champs requis
    const missingFields: string[] = [];
    if (!args.customer_name) missingFields.push("nom du client");
    // customer_phone est optionnel - injecté automatiquement depuis Twilio
    if (!args.date) missingFields.push("date");
    if (!args.time) missingFields.push("heure");
    if (!args.number_of_guests && args.number_of_guests !== 0) missingFields.push("nombre de personnes");

    if (missingFields.length > 0) {
      console.log("⚠️ Missing required fields:", missingFields);
      return {
        success: false,
        missing_fields: missingFields,
        message: `Il me manque des informations pour finaliser la réservation : ${missingFields.join(", ")}. Pouvez-vous me les donner ?`,
      };
    }

    // 1. Vérifier si c'est un grand groupe (> 8 personnes)
    if (args.number_of_guests > LARGE_GROUP_THRESHOLD) {
      console.log(
        `👥 Grand groupe détecté: ${args.number_of_guests} personnes`
      );

      // Ajouter à la waitlist avec statut "needs_manager_call"
      const waitlistResult = await addToWaitlist({
        restaurantId: args.restaurant_id,
        customerName: args.customer_name,
        customerPhone: args.customer_phone,
        customerEmail: args.customer_email,
        desiredDate: args.date,
        desiredTime: args.time,
        partySize: args.number_of_guests,
        notes: `Grand groupe - ${args.special_requests || ""}`,
        callId: args.call_id,
        status: "needs_manager_call",
      });

      return {
        success: true,
        requires_callback: true,
        message: `Pour les groupes de ${args.number_of_guests} personnes, je dois prendre vos coordonnées et le gérant vous rappellera dans les 24 heures pour finaliser votre réservation et discuter des conditions. Vos coordonnées ont bien été enregistrées.`,
        action: "transfer_to_manager",
      };
    }

    // 2. Vérifier si un doublon existe (même téléphone + même date)
    // Sauf si force_create est activé
    if (!args.force_create) {
      console.log("📝 Checking for duplicate reservation...");
      const duplicateCheck = await checkDuplicateReservation(getSupabaseAdmin(), {
        restaurantId: args.restaurant_id,
        customerPhone: args.customer_phone,
        date: args.date,
      });


      if (duplicateCheck.hasDuplicate && duplicateCheck.existingReservation) {
        console.log(
          "⚠️ Duplicate found:",
          duplicateCheck.existingReservation.id
        );

        // Formater la date de manière lisible
        const dateObj = new Date(args.date);
        const jourNom = JOURS_FR.FULL[dateObj.getDay()];
        const dateFormatee = `${jourNom} ${dateObj.getDate()} ${MOIS_FR.FULL[dateObj.getMonth()]}`;

        // Déterminer si c'est demain, aujourd'hui ou une autre date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reservationDate = new Date(args.date);
        reservationDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((reservationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let dateReference = dateFormatee;
        if (diffDays === 0) {
          dateReference = "aujourd'hui";
        } else if (diffDays === 1) {
          dateReference = "demain";
        }

        return {
          success: false,
          has_existing_reservation: true,
          existing_reservation: duplicateCheck.existingReservation,
          message: `Vous avez déjà une table pour ${dateReference} à ${duplicateCheck.existingReservation.reservation_time} pour ${duplicateCheck.existingReservation.number_of_guests} ${duplicateCheck.existingReservation.number_of_guests === 1 ? "personne" : "personnes"}. Souhaitez-vous la modifier ou en ajouter une autre ?`,
        };
      }
    } else {
      console.log("📝 force_create is true, skipping duplicate check");
    }

    // 3. Vérifier la disponibilité
    console.log("📝 Checking availability before creating reservation...");
    const availability = await checkAvailability(getSupabaseAdmin(), {
      restaurantId: args.restaurant_id,
      date: args.date,
      time: args.time,
      numberOfGuests: args.number_of_guests,
    });

    console.log(
      "📝 Availability check result:",
      JSON.stringify(availability, null, 2)
    );


    if (!availability.available) {
      console.log("❌ Not available:", availability.reason);

      // Proposer la waitlist si complet
      let message = `Désolé, ${availability.reason}`;

      if (availability.alternatives && availability.alternatives.length > 0) {
        const alternativesMessage = await formatAlternativesMessage(
          args.restaurant_id,
          args.date,
          args.number_of_guests
        );
        if (alternativesMessage) {
          message += ` ${alternativesMessage}`;
        }
      }

      message +=
        " Je peux également vous inscrire sur notre liste d'attente si vous préférez cette date.";

      return {
        success: false,
        message,
        offer_waitlist: true,
      };
    }

    // 4. Calculer le score de confiance
    const confidenceScore = calculateConfidenceScore(args);
    const needsConfirmation = confidenceScore < CONFIDENCE_THRESHOLD;

    console.log(
      `📊 Confidence score: ${confidenceScore}, needs_confirmation: ${needsConfirmation}`
    );

    // 5. Créer la réservation
    console.log("📝 Creating reservation in database...");

    // Récupérer les infos du restaurant pour le SMS
    const { data: restaurant } = await getSupabaseAdmin()
      .from("restaurants")
      .select("name, sms_enabled")
      .eq("id", args.restaurant_id)
      .single();

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
      status: needsConfirmation ? "pending" : "confirmed",
      confidence_score: confidenceScore,
      needs_confirmation: needsConfirmation,
    };

    // Vérifier si le call existe avant de l'associer
    if (args.call_id) {
      const { data: callExists } = await getSupabaseAdmin()
        .from("calls")
        .select("id")
        .eq("vapi_call_id", args.call_id)
        .single();

      if (callExists) {
        reservationData.call_id = callExists.id;
        console.log("✅ Call ID linked:", callExists.id);
      } else {
        console.log(
          "⚠️ Call ID not found in database, creating reservation without call_id"
        );
      }
    }

    const { data: reservation, error } = await getSupabaseAdmin()
      .from("reservations")
      .insert(reservationData)
      .select()
      .single();


    if (error) {
      console.error("❌ Database error:", error);
      return {
        success: false,
        message:
          "Désolé, une erreur est survenue lors de la création de la réservation. Veuillez réessayer.",
      };
    }

    console.log("✅ Reservation created successfully:", reservation.id);

    // 6. Envoyer SMS de confirmation si activé
    if (restaurant?.sms_enabled && args.customer_phone) {
      console.log("📱 Sending confirmation SMS...");
      try {
        await sendConfirmationSMS({
          phone: args.customer_phone,
          customerName: args.customer_name,
          restaurantName: restaurant.name,
          date: args.date,
          time: args.time,
          guests: args.number_of_guests,
          cancellationToken: reservation.cancellation_token,
        });
        console.log("✅ SMS sent successfully");
      } catch (smsError) {
        console.error("⚠️ SMS sending failed:", smsError);
        // Ne pas bloquer la réservation si le SMS échoue
      }
    } else if (restaurant?.sms_enabled && !args.customer_phone) {
      console.log("⚠️ SMS enabled but no phone number available - skipping SMS");
    }

    // Format de date en français pour le message
    const dateObj = new Date(args.date);
    const jourNom = JOURS_FR.FULL[dateObj.getDay()];

    let confirmationMessage = `Parfait ! Votre réservation est confirmée pour ${args.number_of_guests} ${args.number_of_guests === 1 ? "personne" : "personnes"} le ${jourNom} ${args.date} à ${args.time}.`;

    if (restaurant?.sms_enabled && args.customer_phone) {
      confirmationMessage +=
        " Vous allez recevoir un SMS de confirmation avec un lien pour annuler si besoin.";
    }

    confirmationMessage += " À bientôt !";

    const finalResult = {
      success: true,
      message: confirmationMessage,
      reservation_id: reservation.id,
      confidence_score: confidenceScore,
      needs_confirmation: needsConfirmation,
    };


    return finalResult;
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
  console.log(
    "❌ cancel_reservation called with:",
    JSON.stringify(args, null, 2)
  );

  try {
    const { error } = await getSupabaseAdmin()
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

// Tool 4: Rechercher et annuler une réservation par téléphone ou nom
export async function handleFindAndCancelReservation(
  args: FindAndCancelReservationArgs
) {
  console.log("========================================");
  console.log("🔍 find_and_cancel_reservation called");
  console.log("  Args received:", JSON.stringify(args, null, 2));
  console.log("  customer_name:", args.customer_name, "(type:", typeof args.customer_name, ")");
  console.log("  customer_phone:", args.customer_phone, "(type:", typeof args.customer_phone, ")");
  console.log("  restaurant_id:", args.restaurant_id, "(type:", typeof args.restaurant_id, ")");

  // Vérification immédiate des args critiques
  if (!args.restaurant_id) {
    console.error("❌ CRITICAL: restaurant_id is missing!");
    return {
      success: false,
      message: "Erreur système: impossible d'identifier le restaurant. Veuillez réessayer.",
    };
  }

  if (!args.customer_phone && !args.customer_name) {
    console.log("⚠️ No customer_phone AND no customer_name provided");
    return {
      success: false,
      message: "J'ai besoin soit de votre nom, soit du numéro de téléphone utilisé pour la réservation.",
    };
  }

  try {
    // Si on a SEULEMENT le téléphone (pas de nom), recherche directe
    if (!args.customer_name && args.customer_phone) {
      console.log("📞 Direct phone search:", args.customer_phone);

      const { data: reservations, error: searchError } = await getSupabaseAdmin()
        .from("reservations")
        .select("*")
        .eq("restaurant_id", args.restaurant_id)
        .eq("customer_phone", args.customer_phone)
        .in("status", ["pending", "confirmed"])
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true });

      if (searchError) {
        console.error("❌ Phone search error:", searchError);
        return {
          success: false,
          message: "Désolé, une erreur est survenue lors de la recherche.",
        };
      }

      if (!reservations || reservations.length === 0) {
        console.log("⚠️ No reservation found for phone:", args.customer_phone);
        return {
          success: false,
          message: "Aucune réservation trouvée avec ce numéro de téléphone. Avez-vous peut-être réservé sous un autre nom ou numéro ?",
        };
      }

      // Si UNE seule réservation : annuler directement
      if (reservations.length === 1) {
        const reservation = reservations[0];
        const reservationDate = new Date(reservation.reservation_date);
        const dateStr = reservationDate.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

        // Annuler la réservation
        console.log("🔄 Attempting to cancel reservation ID:", reservation.id);
        console.log("   Current status:", reservation.status);

        const { data: updateData, error: updateError } = await getSupabaseAdmin()
          .from("reservations")
          .update({ status: "cancelled" })
          .eq("id", reservation.id)
          .select();

        if (updateError) {
          console.error("❌ Database update error:", updateError);
          return {
            success: false,
            message: `Erreur lors de l'annulation: ${updateError.message}`,
          };
        }

        if (!updateData || updateData.length === 0) {
          console.error("❌ Update returned no data - possible RLS issue");
          return {
            success: false,
            message: "Impossible d'annuler la réservation. Veuillez contacter le restaurant.",
          };
        }

        console.log("✅ Reservation cancelled successfully:", reservation.id);
        console.log("   Updated data:", JSON.stringify(updateData[0], null, 2));

        return {
          success: true,
          message: `Réservation annulée avec succès. Il s'agissait de la réservation pour ${reservation.number_of_guests} personne${reservation.number_of_guests > 1 ? "s" : ""} le ${dateStr} à ${reservation.reservation_time} au nom de ${reservation.customer_name}.`,
        };
      }

      // Si PLUSIEURS réservations : lister et demander laquelle
      if (reservations.length > 1) {
        const list = reservations.map((r: any, idx: number) => {
          const date = new Date(r.reservation_date);
          const dateStr = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
          return `${idx + 1}. ${dateStr} à ${r.reservation_time} pour ${r.number_of_guests} personne${r.number_of_guests > 1 ? "s" : ""}`;
        }).join(", ");

        return {
          success: false,
          needs_clarification: true,
          message: `J'ai trouvé ${reservations.length} réservations : ${list}. Laquelle souhaitez-vous annuler ?`,
        };
      }
    }

    // Si on a un NOM (avec ou sans téléphone), utiliser la recherche phonétique
    if (args.customer_name) {
      // Utiliser la recherche phonétique avec pg_trgm
      const { data: reservations, error: searchError } = await getSupabaseAdmin().rpc(
        "fuzzy_search_reservations",
        {
          p_restaurant_id: args.restaurant_id,
          p_name: args.customer_name,
          p_phone: args.customer_phone || null,
          p_min_similarity: 0.3,
        }
      );

      if (searchError) {
        console.error("❌ Search error:", searchError);
        // Fallback à la recherche classique si la fonction n'existe pas encore
        return await fallbackFindAndCancel(args);
      }

      if (!reservations || reservations.length === 0) {
        console.log("⚠️ No reservation found for:", args.customer_name);
        return {
          success: false,
          message: `Aucune réservation trouvée au nom de ${args.customer_name}. La réservation a peut-être déjà été annulée ou le nom ne correspond pas exactement.`,
        };
      }

      // Si plusieurs réservations avec des scores proches, demander précision
      if (reservations.length > 1) {
        const topScore = reservations[0].similarity_score;
        const closeMatches = reservations.filter(
          (r: any) => Math.abs(r.similarity_score - topScore) < 0.1
        );

        if (closeMatches.length > 1 && !args.customer_phone) {
          const matchNames = closeMatches
            .map(
              (r: any) =>
                `${r.customer_name} (${new Date(r.reservation_date).toLocaleDateString("fr-FR")} à ${r.reservation_time})`
            )
            .join(", ");
          return {
            success: false,
            needs_clarification: true,
            message: `J'ai trouvé plusieurs réservations similaires: ${matchNames}. Pouvez-vous me confirmer le numéro de téléphone pour identifier la bonne réservation ?`,
          };
        }
      }

      // Prendre la meilleure correspondance
      const reservation = reservations[0];

      // Annuler la réservation trouvée
      console.log("🔄 Attempting to cancel reservation ID:", reservation.id);
      console.log("   Current status:", reservation.status);

      const { data: updateData, error: updateError } = await getSupabaseAdmin()
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservation.id)
        .select();

      if (updateError) {
        console.error("❌ Database update error:", updateError);
        return {
          success: false,
          message: `Erreur lors de l'annulation: ${updateError.message}`,
        };
      }

      if (!updateData || updateData.length === 0) {
        console.error("❌ Update returned no data - possible RLS issue");
        return {
          success: false,
          message: "Impossible d'annuler la réservation. Veuillez contacter le restaurant.",
        };
      }

      console.log("✅ Reservation cancelled successfully:", reservation.id);
      console.log("   Updated data:", JSON.stringify(updateData[0], null, 2));

      // Formater la date pour le message de confirmation
      const reservationDate = new Date(reservation.reservation_date);
      const dateStr = reservationDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      return {
        success: true,
        message: `Réservation annulée avec succès. Il s'agissait de la réservation pour ${reservation.number_of_guests} personne${reservation.number_of_guests > 1 ? "s" : ""} le ${dateStr} à ${reservation.reservation_time}.`,
      };
    }

    // Si on arrive ici, c'est qu'on n'a pas trouvé de réservation (ne devrait jamais arriver)
    console.log("⚠️ Reached end of function without finding/cancelling reservation");
    return {
      success: false,
      message: "Aucune réservation trouvée.",
    };
  } catch (error) {
    console.error("❌ EXCEPTION in find_and_cancel_reservation");
    console.error("  Error:", error);
    console.error("  Error message:", error instanceof Error ? error.message : String(error));
    console.error("  Error stack:", error instanceof Error ? error.stack : "N/A");
    console.error("  Args at time of error:", JSON.stringify(args, null, 2));
    return {
      success: false,
      message: "Une erreur est survenue lors de la recherche et l'annulation",
    };
  }
}

// Fallback pour la recherche classique (si pg_trgm n'est pas disponible)
async function fallbackFindAndCancel(args: FindAndCancelReservationArgs) {
  console.log("📋 [FALLBACK] Fallback cancellation called");

  if (!args.customer_name) {
    console.log("⚠️ [FALLBACK] No customer_name provided for fallback");
    return {
      success: false,
      message: "J'ai besoin du nom du client pour rechercher la réservation.",
    };
  }

  const searchTerms = args.customer_name.trim().split(/\s+/);

  let query = getSupabaseAdmin()
    .from("reservations")
    .select("*")
    .eq("restaurant_id", args.restaurant_id)
    .in("status", ["pending", "confirmed"])
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  if (searchTerms.length > 0) {
    const orConditions = searchTerms
      .map((term) => `customer_name.ilike.%${term}%`)
      .join(",");
    query = query.or(orConditions);
  }

  if (args.customer_phone) {
    query = query.eq("customer_phone", args.customer_phone);
  }

  const { data: reservations, error: searchError } = await query;

  if (searchError || !reservations || reservations.length === 0) {
    return {
      success: false,
      message: `Aucune réservation trouvée au nom de ${args.customer_name}.`,
    };
  }

  const reservation = reservations[0];

  console.log("🔄 [FALLBACK] Attempting to cancel reservation ID:", reservation.id);
  console.log("   Current status:", reservation.status);

  const { data: updateData, error: updateError } = await getSupabaseAdmin()
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservation.id)
    .select();

  if (updateError) {
    console.error("❌ [FALLBACK] Database update error:", updateError);
    return {
      success: false,
      message: `Erreur lors de l'annulation: ${updateError.message}`,
    };
  }

  if (!updateData || updateData.length === 0) {
    console.error("❌ [FALLBACK] Update returned no data - possible RLS issue");
    return {
      success: false,
      message: "Impossible d'annuler la réservation. Veuillez contacter le restaurant.",
    };
  }

  console.log("✅ [FALLBACK] Reservation cancelled successfully:", reservation.id);
  console.log("   Updated data:", JSON.stringify(updateData[0], null, 2));

  const reservationDate = new Date(reservation.reservation_date);
  const dateStr = reservationDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    success: true,
    message: `Réservation annulée avec succès. Il s'agissait de la réservation pour ${reservation.number_of_guests} personne${reservation.number_of_guests > 1 ? "s" : ""} le ${dateStr} à ${reservation.reservation_time}.`,
  };
}

// Tool 5: Rechercher et modifier une réservation (avec recherche phonétique)
export async function handleFindAndUpdateReservation(
  args: FindAndUpdateReservationArgs
) {
  console.log(
    "✏️ find_and_update_reservation called with:",
    JSON.stringify(args, null, 2)
  );

  try {
    // Utiliser la recherche phonétique avec pg_trgm
    const { data: reservations, error: searchError } = await getSupabaseAdmin().rpc(
      "fuzzy_search_reservations",
      {
        p_restaurant_id: args.restaurant_id,
        p_name: args.customer_name,
        p_phone: args.customer_phone || null,
        p_min_similarity: 0.3,
      }
    );

    if (searchError) {
      console.error("❌ Search error:", searchError);
      // Fallback à la recherche classique
      return await fallbackFindAndUpdate(args);
    }

    if (!reservations || reservations.length === 0) {
      console.log("⚠️ No reservation found for:", args.customer_name);
      return {
        success: false,
        message: `Aucune réservation trouvée au nom de ${args.customer_name}.`,
      };
    }

    // Gérer les cas de multiples correspondances
    if (reservations.length > 1 && !args.customer_phone) {
      const topScore = reservations[0].similarity_score;
      const closeMatches = reservations.filter(
        (r: any) => Math.abs(r.similarity_score - topScore) < 0.1
      );

      if (closeMatches.length > 1) {
        return {
          success: false,
          needs_clarification: true,
          message: `J'ai trouvé plusieurs réservations similaires. Pouvez-vous me confirmer le numéro de téléphone pour identifier la bonne réservation ?`,
        };
      }
    }

    const reservation = reservations[0];

    // Préparer les nouvelles valeurs
    const newDate = args.new_date || reservation.reservation_date;
    const newTime = args.new_time || reservation.reservation_time;
    const newGuests = args.new_number_of_guests || reservation.number_of_guests;

    // Vérifier la disponibilité si changement
    if (args.new_date || args.new_time || args.new_number_of_guests) {
      const availabilityResult = await checkAvailability(getSupabaseAdmin(), {
        restaurantId: args.restaurant_id,
        date: newDate,
        time: newTime,
        numberOfGuests: newGuests,
      });

      if (!availabilityResult.available) {
        return {
          success: false,
          message: `Désolé, ${availabilityResult.reason}`,
        };
      }
    }

    // Mettre à jour la réservation
    const { data: updateData, error: updateError } = await getSupabaseAdmin()
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

    console.log("✅ Reservation updated successfully:", reservation.id);

    const reservationDate = new Date(newDate);
    const dateStr = reservationDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return {
      success: true,
      message: `Réservation modifiée avec succès. Vous êtes maintenant ${newGuests} personne${newGuests > 1 ? "s" : ""} le ${dateStr} à ${newTime}.`,
    };
  } catch (error) {
    console.error("❌ Error in find_and_update_reservation:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la modification",
    };
  }
}

// Fallback pour la modification classique
async function fallbackFindAndUpdate(args: FindAndUpdateReservationArgs) {
  const searchTerms = args.customer_name.trim().split(/\s+/);

  let query = getSupabaseAdmin()
    .from("reservations")
    .select("*")
    .eq("restaurant_id", args.restaurant_id)
    .in("status", ["pending", "confirmed"])
    .order("reservation_date", { ascending: true });

  if (searchTerms.length > 0) {
    const orConditions = searchTerms
      .map((term) => `customer_name.ilike.%${term}%`)
      .join(",");
    query = query.or(orConditions);
  }

  if (args.customer_phone) {
    query = query.eq("customer_phone", args.customer_phone);
  }

  const { data: reservations, error } = await query;

  if (error || !reservations || reservations.length === 0) {
    return {
      success: false,
      message: `Aucune réservation trouvée au nom de ${args.customer_name}.`,
    };
  }

  const reservation = reservations[0];
  const newDate = args.new_date || reservation.reservation_date;
  const newTime = args.new_time || reservation.reservation_time;
  const newGuests = args.new_number_of_guests || reservation.number_of_guests;

  if (args.new_date || args.new_time || args.new_number_of_guests) {
    const availabilityResult = await checkAvailability(getSupabaseAdmin(), {
      restaurantId: args.restaurant_id,
      date: newDate,
      time: newTime,
      numberOfGuests: newGuests,
    });

    if (!availabilityResult.available) {
      return {
        success: false,
        message: availabilityResult.reason,
      };
    }
  }

  const { error: updateError } = await getSupabaseAdmin()
    .from("reservations")
    .update({
      reservation_date: newDate,
      reservation_time: newTime,
      number_of_guests: newGuests,
    })
    .eq("id", reservation.id);

  if (updateError) {
    return {
      success: false,
      message: `Erreur lors de la modification: ${updateError.message}`,
    };
  }

  const dateStr = new Date(newDate).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    success: true,
    message: `Réservation modifiée avec succès. Vous êtes maintenant ${newGuests} personne${newGuests > 1 ? "s" : ""} le ${dateStr} à ${newTime}.`,
  };
}

// Tool 6: Ajouter à la liste d'attente
interface AddToWaitlistArgs {
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  date: string;
  time?: string;
  number_of_guests: number;
  notes?: string;
  call_id?: string;
}

export async function handleAddToWaitlist(args: AddToWaitlistArgs) {
  console.log("📋 add_to_waitlist called with:", JSON.stringify(args, null, 2));

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
import { handleTransferCall, type TransferReason } from "./transfer";

interface TransferCallArgs {
  restaurant_id: string;
  reason: TransferReason;
  call_id?: string;
  guest_count?: number;
  failed_attempts?: number;
}

export async function handleTransfer(args: TransferCallArgs) {
  console.log("🔄 transfer_call called with:", JSON.stringify(args, null, 2));
  return handleTransferCall(args);
}

// Tool 8: Créer une demande suite à une erreur technique (Story 1.2)
interface CreateTechnicalErrorRequestArgs {
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  date?: string; // Optionnel - client peut ne pas avoir spécifié avant l'erreur
  time?: string; // Optionnel
  number_of_guests?: number; // Optionnel
  special_requests?: string;
  call_id?: string;
}

export async function handleCreateTechnicalErrorRequest(
  args: CreateTechnicalErrorRequestArgs
) {
  console.log(
    "⚠️ create_technical_error_request called with:",
    JSON.stringify(args, null, 2)
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

    // Créer l'enregistrement de type "technical_error"
    const { data: errorRequest, error: insertError } = await getSupabaseAdmin()
      .from("reservations")
      .insert({
        restaurant_id: args.restaurant_id,
        customer_name: args.customer_name.trim(),
        customer_phone: args.customer_phone.trim(),
        customer_email: null,
        reservation_date: args.date || null, // NULL si non spécifié
        reservation_time: args.time || null, // NULL si non spécifié
        number_of_guests: args.number_of_guests || 0,
        duration: 90, // Durée par défaut
        status: "pending_request", // Statut spécial pour demandes en attente
        source: "phone",
        request_type: "technical_error", // Nouveau champ Story 1.2
        special_requests: args.special_requests || "Demande suite à une erreur technique",
        internal_notes: `Erreur technique survenue pendant l'appel. Client a fourni ses coordonnées pour rappel.${args.call_id ? ` Call ID: ${args.call_id}` : ""}`,
        call_id: args.call_id || null,
      })
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

    // Message de confirmation pour l'agent
    let confirmationMessage = `Merci ${args.customer_name}. J'ai bien noté vos coordonnées`;

    if (args.date) {
      const dateObj = new Date(args.date);
      const dateStr = dateObj.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      confirmationMessage += ` ainsi que votre souhait de réserver pour le ${dateStr}`;

      if (args.time) {
        confirmationMessage += ` à ${args.time}`;
      }

      if (args.number_of_guests) {
        confirmationMessage += ` pour ${args.number_of_guests} personne${args.number_of_guests > 1 ? "s" : ""}`;
      }
    }

    confirmationMessage += `. Le restaurant vous contactera dans les plus brefs délais pour finaliser votre demande. Bonne journée !`;

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
export async function handleToolCall(toolName: string, args: any) {
  switch (toolName) {
    case "get_restaurant_info":
      return handleGetRestaurantInfo(args);
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
    case "add_to_waitlist":
      return handleAddToWaitlist(args);
    case "transfer_call":
      return handleTransfer(args);
    case "create_technical_error_request":
      return handleCreateTechnicalErrorRequest(args);
    default:
      return {
        success: false,
        message: `Fonction inconnue: ${toolName}`,
      };
  }
}
