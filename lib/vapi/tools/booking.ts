// Tools de réservation : vérification de disponibilité et création (RPC atomique).
import {
  checkAvailability,
  checkDuplicateReservation,
  CAPACITY_BUFFER_RATIO,
} from "../availability";
import { addToWaitlist, formatAlternativesMessage } from "../waitlist";
import { sendConfirmationSMS } from "@/lib/sms/twilio";
import { JOURS_FR, MOIS_FR } from "@/lib/utils/date-fr";
import { redactPII } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CheckAvailabilityArgs, CreateReservationArgs } from "./types";

// Seuil pour groupes nécessitant validation manager
const LARGE_GROUP_THRESHOLD = 8;

// Seuil de confiance pour validation manuelle
const CONFIDENCE_THRESHOLD = 0.7;

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
  if (args.customer_phone && phoneRegex.test(args.customer_phone)) {
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

export async function handleCheckAvailability(args: CheckAvailabilityArgs) {
  console.log(
    "🔍 check_availability called with:",
    JSON.stringify(redactPII(args), null, 2)
  );

  const result = await checkAvailability(getSupabaseAdmin(), {
    restaurantId: args.restaurant_id,
    date: args.date,
    time: args.time,
    numberOfGuests: args.number_of_guests,
  });

  console.log("🔍 check_availability result:", JSON.stringify(result, null, 2));

  if (result.available) {
    // Message bref : les détails ont déjà été récapitulés à la confirmation
    return {
      success: true,
      message: "Oui, c'est disponible !",
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


export async function handleCreateReservation(args: CreateReservationArgs) {
  console.log(
    "📝 create_reservation called with:",
    JSON.stringify(redactPII(args), null, 2)
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
        customerPhone: args.customer_phone!,
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
        customerPhone: args.customer_phone!,
        date: args.date,
      });

      if (duplicateCheck.checkFailed) {
        // Panne de la garde applicative : on continue, l'index unique DB
        // (uniq_reservations_active_slot) bloquera un vrai doublon à l'insert.
        console.error("⚠️ Duplicate check failed, relying on DB unique index");
      }

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
    let linkedCallId: string | null = null;
    if (args.call_id) {
      const { data: callExists } = await getSupabaseAdmin()
        .from("calls")
        .select("id")
        .eq("vapi_call_id", args.call_id)
        .maybeSingle();

      if (callExists) {
        linkedCallId = callExists.id;
        console.log("✅ Call ID linked:", callExists.id);
      } else {
        console.log(
          "⚠️ Call ID not found in database, creating reservation without call_id"
        );
      }
    }

    // Insertion via RPC atomique (migration 00010) : le recompte de capacité
    // se fait sous verrou dans la transaction d'insertion, ce qui ferme la
    // course entre le checkAvailability ci-dessus et l'écriture. La clé
    // d'idempotence (call Vapi + créneau) rend les retries webhook inoffensifs.
    const idempotencyKey = args.call_id
      ? `${args.call_id}:${args.date}:${args.time}`
      : null;

    const { data: rpcRows, error } = await getSupabaseAdmin().rpc(
      "create_reservation_atomic",
      {
        p_restaurant_id: args.restaurant_id,
        p_customer_name: args.customer_name,
        p_customer_phone: args.customer_phone!,
        p_date: args.date,
        p_time: args.time,
        p_number_of_guests: args.number_of_guests,
        p_customer_email: args.customer_email || null,
        p_special_requests: args.special_requests || null,
        p_status: needsConfirmation ? "pending" : "confirmed",
        p_source: "phone",
        p_confidence_score: confidenceScore,
        p_needs_confirmation: needsConfirmation,
        p_call_id: linkedCallId,
        p_idempotency_key: idempotencyKey,
        p_capacity_buffer_ratio: CAPACITY_BUFFER_RATIO,
      }
    );

    if (error) {
      // Course perdue : un autre appel/résa a rempli le service entre le
      // check de disponibilité et l'insertion.
      if (error.message?.includes("CAPACITY_EXCEEDED") || error.code === "P0001") {
        console.log("❌ Capacity exceeded at insert time (race lost):", error.details);

        let message =
          "Désolé, ce créneau vient tout juste de se remplir et nous sommes complets pour ce service.";
        const alternativesMessage = await formatAlternativesMessage(
          args.restaurant_id,
          args.date,
          args.number_of_guests
        );
        if (alternativesMessage) {
          message += ` ${alternativesMessage}`;
        }
        message +=
          " Je peux également vous inscrire sur notre liste d'attente si vous préférez cette date.";

        return {
          success: false,
          message,
          offer_waitlist: true,
        };
      }

      // Doublon bloqué par l'index unique (garde applicative contournée ou en panne)
      if (error.code === "23505") {
        console.log("❌ Duplicate reservation blocked by DB unique index");
        return {
          success: false,
          has_existing_reservation: true,
          message:
            "Vous avez déjà une réservation pour ce créneau. Souhaitez-vous la modifier ?",
        };
      }

      console.error("❌ Database error:", error);
      return {
        success: false,
        message:
          "Désolé, une erreur est survenue lors de la création de la réservation. Veuillez réessayer.",
      };
    }

    const rpcRow = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    if (!rpcRow) {
      console.error("❌ create_reservation_atomic returned no row");
      return {
        success: false,
        message:
          "Désolé, une erreur est survenue lors de la création de la réservation. Veuillez réessayer.",
      };
    }

    const reservation = {
      id: rpcRow.reservation_id,
      cancellation_token: rpcRow.reservation_cancellation_token,
    };
    // was_created=false : retry d'une écriture déjà aboutie (ex. timeout webhook
    // alors que l'INSERT a fini en arrière-plan). On confirme au client sans
    // ré-envoyer de SMS.
    const wasCreated = rpcRow.was_created;

    console.log(
      wasCreated
        ? `✅ Reservation created successfully: ${reservation.id}`
        : `♻️ Reservation replayed idempotently: ${reservation.id}`
    );

    // 6. Envoyer SMS de confirmation si activé
    if (wasCreated && restaurant?.sms_enabled && args.customer_phone) {
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
    const partySize = `${args.number_of_guests} ${args.number_of_guests === 1 ? "personne" : "personnes"}`;

    // La ligne a été enregistrée en `pending` quand needsConfirmation est vrai :
    // ne pas annoncer "confirmée", sinon le client croit sa table réservée alors
    // qu'elle nécessite une validation manuelle du restaurant.
    let confirmationMessage = needsConfirmation
      ? `J'enregistre votre demande de réservation pour ${partySize} le ${jourNom} ${args.date} à ${args.time}. Le restaurant vous confirmera dans les meilleurs délais.`
      : `Parfait ! Votre réservation est confirmée pour ${partySize} le ${jourNom} ${args.date} à ${args.time}.`;

    if (!needsConfirmation && restaurant?.sms_enabled && args.customer_phone) {
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

