/**
 * Fixtures pour les payloads Vapi
 * Basé sur les formats réels reçus par le webhook
 */

import { TEST_RESTAURANT_ID } from "./restaurant";

// Call ID de test
export const TEST_CALL_ID = "call-test-123-456";
export const TEST_TOOL_CALL_ID = "tool-call-abc-123";

/**
 * Payload tool-calls format (nouveau format Vapi)
 */
export const createToolCallsPayload = (
  functionName: string,
  args: Record<string, any>,
  toolCallId = TEST_TOOL_CALL_ID
) => ({
  message: {
    type: "tool-calls",
    toolCalls: [
      {
        id: toolCallId,
        function: {
          name: functionName,
          arguments: JSON.stringify(args),
        },
      },
    ],
    call: {
      id: TEST_CALL_ID,
      metadata: {},
    },
    assistant: {
      metadata: {
        restaurant_id: TEST_RESTAURANT_ID,
      },
    },
  },
});

/**
 * Payload function-call format (ancien format Vapi)
 */
export const createFunctionCallPayload = (
  functionName: string,
  args: Record<string, any>
) => ({
  message: {
    type: "function-call",
    functionCall: {
      name: functionName,
      parameters: args,
    },
    call: {
      id: TEST_CALL_ID,
      metadata: {},
    },
    assistant: {
      metadata: {
        restaurant_id: TEST_RESTAURANT_ID,
      },
    },
  },
});

/**
 * Payload check_availability
 */
export const checkAvailabilityPayload = createToolCallsPayload(
  "check_availability",
  {
    date: "2025-01-15",
    time: "19:30",
    number_of_guests: 4,
  }
);

/**
 * Payload create_reservation
 */
export const createReservationPayload = createToolCallsPayload(
  "create_reservation",
  {
    customer_name: "Jean Dupont",
    customer_phone: "+33612345678",
    date: "2025-01-15",
    time: "19:30",
    number_of_guests: 4,
  }
);

/**
 * Payload create_reservation avec grand groupe
 */
export const createLargeGroupReservationPayload = createToolCallsPayload(
  "create_reservation",
  {
    customer_name: "Entreprise ABC",
    customer_phone: "+33612345678",
    date: "2025-01-20",
    time: "19:30",
    number_of_guests: 12, // > 8 = grand groupe
  }
);

/**
 * Payload find_and_cancel_reservation
 */
export const findAndCancelPayload = createToolCallsPayload(
  "find_and_cancel_reservation",
  {
    customer_name: "Jean Dupont",
    customer_phone: "+33612345678",
  }
);

/**
 * Payload find_and_update_reservation
 */
export const findAndUpdatePayload = createToolCallsPayload(
  "find_and_update_reservation",
  {
    customer_name: "Jean Dupont",
    new_date: "2025-01-16",
    new_time: "20:00",
    new_number_of_guests: 5,
  }
);

/**
 * Payload get_current_date
 */
export const getCurrentDatePayload = createToolCallsPayload(
  "get_current_date",
  {}
);

/**
 * Payload call-started
 */
export const callStartedPayload = {
  message: {
    type: "status-update",
    status: "in-progress",
    call: {
      id: TEST_CALL_ID,
      customer: {
        number: "+33612345678",
      },
    },
    assistant: {
      metadata: {
        restaurant_id: TEST_RESTAURANT_ID,
      },
    },
  },
};

/**
 * Payload end-of-call-report
 */
export const endOfCallPayload = {
  message: {
    type: "end-of-call-report",
    call: {
      id: TEST_CALL_ID,
      startedAt: "2025-01-15T10:00:00.000Z",
      endedAt: "2025-01-15T10:05:00.000Z",
    },
    transcript: "Bonjour, je voudrais réserver une table pour 4 personnes...",
    summary: "Le client a réservé une table pour 4 personnes le 15 janvier à 19h30.",
  },
};

/**
 * Payload avec restaurant_id manquant (pour tester le fallback)
 */
export const payloadWithoutRestaurantId = {
  message: {
    type: "tool-calls",
    toolCalls: [
      {
        id: TEST_TOOL_CALL_ID,
        function: {
          name: "check_availability",
          arguments: JSON.stringify({
            date: "2025-01-15",
            time: "19:30",
            number_of_guests: 4,
          }),
        },
      },
    ],
    call: {
      id: TEST_CALL_ID,
      metadata: {},
    },
    assistant: {
      metadata: {}, // Pas de restaurant_id
    },
  },
};




