import type { Database } from "@/types/database";
import type { TransferReason } from "../transfer";

export type ReservationRow = Database["public"]["Tables"]["reservations"]["Row"];
export type ReservationInsert = Database["public"]["Tables"]["reservations"]["Insert"];

// Ligne renvoyée par le RPC fuzzy_search_reservations (colonnes réservation + score)
export interface FuzzyReservationMatch {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  reservation_date: string;
  reservation_time: string;
  number_of_guests: number;
  status: string;
  similarity_score: number;
}

export interface CheckAvailabilityArgs {
  restaurant_id: string;
  date: string;
  time: string;
  number_of_guests: number;
}

export interface CreateReservationArgs {
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

export interface CancelReservationArgs {
  restaurant_id: string;
  reservation_id: string;
}

export interface FindAndCancelReservationArgs {
  restaurant_id: string;
  customer_name?: string; // Optionnel - peut chercher uniquement par téléphone
  customer_phone?: string;
}

export interface FindReservationForCancellationArgs {
  restaurant_id: string;
  customer_name?: string; // Optionnel - pour recherche par nom si confirmation échoue
  customer_phone?: string; // Auto-injecté depuis l'appel
}

export interface FindAndUpdateReservationArgs {
  restaurant_id: string;
  customer_name: string;
  customer_phone?: string;
  new_date?: string;
  new_time?: string;
  new_number_of_guests?: number;
}

export interface GetRestaurantInfoArgs {
  restaurant_id: string;
}

export interface AddToWaitlistArgs {
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

export interface TransferCallArgs {
  restaurant_id: string;
  reason: TransferReason;
  call_id?: string;
  guest_count?: number;
  failed_attempts?: number;
}


export interface CreateTechnicalErrorRequestArgs {
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  call_id?: string;
}

