/**
 * Module d'envoi de SMS via Twilio
 * Gère les confirmations de réservation et liens d'annulation
 */

import { formatDateFr } from "@/lib/utils/date-fr";
import { formatPhoneE164 } from "@/lib/utils/phone";
import { redactPhone } from "@/lib/logger";

interface SMSConfirmationParams {
  phone: string;
  customerName: string;
  restaurantName: string;
  date: string;
  time: string;
  guests: number;
  cancellationToken: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// formatPhoneE164 et formatDateFr sont maintenant importés depuis lib/utils

/**
 * Envoie un SMS de confirmation de réservation
 */
export async function sendConfirmationSMS(
  params: SMSConfirmationParams
): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://restoagent.app";

  // Vérifier la configuration Twilio
  if (!accountSid || !authToken || !fromNumber) {
    console.warn("⚠️ Twilio non configuré - SMS non envoyé");
    console.warn(
      "   Pour activer les SMS, configurez TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER"
    );
    return {
      success: false,
      error: "Twilio non configuré",
    };
  }

  try {
    // Formater le numéro de téléphone
    const toNumber = formatPhoneE164(params.phone);

    // Générer le lien d'annulation
    const cancellationLink = `${appUrl}/cancel/${params.cancellationToken}`;

    // Formater la date
    const formattedDate = formatDateFr(params.date, true); // Format court pour SMS

    // Construire le message SMS (limité à 160 caractères pour éviter les SMS multiples)
    const message =
      `${params.restaurantName}: Réservation confirmée!\n` +
      `${formattedDate} à ${params.time}\n` +
      `${params.guests} pers.\n` +
      `Annuler: ${cancellationLink}`;

    console.log("📱 Sending SMS to:", redactPhone(toNumber));
    // Ne pas logger le corps du message : il contient le nom du client et le
    // lien d'annulation (token). Seule la longueur est utile au debug.
    console.log("📱 Message length:", message.length);

    // Utiliser l'API Twilio REST directement (sans dépendance npm)
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: toNumber,
        Body: message,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Twilio API error:", errorData);
      return {
        success: false,
        error: errorData.message || "Erreur lors de l'envoi du SMS",
      };
    }

    const data = await response.json();
    console.log("✅ SMS sent successfully:", data.sid);

    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error) {
    console.error("❌ Error sending SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Envoie un SMS de rappel (24h avant la réservation)
 */
export async function sendReminderSMS(params: {
  phone: string;
  customerName: string;
  restaurantName: string;
  date: string;
  time: string;
  guests: number;
}): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: "Twilio non configuré",
    };
  }

  try {
    const toNumber = formatPhoneE164(params.phone);
    const formattedDate = formatDateFr(params.date, true); // Format court pour SMS

    const message =
      `Rappel ${params.restaurantName}\n` +
      `Réservation demain ${formattedDate} à ${params.time}\n` +
      `${params.guests} personnes\n` +
      `À bientôt!`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: toNumber,
        Body: message,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Erreur lors de l'envoi du rappel SMS",
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error) {
    console.error("❌ Error sending reminder SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Envoie un SMS d'annulation confirmée
 */
export async function sendCancellationConfirmationSMS(params: {
  phone: string;
  restaurantName: string;
  date: string;
  time: string;
}): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: "Twilio non configuré",
    };
  }

  try {
    const toNumber = formatPhoneE164(params.phone);
    const formattedDate = formatDateFr(params.date, true); // Format court pour SMS

    const message =
      `${params.restaurantName}\n` +
      `Votre réservation du ${formattedDate} à ${params.time} a été annulée.\n` +
      `À bientôt!`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: toNumber,
        Body: message,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Erreur lors de l'envoi du SMS",
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error) {
    console.error("❌ Error sending cancellation SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
