// @ts-nocheck
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Supabase = SupabaseClient<Database>;

// Heure de coupure entre service midi et soir (15h00)
const LUNCH_CUTOFF_HOUR = 15;

interface CheckAvailabilityParams {
  restaurantId: string;
  date: string; // Format: YYYY-MM-DD
  time: string; // Format: HH:mm
  numberOfGuests: number;
}

interface AvailabilityResult {
  available: boolean;
  reason?: string;
  availableCapacity?: number;
  serviceType?: "lunch" | "dinner";
  alternatives?: AlternativeSlot[];
}

interface AlternativeSlot {
  date: string;
  serviceType: "lunch" | "dinner";
  availableCapacity: number;
}

/**
 * Détermine le type de service (midi/soir) selon l'heure
 */
export function getServiceType(time: string): "lunch" | "dinner" {
  const [hours] = time.split(":").map(Number);
  return hours < LUNCH_CUTOFF_HOUR ? "lunch" : "dinner";
}

/**
 * Vérifie la disponibilité pour une réservation
 * Utilise la capacité par service (midi/soir) au lieu de la capacité globale
 */
export async function checkAvailability(
  supabase: Supabase,
  params: CheckAvailabilityParams
): Promise<AvailabilityResult> {
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
      .toLowerCase() as keyof typeof restaurant.opening_hours;

    const openingHours = restaurant.opening_hours as any;
    const daySchedule = openingHours?.[dayOfWeek];

    if (!daySchedule) {
      return {
        available: false,
        reason: "Le restaurant est fermé ce jour-là",
      };
    }

    // Déterminer le type de service (midi ou soir)
    const serviceType = getServiceType(params.time);
    const [hours, minutes] = params.time.split(":").map(Number);
    const requestedMinutes = hours * 60 + minutes;

    // Vérifier si l'heure demandée correspond au service
    let isInServiceHours = false;
    const serviceSchedule = daySchedule[serviceType];

    if (serviceSchedule) {
      const [startH, startM] = serviceSchedule.start.split(":").map(Number);
      const [endH, endM] = serviceSchedule.end.split(":").map(Number);
      const serviceStart = startH * 60 + startM;
      const serviceEnd = endH * 60 + endM;

      if (requestedMinutes >= serviceStart && requestedMinutes < serviceEnd) {
        isInServiceHours = true;
      }
    }

    if (!isInServiceHours) {
      // Vérifier si l'autre service est disponible
      const otherService = serviceType === "lunch" ? "dinner" : "lunch";
      const otherSchedule = daySchedule[otherService];

      if (otherSchedule) {
        const [startH, startM] = otherSchedule.start.split(":").map(Number);
        const [endH, endM] = otherSchedule.end.split(":").map(Number);
        const otherStart = startH * 60 + startM;
        const otherEnd = endH * 60 + endM;

        if (requestedMinutes >= otherStart && requestedMinutes < otherEnd) {
          // L'heure correspond à l'autre service, mettre à jour le serviceType
          isInServiceHours = true;
        }
      }

      if (!isInServiceHours) {
        return {
          available: false,
          reason: "Le restaurant n'est pas ouvert à cette heure",
        };
      }
    }

    // Récupérer la capacité du service approprié
    const maxCapacity =
      serviceType === "lunch"
        ? restaurant.max_capacity_lunch
        : restaurant.max_capacity_dinner;

    // Compter les réservations existantes pour ce SERVICE (pas la journée entière)
    const { data: existingReservations } = await supabase
      .from("reservations")
      .select("number_of_guests, reservation_time")
      .eq("restaurant_id", params.restaurantId)
      .eq("reservation_date", params.date)
      .in("status", ["pending", "confirmed"]);

    // Filtrer pour ne garder que les réservations du même service
    const serviceReservations = (existingReservations || []).filter((r) => {
      const resServiceType = getServiceType(r.reservation_time);
      return resServiceType === serviceType;
    });

    const totalGuests = serviceReservations.reduce(
      (sum, r) => sum + r.number_of_guests,
      0
    );

    const availableCapacity = maxCapacity - totalGuests;

    if (availableCapacity < params.numberOfGuests) {
      // Chercher des alternatives si complet
      const alternatives = await findAlternatives(supabase, {
        restaurantId: params.restaurantId,
        date: params.date,
        numberOfGuests: params.numberOfGuests,
        daysAhead: 3,
      });

      return {
        available: false,
        reason: `Capacité insuffisante pour le service du ${
          serviceType === "lunch" ? "midi" : "soir"
        }. Places disponibles: ${Math.max(0, availableCapacity)}`,
        serviceType,
        availableCapacity: Math.max(0, availableCapacity),
        alternatives,
      };
    }

    return {
      available: true,
      availableCapacity,
      serviceType,
    };
  } catch (error) {
    console.error("Error checking availability:", error);
    return {
      available: false,
      reason: "Erreur lors de la vérification des disponibilités",
    };
  }
}

