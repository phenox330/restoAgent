import { NextRequest, NextResponse } from "next/server";

/**
 * Vérifie la signature du webhook Vapi
 * Le header x-vapi-secret doit correspondre à VAPI_WEBHOOK_SECRET
 */
export function verifyVapiWebhookSignature(request: NextRequest): {
  valid: boolean;
  error?: NextResponse;
} {
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;

  // Si pas de secret configuré, logger un warning mais accepter (dev mode)
  if (!webhookSecret) {
    console.warn(
      "⚠️ VAPI_WEBHOOK_SECRET non configuré - Validation de signature désactivée"
    );
    console.warn(
      "   Pour sécuriser le webhook, ajoutez VAPI_WEBHOOK_SECRET dans .env.local"
    );
    return { valid: true };
  }

  // Récupérer le secret du header
  const requestSecret = request.headers.get("x-vapi-secret");

  // Vérifier si le header est présent
  if (!requestSecret) {
    console.error("❌ Webhook signature manquante - Header x-vapi-secret absent");
    return {
      valid: false,
      error: NextResponse.json(
        { error: "Unauthorized", message: "Missing webhook signature" },
        { status: 401 }
      ),
    };
  }

  // Comparer les secrets (timing-safe comparison serait mieux mais ok pour ce cas)
  if (requestSecret !== webhookSecret) {
    console.error("❌ Webhook signature invalide - Le secret ne correspond pas");
    console.error("   Received:", requestSecret.substring(0, 8) + "...");
    console.error("   Expected:", webhookSecret.substring(0, 8) + "...");
    return {
      valid: false,
      error: NextResponse.json(
        { error: "Unauthorized", message: "Invalid webhook signature" },
        { status: 401 }
      ),
    };
  }

  console.log("✅ Webhook signature valide");
  return { valid: true };
}

/**
 * Middleware pour vérifier la signature du webhook Vapi
 * Retourne null si valide, ou une NextResponse avec erreur 401
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
