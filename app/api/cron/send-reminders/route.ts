// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { sendReminderSMS } from "@/lib/sms/twilio";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

/**
 * GET /api/cron/send-reminders
 * 
 * Cron job pour envoyer les SMS de rappel 24h avant les réservations.
 * Appelé quotidiennement par Vercel Cron à 9h UTC.
 * 
 * Sécurité: Vérifie le header Authorization de Vercel Cron
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // En développement, permettre l'accès sans auth
      if (process.env.NODE_ENV === "production") {
        console.log("❌ Unauthorized cron request");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    console.log("🔔 Starting reminder SMS cron job...");

    // Calculer la date de demain (pour les réservations à rappeler)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0]; // Format YYYY-MM-DD

    console.log(`📅 Looking for reservations on: ${tomorrowStr}`);

    // Récupérer les réservations confirmées pour demain
    // qui n'ont pas encore reçu de rappel
    const { data: reservations, error: fetchError } = await getSupabaseAdmin()
      .from("reservations")
      .select(`
        id,
        customer_name,
        customer_phone,
        reservation_date,
        reservation_time,
        number_of_guests,
        reminder_sent_at,
        restaurant_id,
        restaurants (
          name,
          sms_enabled
        )
      `)
      .eq("reservation_date", tomorrowStr)
      .eq("status", "confirmed")
      .is("reminder_sent_at", null);

    if (fetchError) {
      console.error("❌ Error fetching reservations:", fetchError);
      return NextResponse.json(
        { error: "Database error", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!reservations || reservations.length === 0) {
      console.log("ℹ️ No reservations to remind for tomorrow");
      return NextResponse.json({
        success: true,
        message: "No reservations to remind",
        sent: 0,
        failed: 0,
      });
    }

    console.log(`📋 Found ${reservations.length} reservations to remind`);

    let sent = 0;
    let failed = 0;
    const results: { id: string; success: boolean; error?: string }[] = [];

    // Envoyer les rappels un par un
    for (const reservation of reservations) {
      const restaurant = reservation.restaurants as { name: string; sms_enabled: boolean } | null;

      // Vérifier que le restaurant a activé les SMS
      if (!restaurant?.sms_enabled) {
        console.log(`⏭️ Skipping ${reservation.id} - SMS disabled for restaurant`);
        results.push({ id: reservation.id, success: false, error: "SMS disabled" });
        continue;
      }

      try {
        console.log(`📱 Sending reminder to ${reservation.customer_phone} for reservation ${reservation.id}`);

        const smsResult = await sendReminderSMS({
          phone: reservation.customer_phone,
          customerName: reservation.customer_name,
          restaurantName: restaurant.name,
          date: reservation.reservation_date,
          time: reservation.reservation_time,
          guests: reservation.number_of_guests,
        });

        if (smsResult.success) {
          // Mettre à jour reminder_sent_at
          const { error: updateError } = await getSupabaseAdmin()
            .from("reservations")
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("id", reservation.id);

          if (updateError) {
            console.error(`⚠️ SMS sent but failed to update reminder_sent_at for ${reservation.id}:`, updateError);
          }

          sent++;
          results.push({ id: reservation.id, success: true });
          console.log(`✅ Reminder sent for reservation ${reservation.id}`);
        } else {
          failed++;
          results.push({ id: reservation.id, success: false, error: smsResult.error });
          console.error(`❌ Failed to send reminder for ${reservation.id}:`, smsResult.error);
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.push({ id: reservation.id, success: false, error: errorMessage });
        console.error(`❌ Error sending reminder for ${reservation.id}:`, error);
      }
    }

    console.log(`✅ Reminder cron job completed: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Reminder cron completed`,
      sent,
      failed,
      total: reservations.length,
      results,
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Désactiver le cache pour ce endpoint
export const dynamic = "force-dynamic";
export const revalidate = 0;



