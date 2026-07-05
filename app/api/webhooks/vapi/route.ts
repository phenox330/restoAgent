import { NextRequest, NextResponse } from "next/server";
import { handleToolCall } from "@/lib/vapi/tools";
import { withVapiWebhookVerification } from "@/lib/vapi/webhook-verification";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import {
  logTechnicalError,
  createGracefulErrorResponse,
  getErrorType,
} from "@/lib/error-logger";

/**
 * Wrapper to execute function with timeout protection
 * Vapi expects responses within 20 seconds
 *
 * ATTENTION : le timeout rejette mais N'ANNULE PAS la promesse — un INSERT
 * lent peut aboutir en arrière-plan après la réponse d'erreur. C'est la clé
 * d'idempotence de create_reservation_atomic (call + créneau) qui rend ce
 * scénario inoffensif : le retry renvoie la réservation déjà créée.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000 // 5s timeout for better UX (avoid long silences on call)
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Function execution timeout")), timeoutMs)
    ),
  ]);
}

interface VapiToolCall {
  id?: string;
  function?: {
    name?: string;
    arguments?: string | Record<string, unknown>;
    parameters?: Record<string, unknown>;
  };
}

interface ToolCallContext {
  baseRestaurantId: string | undefined;
  twilioPhone: string | undefined;
  callId: string | undefined;
  eventType: string;
}

/**
 * Exécute un tool call et renvoie son résultat associé à son toolCallId.
 *
 * Isolé du reste de la boucle pour que Vapi puisse envoyer plusieurs tool
 * calls dans un même message : chacun est traité indépendamment et une erreur
 * sur l'un n'empêche pas les autres de répondre. Ne rejette jamais — toute
 * erreur est convertie en réponse gracieuse pour le toolCallId concerné.
 */
async function executeToolCall(
  toolCall: VapiToolCall,
  ctx: ToolCallContext
): Promise<{ toolCallId: string | undefined; result: string }> {
  const toolCallId = toolCall.id;
  const functionName = toolCall.function?.name;

  try {
    if (!functionName) {
      return { toolCallId, result: "Erreur: nom de fonction manquant" };
    }

    // Les arguments peuvent être une string JSON ou déjà un objet
    let parameters: Record<string, unknown> | undefined;
    const rawArgs = toolCall.function?.arguments;
    if (rawArgs) {
      parameters =
        typeof rawArgs === "string"
          ? (JSON.parse(rawArgs) as Record<string, unknown>)
          : rawArgs;
    } else {
      parameters = toolCall.function?.parameters;
    }

    // restaurant_id : source de vérité résolue au niveau message, fallback sur
    // les paramètres du tool call (rétro-compat mono-resto).
    const restaurantId =
      ctx.baseRestaurantId ?? (parameters?.restaurant_id as string | undefined);

    // get_current_date n'a pas besoin de restaurant_id
    if (!restaurantId && functionName !== "get_current_date") {
      console.log("ERROR: restaurant_id manquant pour fonction:", functionName);
      return { toolCallId, result: "Erreur: restaurant_id manquant" };
    }

    const enrichedParams = {
      ...parameters,
      ...(restaurantId && { restaurant_id: restaurantId }),
      call_id: ctx.callId,
      // Injecter le numéro Twilio si disponible et non déjà fourni
      ...(!parameters?.customer_phone &&
        ctx.twilioPhone && { customer_phone: ctx.twilioPhone }),
    };

    console.log("handleToolCall:", functionName);

    let result;
    try {
      // Timeout protection — Vapi attend une réponse sous ~20s
      result = await withTimeout(handleToolCall(functionName, enrichedParams), 5000);
    } catch (functionError) {
      logTechnicalError({
        timestamp: new Date().toISOString(),
        error_type: getErrorType(functionError),
        error_message:
          functionError instanceof Error
            ? functionError.message
            : String(functionError),
        stack_trace:
          functionError instanceof Error ? functionError.stack : undefined,
        call_id: ctx.callId,
        function_name: functionName,
        parameters: enrichedParams,
        restaurant_id: restaurantId,
        context: {
          event_type: ctx.eventType,
          tool_call_id: toolCallId,
        },
      });

      // Réponse gracieuse : le SYSTEM_PROMPT demande à l'agent de capturer les
      // infos client pour un rappel.
      console.log("Réponse d'erreur gracieuse renvoyée pour:", functionName);
      return { toolCallId, result: createGracefulErrorResponse(functionName) };
    }

    // Pour get_current_date, renvoyer un objet structuré
    let finalResult: string;
    if (functionName === "get_current_date" && typeof result === "object") {
      const dateResult = result as {
        current_date?: string;
        current_time?: string;
        day_of_week?: string;
        message?: string;
      };
      finalResult = JSON.stringify({
        current_date: dateResult.current_date,
        current_time: dateResult.current_time,
        day_of_week: dateResult.day_of_week,
        message: dateResult.message,
      });
    } else if (result && typeof result === "object" && "message" in result && result.message) {
      finalResult = String(result.message);
    } else if (typeof result === "string") {
      finalResult = result;
    } else {
      finalResult = JSON.stringify(result);
    }

    return { toolCallId, result: finalResult };
  } catch (toolCallError) {
    // Ex. JSON.parse invalide : ne pas faire échouer les autres tool calls.
    console.error("Erreur lors du traitement du tool call:", functionName, toolCallError);
    return {
      toolCallId,
      result: createGracefulErrorResponse(functionName ?? ""),
    };
  }
}

