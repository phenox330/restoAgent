/**
 * Error Logging Infrastructure - Story 1.2
 *
 * Foundation for comprehensive error logging.
 * Will be extended in Story 1.10 with database persistence.
 */

export interface ErrorLogEntry {
  timestamp: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  call_id?: string;
  function_name?: string;
  parameters?: Record<string, any>;
  restaurant_id?: string;
  context?: Record<string, any>;
}

/**
 * Log a technical error with full context
 *
 * Currently logs to console. Story 1.10 will add database persistence.
 */
export function logTechnicalError(entry: ErrorLogEntry): void {
  const logEntry = {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  console.error("========================================");
  console.error("🚨 TECHNICAL ERROR LOGGED");
  console.error("========================================");
  console.error("Timestamp:", logEntry.timestamp);
  console.error("Type:", logEntry.error_type);
  console.error("Message:", logEntry.error_message);

  if (logEntry.call_id) {
    console.error("Call ID:", logEntry.call_id);
  }

  if (logEntry.function_name) {
    console.error("Function:", logEntry.function_name);
  }

  if (logEntry.restaurant_id) {
    console.error("Restaurant ID:", logEntry.restaurant_id);
  }

  if (logEntry.parameters) {
    console.error("Parameters:", JSON.stringify(logEntry.parameters, null, 2));
  }

  if (logEntry.context) {
    console.error("Context:", JSON.stringify(logEntry.context, null, 2));
  }

  if (logEntry.stack_trace) {
    console.error("Stack Trace:", logEntry.stack_trace);
  }

  console.error("========================================");

  // TODO Story 1.10: Persist to database
  // await getSupabaseAdmin().from('error_logs').insert({ ...logEntry })
}

/**
 * Create user-friendly error message for Vapi agent
 *
 * Returns a message that triggers the agent's fallback procedure
 * without exposing technical details.
 */
export function createGracefulErrorResponse(functionName: string): string {
  // Generic error message that doesn't expose technical details
  // The SYSTEM_PROMPT will instruct the agent on how to handle this
  return `ERREUR_TECHNIQUE: Une erreur technique est survenue lors de l'exécution de ${functionName}. Veuillez utiliser la procédure de capture de coordonnées.`;
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("timeout") ||
      error.message.includes("timed out") ||
      error.name === "TimeoutError"
    );
  }
  return false;
}

/**
 * Check if an error is a database error
 */
export function isDatabaseError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("database") ||
      error.message.includes("postgres") ||
      error.message.includes("supabase") ||
      error.message.includes("connection")
    );
  }
  return false;
}

/**
 * Determine error type from error object
 */
export function getErrorType(error: unknown): string {
  if (isTimeoutError(error)) {
    return "TIMEOUT";
  }
  if (isDatabaseError(error)) {
    return "DATABASE";
  }
  if (error instanceof Error) {
    return error.name;
  }
  return "UNKNOWN";
}
