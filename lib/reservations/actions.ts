"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReservationStatus } from "@/types";

export async function getReservations(filters?: {
  date?: string;
  status?: ReservationStatus;
  search?: string;
  needs_confirmation?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Récupérer le restaurant de l'utilisateur
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!restaurant) {
      return { data: [] };
    }

    // Construire la requête avec filtres
    let query = supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });

    // Appliquer les filtres
    if (filters?.date) {
      query = query.eq("reservation_date", filters.date);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.search) {
      query = query.or(
        `customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`
      );
    }

    // Filtre pour les réservations à confirmer
    if (filters?.needs_confirmation === "true") {
      query = query.eq("needs_confirmation", true);
    }

    const { data: reservations, error } = await query;

    if (error) {
      return { error: error.message };
    }

    return { data: reservations || [] };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Une erreur est survenue" };
  }
}

export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Vérifier que la réservation appartient au restaurant de l'utilisateur
    const { data: reservation } = await supabase
      .from("reservations")
      .select("restaurant_id")
      .eq("id", reservationId)
      .single();

    if (!reservation) {
      return { error: "Réservation non trouvée" };
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("id", reservation.restaurant_id)
      .eq("user_id", user.id)
      .single();

    if (!restaurant) {
      return { error: "Non autorisé" };
    }

    // Mettre à jour le statut
    const { error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("id", reservationId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard/reservations");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Une erreur est survenue" };
  }
}

/**
 * Confirme une réservation manuellement (retire le flag needs_confirmation)
 */
export async function confirmReservationManually(reservationId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Vérifier que la réservation appartient au restaurant de l'utilisateur
    const { data: reservation } = await supabase
      .from("reservations")
      .select("restaurant_id, status")
      .eq("id", reservationId)
      .single();

    if (!reservation) {
      return { error: "Réservation non trouvée" };
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("id", reservation.restaurant_id)
      .eq("user_id", user.id)
      .single();

    if (!restaurant) {
      return { error: "Non autorisé" };
    }

    // Confirmer la réservation
    const { error } = await supabase
      .from("reservations")
      .update({
        needs_confirmation: false,
        status: "confirmed",
        confidence_score: 1.0, // Score mis à 1.0 après confirmation manuelle
      })
      .eq("id", reservationId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard/reservations");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Une erreur est survenue" };
  }
}

/**
 * Met à jour une réservation
 */
export async function updateReservation(
  reservationId: string,
  data: {
    reservation_date?: string;
    reservation_time?: string;
    number_of_guests?: number;
    internal_notes?: string | null;
    special_requests?: string | null;
  }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Vérifier que la réservation appartient au restaurant de l'utilisateur
    const { data: reservation } = await supabase
      .from("reservations")
      .select("restaurant_id")
      .eq("id", reservationId)
      .single();

    if (!reservation) {
      return { error: "Réservation non trouvée" };
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("id", reservation.restaurant_id)
      .eq("user_id", user.id)
      .single();

    if (!restaurant) {
      return { error: "Non autorisé" };
    }

    // Mettre à jour la réservation
    const { data: updatedReservation, error } = await supabase
      .from("reservations")
      .update(data)
      .eq("id", reservationId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard/reservations");
    return { success: true, data: updatedReservation };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Une erreur est survenue" };
  }
}

export async function deleteReservation(reservationId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Vérifier que la réservation appartient au restaurant de l'utilisateur
    const { data: reservation } = await supabase
      .from("reservations")
      .select("restaurant_id")
      .eq("id", reservationId)
      .single();

    if (!reservation) {
      return { error: "Réservation non trouvée" };
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("id", reservation.restaurant_id)
      .eq("user_id", user.id)
      .single();

    if (!restaurant) {
      return { error: "Non autorisé" };
    }

    // Supprimer la réservation
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", reservationId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard/reservations");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Une erreur est survenue" };
  }
}

/**
 * Récupère le nombre de réservations à confirmer
 */
export async function getNeedsConfirmationCount() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { count: 0 };
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!restaurant) {
      return { count: 0 };
    }

    const { count, error } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", restaurant.id)
      .eq("needs_confirmation", true)
      .in("status", ["pending", "confirmed"]);

    if (error) {
      return { count: 0 };
    }

    return { count: count || 0 };
  } catch {
    return { count: 0 };
  }
}

/**
 * Récupère l'ID du restaurant de l'utilisateur courant
 */
export async function getRestaurantId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .single();

    return restaurant?.id || null;
  } catch {
    return null;
  }
}