/**
 * Trouve des créneaux alternatifs quand le créneau demandé est complet
 */
async function findAlternatives(
  supabase: Supabase,
  params: {
    restaurantId: string;
    date: string;
    numberOfGuests: number;
    daysAhead: number;
  }
): Promise<AlternativeSlot[]> {
  try {
    const alternatives: AlternativeSlot[] = [];
    const startDate = new Date(params.date);

    // Récupérer le restaurant
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("max_capacity_lunch, max_capacity_dinner, opening_hours")
      .eq("id", params.restaurantId)
      .single();

    if (!restaurant) return [];

    // Parcourir les jours à venir
    for (let i = 0; i <= params.daysAhead; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split("T")[0];

      // Vérifier le jour de la semaine
      const dayOfWeek = checkDate
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();
      const openingHours = restaurant.opening_hours as any;
      const daySchedule = openingHours?.[dayOfWeek];

      if (!daySchedule) continue;

      // Vérifier chaque service
      for (const serviceType of ["lunch", "dinner"] as const) {
        if (!daySchedule[serviceType]) continue;

        const maxCapacity =
          serviceType === "lunch"
            ? restaurant.max_capacity_lunch
            : restaurant.max_capacity_dinner;

        // Compter les réservations existantes pour ce service
        const { data: existingReservations } = await supabase
          .from("reservations")
          .select("number_of_guests, reservation_time")
          .eq("restaurant_id", params.restaurantId)
          .eq("reservation_date", dateStr)
          .in("status", ["pending", "confirmed"]);

        const serviceReservations = (existingReservations || []).filter((r) => {
          const resServiceType = getServiceType(r.reservation_time);
          return resServiceType === serviceType;
        });

        const totalGuests = serviceReservations.reduce(
          (sum, r) => sum + r.number_of_guests,
          0
        );

        const availableCapacity = maxCapacity - totalGuests;

        if (availableCapacity >= params.numberOfGuests) {
          alternatives.push({
            date: dateStr,
            serviceType,
            availableCapacity,
          });
        }
      }
    }

    // Limiter à 5 alternatives
    return alternatives.slice(0, 5);
  } catch (error) {
    console.error("Error finding alternatives:", error);
    return [];
  }
}

/**
 * Vérifie si un doublon existe (même téléphone + même date)
 */
export async function checkDuplicateReservation(
  supabase: Supabase,
  params: {
    restaurantId: string;
    customerPhone: string;
    date: string;
  }
): Promise<{
  hasDuplicate: boolean;
  existingReservation?: {
    id: string;
    customer_name: string;
    reservation_time: string;
    number_of_guests: number;
  };
}> {
  try {
    const { data: existing } = await supabase
      .from("reservations")
      .select("id, customer_name, reservation_time, number_of_guests")
      .eq("restaurant_id", params.restaurantId)
      .eq("customer_phone", params.customerPhone)
      .eq("reservation_date", params.date)
      .in("status", ["pending", "confirmed"])
      .limit(1)
      .single();

    if (existing) {
      return {
        hasDuplicate: true,
        existingReservation: existing,
      };
    }

    return { hasDuplicate: false };
  } catch (error) {
    // Si pas de résultat, ce n'est pas une erreur
    return { hasDuplicate: false };
  }
}
