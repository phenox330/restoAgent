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
  // Trace des upserts (idempotence des lignes calls)
  upsertCalls: [] as { table: string; row: any; opts: any }[],
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
        upsert: vi.fn((row: any, opts: any) => {
          mockSupabaseConfig.upsertCalls.push({ table, row, opts });
          return Promise.resolve({ data: null, error: null });
        }),
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
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
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
    rpc: vi.fn().mockImplementation((fnName: string) => {
      if (fnName === "create_reservation_atomic") {
        return Promise.resolve({
          data: [
            {
              reservation_id: mockSupabaseConfig.reservation.id,
              reservation_cancellation_token:
                mockSupabaseConfig.reservation.cancellation_token,
              was_created: true,
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: { code: "PGRST116" } });
    }),
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
      upsertCalls: [],
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

    it("should record call rows idempotently on webhook retry (upsert onConflict vapi_call_id)", async () => {
      // Un même événement rejoué (retry Vapi) ne doit jamais produire une 2e
      // ligne calls : l'écriture passe par un upsert DO NOTHING appuyé sur la
      // contrainte UNIQUE(vapi_call_id), pas par un check-then-insert racé.
      const first = await POST(createMockRequest(callStartedPayload));
      const retry = await POST(createMockRequest(callStartedPayload));

      expect(first.status).toBe(200);
      expect(retry.status).toBe(200);

      const callUpserts = mockSupabaseConfig.upsertCalls.filter(
        (u) => u.table === "calls"
      );
      expect(callUpserts).toHaveLength(2);
      for (const u of callUpserts) {
        expect(u.row.vapi_call_id).toBe(TEST_CALL_ID);
        expect(u.opts).toMatchObject({
          onConflict: "vapi_call_id",
          ignoreDuplicates: true,
        });
      }
    });

    it("should not insert a call row when vapi call id is missing", async () => {
      const payload = {
        message: {
          type: "status-update",
          status: "in-progress",
          call: { customer: { number: "+33612345678" } }, // pas d'id
          assistant: { metadata: { restaurant_id: TEST_RESTAURANT_ID } },
        },
      };

      const response = await POST(createMockRequest(payload));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.warning).toBe("call id missing");
      expect(mockSupabaseConfig.upsertCalls).toHaveLength(0);
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

