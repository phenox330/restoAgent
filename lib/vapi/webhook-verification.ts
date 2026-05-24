import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Vérifie la signature du webhook Vapi.
 * Vapi envoie le header `x-vapi-secret` (valeur = server.secret configuré sur l'assistant)
 * qui doit correspondre à VAPI_WEBHOOK_SECRET.
 *
 * Politique :
 * - Secret configuré → comparaison timing-safe obligatoire
 * - Secret absent en production → rejet (fail-closed)
 * - Secret absent en dev → warning + accepté (faciliter le test local)
 */
export function verifyVapiWebhookSignature(request: NextRequest): {
  valid: boolean;
  error?: NextResponse;
} {
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;

  if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "❌ VAPI_WEBHOOK_SECRET non configuré en production — webhook rejeté"
      );
      return {
        valid: false,
        error: NextResponse.json(
          { error: "Server misconfiguration" },
          { status: 500 }
        ),
      };
    }
    console.warn(
      "⚠️ VAPI_WEBHOOK_SECRET non configuré (dev) — vérification de signature désactivée"
    );
    return { valid: true };
  }

  const requestSecret = request.headers.get("x-vapi-secret");

  if (!requestSecret) {
    console.error("❌ Webhook rejeté — header x-vapi-secret absent");
    return {
      valid: false,
      error: NextResponse.json(
        { error: "Unauthorized", message: "Missing webhook signature" },
        { status: 401 }
      ),
    };
  }

  const received = Buffer.from(requestSecret);
  const expected = Buffer.from(webhookSecret);

  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    console.error("❌ Webhook rejeté — signature invalide");
    return {
      valid: false,
      error: NextResponse.json(
        { error: "Unauthorized", message: "Invalid webhook signature" },
        { status: 401 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Middleware pour vérifier la signature du webhook Vapi.
 * Retourne null si valide, ou une NextResponse avec erreur sinon.
 */
export function withVapiWebhookVerification(
  request: NextRequest
): NextResponse | null {
  const verification = verifyVapiWebhookSignature(request);

  if (!verification.valid && verification.error) {
    return verification.error;
  }

  return null;
}
