// @ts-nocheck
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Supabase = SupabaseClient<Database>;

interface CheckAvailabilityParams {
  restaurantId: string;
  date: string; // Format: YYYY-MM-DD
  time: string; // Format: HH:mm
  numberOfGuests: number;
}

export async function checkAvailability(
  supabase: Supabase,
  params: CheckAvailabilityParams
) {
  try {
    // Récupérer le restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", params.restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return {
        available: false,
        reason: "Restaurant non trouvé",
      };
    }

    // Vérifier que la date n'est pas fermée
    // @ts-ignore - Type issue with Supabase generated types
    const closedDates = (restaurant.closed_dates as string[]) || [];
    if (closedDates.includes(params.date)) {
      return {
        available: false,
        reason: "Le restaurant est fermé ce jour-là",
      };
    }

    // Vérifier les horaires d'ouverture
    const dayOfWeek = new Date(params.date)
      .toLocaleDateString("en-US", {
        weekday: "long",
      })
      // @ts-ignore - Type issue with Supabase generated types
      .toLowerCase() as keyof typeof restaurant.opening_hours;

    // @ts-ignore - Type issue with Supabase generated types
    const openingHours = restaurant.opening_hours as any;
    const daySchedule = openingHours?.[dayOfWeek];

    if (!daySchedule) {
      return {
        available: false,
        reason: "Le restaurant est fermé ce jour-là",
      };
    }

    // Vérifier si l'heure demandée correspond à un service (lunch ou dinner)
    const [hours, minutes] = params.time.split(":").map(Number);
    const requestedMinutes = hours * 60 + minutes;

    let isInServiceHours = false;

    if (daySchedule.lunch) {
      const [lunchStartH, lunchStartM] = daySchedule.lunch.start.split(":").map(Number);
      const [lunchEndH, lunchEndM] = daySchedule.lunch.end.split(":").map(Number);
      const lunchStart = lunchStartH * 60 + lunchStartM;
      const lunchEnd = lunchEndH * 60 + lunchEndM;

      if (requestedMinutes >= lunchStart && requestedMinutes < lunchEnd) {
        isInServiceHours = true;
      }
    }

    if (daySchedule.dinner) {
      const [dinnerStartH, dinnerStartM] = daySchedule.dinner.start.split(":").map(Number);
      const [dinnerEndH, dinnerEndM] = daySchedule.dinner.end.split(":").map(Number);
      const dinnerStart = dinnerStartH * 60 + dinnerStartM;
      const dinnerEnd = dinnerEndH * 60 + dinnerEndM;

      if (requestedMinutes >= dinnerStart && requestedMinutes < dinnerEnd) {
        isInServiceHours = true;
      }
    }

    if (!isInServiceHours) {
      return {
        available: false,
        reason: "Le restaurant n'est pas ouvert à cette heure",
      };
    }

    // Compter les réservations existantes pour ce créneau
    const { data: existingReservations } = await supabase
      .from("reservations")
      .select("number_of_guests")
      .eq("restaurant_id", params.restaurantId)
      .eq("reservation_date", params.date)
      .in("status", ["pending", "confirmed"]);

    const totalGuests = (existingReservations || []).reduce(
      (sum, r) => sum + r.number_of_guests,
      0
    );

    // @ts-ignore - Type issue with Supabase generated types
    const availableCapacity = restaurant.max_capacity - totalGuests;

    if (availableCapacity < params.numberOfGuests) {
      return {
        available: false,
        reason: `Capacité insuffisante. Places disponibles: ${availableCapacity}`,
      };
    }

    return {
      available: true,
      availableCapacity,
    };
  } catch (error) {
    console.error("Error checking availability:", error);
    return {
      available: false,
      reason: "Erreur lors de la vérification des disponibilités",
    };
  }
}
