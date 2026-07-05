// Tools d'annulation et de modification de réservation (recherche par tel/nom).
import { checkAvailability } from "../availability";
import { redactPII, redactName, redactPhone } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  ReservationRow,
  FuzzyReservationMatch,
  CancelReservationArgs,
  FindAndCancelReservationArgs,
  FindReservationForCancellationArgs,
  FindAndUpdateReservationArgs,
} from "./types";

export async function handleCancelReservation(args: CancelReservationArgs) {
  console.log(
    "❌ cancel_reservation called with:",
    JSON.stringify(redactPII(args), null, 2)
  );

  try {
    // Scoping tenant obligatoire (client service-role = RLS bypassée) + garde
    // sur le statut : on ne "ré-annule" pas une réservation terminale, et on
    // n'annule jamais la réservation d'un autre restaurant.
    const { data: updated, error } = await getSupabaseAdmin()
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", args.reservation_id)
      .eq("restaurant_id", args.restaurant_id)
      .in("status", ["pending", "confirmed"])
      .select("id");

    if (error) {
      console.error("❌ Database error:", error);
      return {
        success: false,
        message: `Erreur lors de l'annulation: ${error.message}`,
      };
    }

    if (!updated || updated.length === 0) {
      console.log("⚠️ Aucune réservation annulable trouvée:", args.reservation_id);
      return {
        success: false,
        message: "Aucune réservation active à annuler n'a été trouvée.",
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
  console.log("  Args received:", JSON.stringify(redactPII(args), null, 2));
  console.log("  customer_name:", redactName(args.customer_name), "(type:", typeof args.customer_name, ")");
  console.log("  customer_phone:", redactPhone(args.customer_phone), "(type:", typeof args.customer_phone, ")");
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
      console.log("📞 Direct phone search:", redactPhone(args.customer_phone));

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
        console.log("⚠️ No reservation found for phone:", redactPhone(args.customer_phone));
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
        const list = reservations.map((r, idx) => {
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
      // Seuil de similarité à 0.4 pour éviter les faux positifs
      const SIMILARITY_THRESHOLD = 0.4;

      // Utiliser la recherche phonétique avec pg_trgm
      const { data: reservations, error: searchError } = await getSupabaseAdmin().rpc(
        "fuzzy_search_reservations",
        {
          p_restaurant_id: args.restaurant_id,
          p_name: args.customer_name,
          p_phone: args.customer_phone || null,
          p_min_similarity: SIMILARITY_THRESHOLD,
        }
      );

      if (searchError) {
        console.error("❌ Search error:", searchError);
        // Fallback à la recherche classique si la fonction n'existe pas encore
        return await fallbackFindAndCancel(args);
      }

      // Filtrer les résultats avec un score trop bas (faux positifs)
      const validReservations = reservations?.filter(
        (r: FuzzyReservationMatch) => r.similarity_score >= SIMILARITY_THRESHOLD || args.customer_phone === r.customer_phone
      ) || [];

      console.log("🔍 Cancel search results:", reservations?.length || 0, "total,", validReservations.length, "valid matches");
      if (reservations?.length > 0) {
        console.log("🔍 Best match:", redactName(reservations[0].customer_name), "score:", reservations[0].similarity_score);
      }

      if (validReservations.length === 0) {
        console.log("⚠️ No reservation found for:", redactName(args.customer_name));
        return {
          success: false,
          message: `Aucune réservation trouvée au nom de ${args.customer_name}. La réservation a peut-être déjà été annulée ou le nom ne correspond pas exactement.`,
        };
      }

      // Si plusieurs réservations avec des scores proches, demander précision
      if (validReservations.length > 1) {
        const topScore = validReservations[0].similarity_score;
        const closeMatches = validReservations.filter(
          (r: FuzzyReservationMatch) => Math.abs(r.similarity_score - topScore) < 0.1
        );

        if (closeMatches.length > 1 && !args.customer_phone) {
          const matchNames = closeMatches
            .map(
              (r: FuzzyReservationMatch) =>
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

      // Prendre la meilleure correspondance validée
      const reservation = validReservations[0];

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
    console.error("  Args at time of error:", JSON.stringify(redactPII(args), null, 2));
    return {
      success: false,
      message: "Une erreur est survenue lors de la recherche et l'annulation",
    };
  }
}

// Tool 5: Rechercher une réservation pour annulation (SANS annuler)
// Retourne les détails pour confirmation par l'agent avant annulation
export async function handleFindReservationForCancellation(
  args: FindReservationForCancellationArgs
) {
  console.log("========================================");
  console.log("🔍 find_reservation_for_cancellation called");
  console.log("  Args received:", JSON.stringify(redactPII(args), null, 2));

  if (!args.restaurant_id) {
    console.error("❌ CRITICAL: restaurant_id is missing!");
    return {
      success: false,
      message: "Erreur système: impossible d'identifier le restaurant.",
    };
  }

  if (!args.customer_phone && !args.customer_name) {
    console.log("⚠️ No customer_phone AND no customer_name provided");
    return {
      success: false,
      message: "J'ai besoin soit de votre nom, soit du numéro de téléphone.",
    };
  }

  try {
    let reservations: ReservationRow[] = [];

    // Recherche par téléphone d'abord (si disponible)
    if (args.customer_phone) {
      console.log("📞 Searching by phone:", redactPhone(args.customer_phone));

      const { data, error } = await getSupabaseAdmin()
        .from("reservations")
        .select("*")
        .eq("restaurant_id", args.restaurant_id)
        .eq("customer_phone", args.customer_phone)
        .in("status", ["pending", "confirmed"])
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true });

      if (error) {
        console.error("❌ Phone search error:", error);
        return {
          success: false,
          message: "Erreur lors de la recherche.",
        };
      }

      reservations = data || [];
    }

    // Si pas de résultat par téléphone et qu'on a un nom, rechercher par nom
    if (reservations.length === 0 && args.customer_name) {
      console.log("👤 Searching by name:", redactName(args.customer_name));

      const { data, error } = await getSupabaseAdmin()
        .from("reservations")
        .select("*")
        .eq("restaurant_id", args.restaurant_id)
        .ilike("customer_name", `%${args.customer_name}%`)
        .in("status", ["pending", "confirmed"])
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true });

      if (error) {
        console.error("❌ Name search error:", error);
        return {
          success: false,
          message: "Erreur lors de la recherche.",
        };
      }

      reservations = data || [];
    }

    // Aucune réservation trouvée
    if (reservations.length === 0) {
      console.log("⚠️ No reservation found");
      return {
        success: false,
        found: false,
        message: args.customer_name
          ? `Aucune réservation trouvée au nom de ${args.customer_name}.`
          : "Aucune réservation trouvée avec ce numéro de téléphone.",
      };
    }

    // UNE seule réservation trouvée - retourner les détails pour confirmation
    if (reservations.length === 1) {
      const reservation = reservations[0];
      const reservationDate = new Date(reservation.reservation_date);
      const dateStr = reservationDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      console.log("✅ Found 1 reservation:", reservation.id);
      return {
        success: true,
        found: true,
        reservation_id: reservation.id,
        customer_name: reservation.customer_name,
        date: dateStr,
        time: reservation.reservation_time,
        number_of_guests: reservation.number_of_guests,
        message: `Réservation trouvée au nom de ${reservation.customer_name} pour ${reservation.number_of_guests} personne${reservation.number_of_guests > 1 ? "s" : ""} le ${dateStr} à ${reservation.reservation_time}. IMPORTANT: Pour annuler, appeler cancel_reservation avec reservation_id="${reservation.id}"`,
      };
    }

    // PLUSIEURS réservations - lister pour clarification
    console.log(`⚠️ Found ${reservations.length} reservations`);
    const list = reservations.map((r, idx) => {
      const date = new Date(r.reservation_date);
      const dateStr = date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long"
      });
      return {
        index: idx + 1,
        reservation_id: r.id,
        customer_name: r.customer_name,
        date: dateStr,
        time: r.reservation_time,
        number_of_guests: r.number_of_guests,
      };
    });

    const listStr = list.map((r) =>
      `${r.index}. ${r.customer_name} - ${r.date} à ${r.time} pour ${r.number_of_guests} personne${r.number_of_guests > 1 ? "s" : ""} (ID: ${r.reservation_id})`
    ).join(", ");

    return {
      success: true,
      found: true,
      multiple: true,
      reservations: list,
      message: `J'ai trouvé ${reservations.length} réservations : ${listStr}. Laquelle souhaitez-vous annuler ? IMPORTANT: Utiliser le reservation_id correspondant pour cancel_reservation.`,
    };

  } catch (error) {
    console.error("❌ EXCEPTION in find_reservation_for_cancellation:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la recherche.",
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

// Tool 5: Rechercher et modifier une réservation
export async function handleFindAndUpdateReservation(
  args: FindAndUpdateReservationArgs
) {
  console.log(
    "✏️ find_and_update_reservation called with:",
    JSON.stringify(redactPII(args), null, 2)
  );

  try {
    // Recherche simple et directe par nom (case-insensitive)
    const { data: reservations, error: searchError } = await getSupabaseAdmin()
      .from("reservations")
      .select("*")
      .eq("restaurant_id", args.restaurant_id)
      .ilike("customer_name", `%${args.customer_name}%`)
      .in("status", ["pending", "confirmed"])
      .order("reservation_date", { ascending: true });

    if (searchError) {
      console.error("❌ Search error:", searchError);
      return {
        success: false,
        message: "ERREUR_TECHNIQUE: Impossible de rechercher la réservation.",
      };
    }

    console.log("🔍 Search for:", redactName(args.customer_name), "-> Found:", reservations?.length || 0, "reservations");

    // Pas de réservation trouvée = pas de réservation
    if (!reservations || reservations.length === 0) {
      console.log("⚠️ No reservation found for:", redactName(args.customer_name));
      return {
        success: false,
        reservation_found: false,
        message: `Je ne trouve pas de réservation au nom de ${args.customer_name}. Souhaitez-vous créer une nouvelle réservation ?`,
      };
    }

    // Si plusieurs réservations, demander précision
    if (reservations.length > 1) {
      const list = reservations.map((r) => {
        const date = new Date(r.reservation_date);
        const dateStr = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
        return `${dateStr} à ${r.reservation_time} pour ${r.number_of_guests} personne${r.number_of_guests > 1 ? "s" : ""}`;
      }).join("; ");

      return {
        success: false,
        needs_clarification: true,
        message: `J'ai trouvé plusieurs réservations au nom de ${args.customer_name}: ${list}. Laquelle souhaitez-vous modifier ?`,
      };
    }

    const reservation = reservations[0];

    // Format date for display
    const currentDateObj = new Date(reservation.reservation_date);
    const currentDateStr = currentDateObj.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    // If no modification params provided, return current reservation details for confirmation
    const hasModifications = args.new_date || args.new_time || args.new_number_of_guests;

    if (!hasModifications) {
      console.log("📋 No modification params - returning current reservation details");
      return {
        success: true,
        reservation_found: true,
        reservation_id: reservation.id,
        current_details: {
          date: reservation.reservation_date,
          time: reservation.reservation_time,
          number_of_guests: reservation.number_of_guests,
          customer_name: reservation.customer_name,
        },
        message: `J'ai votre réservation pour ${reservation.number_of_guests} personne${reservation.number_of_guests > 1 ? "s" : ""} le ${currentDateStr} à ${reservation.reservation_time}. Que souhaitez-vous modifier ?`,
      };
    }

    // Préparer les nouvelles valeurs
    const newDate = args.new_date || reservation.reservation_date;
    const newTime = args.new_time || reservation.reservation_time;
    const newGuests = args.new_number_of_guests || reservation.number_of_guests;

    // Vérifier la disponibilité si changement de date/heure/nombre
    const availabilityResult = await checkAvailability(getSupabaseAdmin(), {
      restaurantId: args.restaurant_id,
      date: newDate,
      time: newTime,
      numberOfGuests: newGuests,
    });

    if (!availabilityResult.available) {
      console.log("❌ New slot not available:", availabilityResult.reason);
      return {
        success: false,
        slot_unavailable: true,
        message: `Ce créneau est complet. Quel autre horaire souhaiteriez-vous ?`,
      };
    }

    // Mettre à jour la réservation avec transaction locking
    // Using a transaction-safe update approach
    const { data: updateData, error: updateError } = await getSupabaseAdmin()
      .from("reservations")
      .update({
        reservation_date: newDate,
        reservation_time: newTime,
        number_of_guests: newGuests,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation.id)
      .eq("status", reservation.status) // Optimistic locking - ensure status hasn't changed
      .select();

    if (updateError) {
      console.error("❌ Database update error:", updateError);
      return {
        success: false,
        message: `Erreur lors de la modification. Veuillez réessayer.`,
      };
    }

    if (!updateData || updateData.length === 0) {
      console.error("❌ Update returned no data - possible concurrent modification");
      return {
        success: false,
        message: `La réservation a été modifiée par quelqu'un d'autre. Veuillez réessayer.`,
      };
    }

    console.log("✅ Reservation updated successfully:", reservation.id);

    const newDateObj = new Date(newDate);
    const newDateStr = newDateObj.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    return {
      success: true,
      updated: true,
      message: `Votre réservation est modifiée pour ${newGuests} personne${newGuests > 1 ? "s" : ""} le ${newDateStr} à ${newTime}.`,
    };
  } catch (error) {
    console.error("❌ Error in find_and_update_reservation:", error);
    return {
      success: false,
      message: "ERREUR_TECHNIQUE: Une erreur est survenue lors de la modification.",
    };
  }
}

