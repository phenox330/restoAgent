// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { sendCancellationConfirmationSMS } from "@/lib/sms/twilio";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/cancel/[token]
 * Récupère les informations de la réservation pour affichage
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    // Rechercher la réservation par token d'annulation
    const { data: reservation, error } = await getSupabaseAdmin()
      .from("reservations")
      .select(`
        id,
        customer_name,
        customer_phone,
        reservation_date,
        reservation_time,
        number_of_guests,
        status,
        restaurant_id,
        restaurants (
          name
        )
      `)
      .eq("cancellation_token", token)
      .single();

    if (error || !reservation) {
      console.log("Reservation not found for token:", token);
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Formater la réponse
    const responseData = {
      reservation: {
        id: reservation.id,
        customer_name: reservation.customer_name,
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time,
        number_of_guests: reservation.number_of_guests,
        status: reservation.status,
        restaurant_name: (reservation.restaurants as any)?.name || "Restaurant",
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cancel/[token]
 * Annule la réservation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    // Rechercher la réservation par token
    const { data: reservation, error: fetchError } = await getSupabaseAdmin()
      .from("reservations")
      .select(`
        id,
        customer_name,
        customer_phone,
        reservation_date,
        reservation_time,
        number_of_guests,
        status,
        restaurant_id,
        restaurants (
          name,
          sms_enabled
        )
      `)
      .eq("cancellation_token", token)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier si déjà annulée
    if (reservation.status === "cancelled") {
      return NextResponse.json(
        { error: "Cette réservation est déjà annulée" },
        { status: 400 }
      );
    }

    // Vérifier si la date n'est pas passée
    const reservationDate = new Date(reservation.reservation_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      return NextResponse.json(
        { error: "Impossible d'annuler une réservation passée" },
        { status: 400 }
      );
    }

    // Annuler la réservation
    const { error: updateError } = await getSupabaseAdmin()
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", reservation.id);

    if (updateError) {
      console.error("Error cancelling reservation:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de l'annulation" },
        { status: 500 }
      );
    }

    console.log("✅ Reservation cancelled via self-service:", reservation.id);

    // Envoyer SMS de confirmation d'annulation si activé
    const restaurant = reservation.restaurants as any;
    if (restaurant?.sms_enabled) {
      try {
        await sendCancellationConfirmationSMS({
          phone: reservation.customer_phone,
          restaurantName: restaurant.name,
          date: reservation.reservation_date,
          time: reservation.reservation_time,
        });
      } catch (smsError) {
        console.error("Error sending cancellation SMS:", smsError);
        // Ne pas bloquer si le SMS échoue
      }
    }

    return NextResponse.json({
      success: true,
      message: "Réservation annulée avec succès",
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
