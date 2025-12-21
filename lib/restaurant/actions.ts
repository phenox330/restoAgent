"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { restaurantSchema, type RestaurantFormData } from "./schemas";

export async function createRestaurant(data: RestaurantFormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Valider les données
    const validated = restaurantSchema.parse(data);

    // Vérifier si l'utilisateur a déjà un restaurant
    const { data: existingRestaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingRestaurant) {
      return { error: "Vous avez déjà un restaurant configuré" };
    }

    // Créer le restaurant
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .insert({
        user_id: user.id,
        name: validated.name,
        email: validated.email || null,
        phone: validated.phone,
        address: validated.address || null,
        max_capacity: validated.max_capacity,
        default_reservation_duration: validated.default_reservation_duration,
        opening_hours: validated.opening_hours || {},
        closed_dates: validated.closed_dates || [],
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard/restaurant");
    return { success: true, data: restaurant };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Une erreur est survenue" };
  }
}

export async function updateRestaurant(restaurantId: string, data: RestaurantFormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Valider les données
    const validated = restaurantSchema.parse(data);

    // Vérifier que le restaurant appartient à l'utilisateur
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("id", restaurantId)
      .eq("user_id", user.id)
      .single();

    if (!restaurant) {
      return { error: "Restaurant non trouvé" };
    }

    // Mettre à jour le restaurant
    const { data: updated, error } = await supabase
      .from("restaurants")
      .update({
        name: validated.name,
        email: validated.email || null,
        phone: validated.phone,
        address: validated.address || null,
        max_capacity: validated.max_capacity,
        default_reservation_duration: validated.default_reservation_duration,
        opening_hours: validated.opening_hours || {},
        closed_dates: validated.closed_dates || [],
      })
      .eq("id", restaurantId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard/restaurant");
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Une erreur est survenue" };
  }
}

export async function getRestaurant() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null };
      }
      return { error: error.message };
    }

    return { data: restaurant };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Une erreur est survenue" };
  }
}
