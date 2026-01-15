// @ts-nocheck
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
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 18000 // 18s to stay under 20s Vapi limit
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Function execution timeout")), timeoutMs)
    ),
  ]);
}

export async function POST(request: NextRequest) {
  // Log TOUT dès le début
  console.log("========================================");
  console.log("📞 WEBHOOK CALLED AT:", new Date().toISOString());
  console.log("URL:", request.url);
  console.log("Method:", request.method);
  console.log("Headers:", Object.fromEntries(request.headers.entries()));

  // Vérification de la signature webhook
  const verificationError = withVapiWebhookVerification(request);
  if (verificationError) {
    return verificationError;
  }

  try {
    const body = await request.json();

    console.log("✅ Body parsed successfully");
    console.log("Vapi webhook received:", {
      type: body.message?.type,
      callId: body.message?.call?.id,
      fullBody: JSON.stringify(body, null, 2),
    });

    const message = body.message;

    // Gérer les différents types d'événements Vapi
    switch (message?.type) {
      // Appel de fonction (tool call) - nouveau format Vapi
      case "tool-calls":
      case "function-call": {
        try {
          console.log("🔥🔥🔥 TOOL-CALLS REÇU 🔥🔥🔥");
          console.log("=== TOOL-CALLS START ===");
          console.log("Raw tool-calls message:", JSON.stringify(message, null, 2));
          console.log("🔍 DEBUG - Cherche restaurant_id dans:");
          console.log("  - message.assistant:", JSON.stringify(message.assistant, null, 2));
          console.log("  - message.call:", JSON.stringify(message.call, null, 2));
          console.log("  - body.assistant:", JSON.stringify(body.assistant, null, 2));
          console.log("  - body.call:", JSON.stringify(body.call, null, 2));

          // Support des deux formats (ancien et nouveau)
          const toolCalls = message.toolCalls || (message.functionCall ? [{ function: message.functionCall }] : []);

          if (!toolCalls || toolCalls.length === 0) {
            console.log("⚠️ No tool calls found in message");
            return NextResponse.json({ received: true });
          }

          // Gérer le premier tool call (pour l'instant)
          const toolCall = toolCalls[0];
          console.log("Tool call object:", JSON.stringify(toolCall, null, 2));

          const functionName = toolCall.function?.name;
          console.log("Function name:", functionName);

          let parameters;

          try {
            // Les arguments peuvent être soit une string JSON, soit déjà un objet
            const args = toolCall.function?.arguments;
            if (args) {
              if (typeof args === 'string') {
                parameters = JSON.parse(args);
              } else {
                parameters = args; // Déjà un objet
              }
            } else {
              parameters = toolCall.function?.parameters;
            }
            console.log("Parsed parameters:", JSON.stringify(parameters, null, 2));
          } catch (parseError) {
            console.error("ERROR parsing arguments:", parseError);
            console.log("Raw arguments:", toolCall.function?.arguments);
            console.log("Type of arguments:", typeof toolCall.function?.arguments);
            throw parseError;
          }

          // Extraire le restaurant_id depuis les paramètres, la metadata de l'assistant, ou du call
          const restaurantId =
            parameters?.restaurant_id ||
            message.assistant?.metadata?.restaurant_id ||
            message.call?.metadata?.restaurant_id ||
            body?.assistant?.metadata?.restaurant_id ||
            body?.call?.metadata?.restaurant_id;

          console.log("🔍 RESTAURANT_ID EXTRACTION:");
          console.log("  - parameters?.restaurant_id:", parameters?.restaurant_id);
          console.log("  - message.assistant?.metadata?.restaurant_id:", message.assistant?.metadata?.restaurant_id);
          console.log("  - message.call?.metadata?.restaurant_id:", message.call?.metadata?.restaurant_id);
          console.log("  - body?.assistant?.metadata?.restaurant_id:", body?.assistant?.metadata?.restaurant_id);
          console.log("  - body?.call?.metadata?.restaurant_id:", body?.call?.metadata?.restaurant_id);
          console.log("  => FINAL restaurantId:", restaurantId);

          // get_current_date n'a pas besoin de restaurant_id
          if (!restaurantId && functionName !== 'get_current_date') {
            console.log("ERROR: restaurant_id manquant pour fonction:", functionName);
            return NextResponse.json({
              results: [{
                toolCallId: toolCall.id,
                result: "Erreur: restaurant_id manquant",
              }]
            });
          }

          // Ajouter le restaurant_id et le numéro Twilio aux paramètres si disponibles
          const twilioPhone = message.call?.customer?.number;
          const enrichedParams = {
            ...parameters,
            ...(restaurantId && { restaurant_id: restaurantId }),
            call_id: message.call?.id,
            // Injecter automatiquement le numéro Twilio si disponible et non déjà fourni
            ...(!parameters?.customer_phone && twilioPhone && { customer_phone: twilioPhone }),
          };

          console.log("Enriched params:", JSON.stringify(enrichedParams, null, 2));

          // Exécuter la fonction avec timeout protection (Story 1.2)
          console.log("Calling handleToolCall for:", functionName);
          let result;

          try {
            // Wrap in timeout protection - Vapi expects response within 20s
            result = await withTimeout(
              handleToolCall(functionName, enrichedParams),
              18000 // 18s timeout to stay under Vapi's 20s limit
            );

            console.log("Function result:", JSON.stringify(result, null, 2));
          } catch (functionError) {
            // Log the technical error with full context (Story 1.2)
            const errorType = getErrorType(functionError);

            logTechnicalError({
              timestamp: new Date().toISOString(),
              error_type: errorType,
              error_message: functionError instanceof Error ? functionError.message : String(functionError),
              stack_trace: functionError instanceof Error ? functionError.stack : undefined,
              call_id: message.call?.id,
              function_name: functionName,
              parameters: enrichedParams,
              restaurant_id: restaurantId,
              context: {
                event_type: message.type,
                tool_call_id: toolCall.id,
              },
            });

            // Return graceful error response that triggers agent fallback
            // The SYSTEM_PROMPT will instruct the agent to capture customer info
            const gracefulErrorMessage = createGracefulErrorResponse(functionName);

            console.log("=== RETURNING ERROR TO VAPI (GRACEFUL) ===");
            console.log("Tool Call ID:", toolCall.id);
            console.log("Error Response:", gracefulErrorMessage);
            console.log("=== END ===");

            return NextResponse.json({
              results: [{
                toolCallId: toolCall.id,
                result: gracefulErrorMessage,
              }]
            });
          }

          // Pour get_current_date, retourner un objet structuré
          let finalResult;
          if (functionName === 'get_current_date' && typeof result === 'object') {
            finalResult = JSON.stringify({
              current_date: result.current_date,
              current_time: result.current_time,
              day_of_week: result.day_of_week,
              message: result.message
            });
          } else if (result.message) {
            finalResult = result.message;
          } else if (typeof result === 'string') {
            finalResult = result;
          } else {
            finalResult = JSON.stringify(result);
          }

          console.log("=== RETURNING TO VAPI ===");
          console.log("Tool Call ID:", toolCall.id);
          console.log("Result:", finalResult);
          console.log("=== END ===");

          return NextResponse.json({
            results: [{
              toolCallId: toolCall.id,
              result: finalResult,
            }]
          });
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
        // Pour status-update, vérifier si c'est un appel qui démarre
        if (message.type === "status-update") {
          // Ignorer les status-update qui ne sont pas "in-progress" ou au début
          if (message.status !== "in-progress" && message.status !== "queued") {
            return NextResponse.json({ received: true });
          }

          // Vérifier si l'appel existe déjà en base pour éviter les doublons
          const { data: existingCall } = await getSupabaseAdmin()
            .from("calls")
            .select("id")
            .eq("vapi_call_id", message.call?.id)
            .single();

          if (existingCall) {
            // Appel déjà enregistré, ignorer
            return NextResponse.json({ received: true });
          }
        }

        console.log("=== CALL STARTED ===");
        console.log("Call ID:", message.call?.id);
        console.log("Event type:", message.type);
        console.log("Status:", message.status);

        // Récupérer le restaurant_id (depuis call metadata OU assistant metadata)
        const restaurantId =
          message.call?.metadata?.restaurant_id ||
          message.assistant?.metadata?.restaurant_id;

        console.log("Restaurant ID trouvé:", restaurantId);
        console.log("Call metadata:", message.call?.metadata);
        console.log("Assistant metadata:", message.assistant?.metadata);

        if (!restaurantId) {
          console.error("❌ RESTAURANT_ID MANQUANT - Appel non enregistré");
          console.error("Pour que les appels soient enregistrés, configurez restaurant_id dans les metadata de l'assistant Vapi");
          return NextResponse.json({ received: true, warning: "restaurant_id missing" });
        }

        // Créer l'enregistrement de l'appel
        // @ts-ignore - Type issue with Supabase generated types
        const { error } = await getSupabaseAdmin().from("calls").insert({
          vapi_call_id: message.call?.id,
          restaurant_id: restaurantId,
          phone_number: message.call?.customer?.number || null,
          status: "in_progress",
          vapi_metadata: message.call || {},
        });

        if (error) {
          console.error("❌ Error creating call record:", error);
        } else {
          console.log("✅ Call record created successfully");
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
        console.log("📝 Transcript:", message.transcript || message);
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
