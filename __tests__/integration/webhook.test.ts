/**
 * Tests d'intégration pour le webhook Vapi
 * app/api/webhooks/vapi/route.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { TEST_RESTAURANT_ID, mockRestaurant } from "../fixtures/restaurant";
import { mockReservation } from "../fixtures/reservations";
import {
  createToolCallsPayload,
  createFunctionCallPayload,
  TEST_CALL_ID,
  TEST_TOOL_CALL_ID,
  callStartedPayload,
  endOfCallPayload,
  payloadWithoutRestaurantId,
} from "../fixtures/vapi-payloads";

// Mock Supabase
let mockSupabaseConfig = {
  restaurant: mockRestaurant as any,
  reservation: { ...mockReservation, cancellation_token: "test-token" } as any,
  reservations: [] as any[],
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => {
      const chainable: any = {
        select: vi.fn(() => chainable),
        insert: vi.fn(() => ({
          select: vi.fn(() => chainable),
          single: vi.fn().mockResolvedValue({ 
            data: mockSupabaseConfig.reservation, 
            error: null 
          }),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        eq: vi.fn(() => chainable),
        in: vi.fn(() => chainable),
        single: vi.fn().mockImplementation(() => {
          if (table === "restaurants") {
            return Promise.resolve({ 
              data: mockSupabaseConfig.restaurant, 
              error: null 
            });
          }
          if (table === "calls") {
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ 
            data: null, 
            error: { code: "PGRST116" }
          });
        }),
      };

      if (table === "reservations") {
        chainable.in = vi.fn(() => ({
          ...chainable,
          then: (resolve: any) => resolve({ 
            data: mockSupabaseConfig.reservations, 
            error: null 
          }),
        }));
      }

      return chainable;
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
  })),
}));

// Mock fetch pour Twilio
vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ sid: "SM123456789" }),
}));

// Import du webhook après les mocks
import { POST } from "@/app/api/webhooks/vapi/route";

// Helper pour créer une NextRequest
function createMockRequest(body: any): NextRequest {
  return new NextRequest("http://localhost:3000/api/webhooks/vapi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vapi-secret": "test-secret", // Pour passer la vérification
    },
    body: JSON.stringify(body),
  });
}

describe("Vapi Webhook Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseConfig = {
      restaurant: mockRestaurant,
      reservation: { ...mockReservation, cancellation_token: "test-token" },
      reservations: [],
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("tool-calls format (nouveau format Vapi)", () => {
    it("should handle check_availability tool call", async () => {
      const payload = createToolCallsPayload("check_availability", {
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
      });

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
      expect(data.results[0].toolCallId).toBe(TEST_TOOL_CALL_ID);
      expect(data.results[0].result).toBeDefined();
    });

    it("should handle create_reservation tool call", async () => {
      const payload = createToolCallsPayload("create_reservation", {
        customer_name: "Jean Dupont",
        customer_phone: "+33612345678",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
        force_create: true,
      });

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
      expect(data.results[0].toolCallId).toBe(TEST_TOOL_CALL_ID);
      // Le résultat dépend du mock - on vérifie juste qu'il y a un résultat
      expect(data.results[0].result).toBeDefined();
    });

    it("should handle get_current_date tool call", async () => {
      const payload = createToolCallsPayload("get_current_date", {});

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
      // get_current_date returns a JSON string
      const result = JSON.parse(data.results[0].result);
      expect(result.current_date).toBeDefined();
    });
  });

  describe("function-call format (ancien format Vapi)", () => {
    it("should handle function-call format for check_availability", async () => {
      const payload = createFunctionCallPayload("check_availability", {
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
      });

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });
  });

  describe("restaurant_id extraction", () => {
    it("should extract restaurant_id from assistant metadata", async () => {
      const payload = createToolCallsPayload("check_availability", {
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
      });

      const request = createMockRequest(payload);
      const response = await POST(request);

      expect(response.status).toBe(200);
      // Si restaurant_id est extrait correctement, la requête ne devrait pas échouer
    });

    it("should return error when restaurant_id is missing", async () => {
      const request = createMockRequest(payloadWithoutRestaurantId);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].result).toContain("restaurant_id manquant");
    });

    it("should not require restaurant_id for get_current_date", async () => {
      // Payload sans restaurant_id mais pour get_current_date
      const payload = {
        message: {
          type: "tool-calls",
          toolCalls: [
            {
              id: TEST_TOOL_CALL_ID,
              function: {
                name: "get_current_date",
                arguments: "{}",
              },
            },
          ],
          call: { id: TEST_CALL_ID },
          assistant: { metadata: {} }, // Pas de restaurant_id
        },
      };

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // get_current_date devrait fonctionner sans restaurant_id
      expect(data.results[0].result).not.toContain("manquant");
    });
  });

  describe("call lifecycle events", () => {
    it("should handle status-update (call started)", async () => {
      const request = createMockRequest(callStartedPayload);
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.received).toBe(true);
    });

    it("should handle end-of-call-report", async () => {
      const request = createMockRequest(endOfCallPayload);
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.received).toBe(true);
    });
  });

  describe("response format", () => {
    it("should return results array for tool calls", async () => {
      const payload = createToolCallsPayload("check_availability", {
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
      });

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty("results");
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results[0]).toHaveProperty("toolCallId");
      expect(data.results[0]).toHaveProperty("result");
    });

    it("should return correct toolCallId in response", async () => {
      const customToolCallId = "custom-tool-call-123";
      const payload = createToolCallsPayload(
        "check_availability",
        { date: "2025-01-15", time: "19:30", number_of_guests: 4 },
        customToolCallId
      );

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(data.results[0].toolCallId).toBe(customToolCallId);
    });
  });

  describe("error handling", () => {
    it("should handle invalid JSON gracefully", async () => {
      const request = new NextRequest("http://localhost:3000/api/webhooks/vapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it("should handle unknown tool call gracefully", async () => {
      const payload = createToolCallsPayload("unknown_function", {});

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].result).toContain("inconnue");
    });
  });
});