export async function POST(request: NextRequest) {
  // Vérification de la signature webhook
  const verificationError = withVapiWebhookVerification(request);
  if (verificationError) {
    return verificationError;
  }

  try {
    const body = await request.json();

    console.log("Vapi webhook:", body.message?.type, "— call:", body.message?.call?.id);

    const message = body.message;

    // Gérer les différents types d'événements Vapi
    switch (message?.type) {
      // Appel de fonction (tool call) - nouveau format Vapi
      case "tool-calls":
      case "function-call": {
        try {
          // Support des deux formats (ancien et nouveau)
          const toolCalls = message.toolCalls || (message.functionCall ? [{ function: message.functionCall }] : []);

          if (!toolCalls || toolCalls.length === 0) {
            console.log("⚠️ No tool calls found in message");
            return NextResponse.json({ received: true });
          }

          // Résolution du restaurant (multi-tenant), une fois par message car
          // identique pour tous les tool calls :
          // 1. Lookup DB par phoneNumberId du numéro Vapi appelé = source de vérité
          // 2. Fallback metadata de l'assistant/call (rétro-compat mono-resto)
          let baseRestaurantId: string | undefined =
            message.assistant?.metadata?.restaurant_id ||
            message.call?.metadata?.restaurant_id ||
            body?.assistant?.metadata?.restaurant_id ||
            body?.call?.metadata?.restaurant_id;

          const phoneNumberId =
            message.call?.phoneNumberId || body?.call?.phoneNumberId;

          if (phoneNumberId) {
            const { data: mappedRestaurant } = await getSupabaseAdmin()
              .from("restaurants")
              .select("id")
              .eq("vapi_phone_number_id", phoneNumberId)
              .maybeSingle();

            if (mappedRestaurant?.id) {
              baseRestaurantId = mappedRestaurant.id;
            }
          }

          console.log("🔍 RESTAURANT_ID résolu:", baseRestaurantId, "(phoneNumberId:", phoneNumberId, ")");

          const ctx: ToolCallContext = {
            baseRestaurantId,
            twilioPhone: message.call?.customer?.number,
            callId: message.call?.id,
            eventType: message.type,
          };

          // Traiter TOUS les tool calls et renvoyer un résultat par toolCallId.
          // Vapi peut en envoyer plusieurs dans un même message ; n'en traiter
          // qu'un seul laissait les autres sans réponse et bloquait l'appel.
          // Exécution en parallèle : la capacité est sérialisée en base par
          // create_reservation_atomic (verrou), donc aucun risque de course.
          const results = await Promise.all(
            (toolCalls as VapiToolCall[]).map((toolCall) =>
              executeToolCall(toolCall, ctx)
            )
          );

          return NextResponse.json({ results });
        } catch (toolCallError) {
          console.error("=== ERROR in tool-calls handler ===");
          console.error("Error:", toolCallError);
          console.error("Stack:", toolCallError instanceof Error ? toolCallError.stack : "N/A");

          return NextResponse.json(
            {
              error: "Tool call error",
              details: toolCallError instanceof Error ? toolCallError.message : "Unknown error",
            },
            { status: 500 }
          );
        }
      }

      // Début d'appel
      case "call-started":
      case "status-update": {
        // Pour status-update, ignorer ceux qui ne sont pas "in-progress" ou au début
        if (
          message.type === "status-update" &&
          message.status !== "in-progress" &&
          message.status !== "queued"
        ) {
          return NextResponse.json({ received: true });
        }

        // Sans vapi_call_id on ne peut pas dédupliquer : ne rien insérer
        // (l'unicité de calls.vapi_call_id ignore les NULL).
        if (!message.call?.id) {
          console.error("❌ VAPI_CALL_ID MANQUANT - Appel non enregistré");
          return NextResponse.json({ received: true, warning: "call id missing" });
        }

        console.log("Call started:", message.call.id, "— type:", message.type);

        // Récupérer le restaurant_id (depuis call metadata OU assistant metadata)
        const restaurantId =
          message.call?.metadata?.restaurant_id ||
          message.assistant?.metadata?.restaurant_id;

        if (!restaurantId) {
          console.error("❌ RESTAURANT_ID MANQUANT - Appel non enregistré");
          console.error("Pour que les appels soient enregistrés, configurez restaurant_id dans les metadata de l'assistant Vapi");
          return NextResponse.json({ received: true, warning: "restaurant_id missing" });
        }

        // Upsert idempotent sur la contrainte UNIQUE(vapi_call_id) : un retry
        // webhook ou des événements concurrents (call-started + status-update)
        // ne créent plus de ligne dupliquée, sans check-then-insert racé.
        const { error } = await getSupabaseAdmin().from("calls").upsert(
          {
            vapi_call_id: message.call.id,
            restaurant_id: restaurantId,
            phone_number: message.call?.customer?.number || null,
            status: "in_progress",
            vapi_metadata: message.call || {},
          },
          { onConflict: "vapi_call_id", ignoreDuplicates: true }
        );

        if (error) {
          console.error("❌ Error creating call record:", error);
        } else {
          console.log("✅ Call record upserted successfully");
        }

        return NextResponse.json({ received: true });
      }

      // Fin d'appel
      case "call-ended":
      case "end-of-call-report": {
        console.log("Call ended:", message.call?.id);

        // Mettre à jour l'enregistrement de l'appel
        const { error } = await getSupabaseAdmin()
          .from("calls")
          // @ts-ignore - Type issue with Supabase generated types
          .update({
            status: "completed",
            ended_at: new Date().toISOString(),
            duration: message.call?.endedAt
              ? Math.floor(
                  (new Date(message.call.endedAt).getTime() -
                    new Date(message.call.startedAt).getTime()) /
                    1000
                )
              : null,
            transcript: message.transcript || null,
            summary: message.summary || null,
            vapi_metadata: message.call || {},
          })
          .eq("vapi_call_id", message.call?.id);

        if (error) {
          console.error("Error updating call record:", error);
        }

        return NextResponse.json({ received: true });
      }

      // Transcription en temps réel
      case "transcript": {
        // Non loggé : le transcript contient des données personnelles (RGPD)
        return NextResponse.json({ received: true });
      }

      default: {
        console.log("Unhandled event type:", message?.type);
        return NextResponse.json({ received: true });
      }
    }
  } catch (error) {
    console.error("========================================");
    console.error("❌ WEBHOOK ERROR:", error);
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "N/A");

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
