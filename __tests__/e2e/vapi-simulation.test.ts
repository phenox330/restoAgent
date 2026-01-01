/**
 * Tests E2E - Simulation d'appels Vapi réels
 * Utilise des payloads basés sur les vrais formats Vapi
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { TEST_RESTAURANT_ID, mockRestaurant } from "../fixtures/restaurant";
import { mockReservation } from "../fixtures/reservations";

// Configuration globale du mock
let mockConfig = {
  restaurant: mockRestaurant as any,
  reservation: { ...mockReservation, cancellation_token: "real-cancel-token-123" } as any,
  reservations: [] as any[],
  hasDuplicate: false,
  callRecords: [] as any[],
};

// Track des appels effectués
let apiCalls: { type: string; data: any }[] = [];

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => {
      const chainable: any = {
        select: vi.fn(() => chainable),
        insert: vi.fn((data: any) => {
          apiCalls.push({ type: `insert:${table}`, data });
          return {
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ 
                data: mockConfig.reservation, 
                error: null 
              }),
            })),
          };
        }),
        update: vi.fn((data: any) => {
          apiCalls.push({ type: `update:${table}`, data });
          return {
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
        eq: vi.fn(() => chainable),
        in: vi.fn(() => chainable),
        single: vi.fn().mockImplementation(() => {
          if (table === "restaurants") {
            return Promise.resolve({ 
              data: mockConfig.restaurant, 
              error: null 
            });
          }
          if (table === "calls") {
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ 
            data: mockConfig.hasDuplicate ? mockConfig.reservation : null, 
            error: mockConfig.hasDuplicate ? null : { code: "PGRST116" }
          });
        }),
      };

      if (table === "reservations") {
        chainable.in = vi.fn(() => ({
          ...chainable,
          then: (resolve: any) => resolve({ 
            data: mockConfig.reservations, 
            error: null 
          }),
        }));
      }

      return chainable;
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
  })),
}));

vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string, options: any) => {
  apiCalls.push({ type: "fetch", data: { url, body: options?.body } });
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ sid: "SM" + Date.now() }),
  });
}));

import { POST } from "@/app/api/webhooks/vapi/route";

function createRequest(body: any): NextRequest {
  return new NextRequest("http://localhost:3000/api/webhooks/vapi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vapi-secret": "test-secret",
    },
    body: JSON.stringify(body),
  });
}

describe("Vapi E2E Simulation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiCalls = [];
    mockConfig = {
      restaurant: mockRestaurant,
      reservation: { ...mockReservation, cancellation_token: "real-cancel-token-123" },
      reservations: [],
      hasDuplicate: false,
      callRecords: [],
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Scénario 1: Nouvelle réservation réussie", () => {
    it("devrait gérer un appel complet de réservation", async () => {
      // Simulation d'un appel Vapi réel pour une nouvelle réservation

      // 1. Appel initial - demande de date
      const getDatePayload = {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "tc-date-001",
            function: {
              name: "get_current_date",
              arguments: "{}",
            },
          }],
          call: {
            id: "call-real-001",
            customer: { number: "+33612345678" },
          },
          assistant: {
            metadata: { restaurant_id: TEST_RESTAURANT_ID },
          },
        },
      };

      const dateResponse = await POST(createRequest(getDatePayload));
      const dateData = await dateResponse.json();
      
      expect(dateResponse.status).toBe(200);
      const dateResult = JSON.parse(dateData.results[0].result);
      expect(dateResult.current_date).toBeDefined();

      // 2. Vérification disponibilité
      const checkPayload = {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "tc-check-002",
            function: {
              name: "check_availability",
              arguments: JSON.stringify({
                date: "2025-01-20",
                time: "20:00",
                number_of_guests: 2,
              }),
            },
          }],
          call: {
            id: "call-real-001",
            customer: { number: "+33612345678" },
          },
          assistant: {
            metadata: { restaurant_id: TEST_RESTAURANT_ID },
          },
        },
      };

      const checkResponse = await POST(createRequest(checkPayload));
      const checkData = await checkResponse.json();
      
      expect(checkResponse.status).toBe(200);
      expect(checkData.results[0].result).toContain("disponibilité");

      // 3. Création de la réservation
      const createPayload = {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "tc-create-003",
            function: {
              name: "create_reservation",
              arguments: JSON.stringify({
                customer_name: "Sophie Bernard",
                customer_phone: "+33612345678",
                date: "2025-01-20",
                time: "20:00",
                number_of_guests: 2,
                force_create: true,
              }),
            },
          }],
          call: {
            id: "call-real-001",
            customer: { number: "+33612345678" },
          },
          assistant: {
            metadata: { restaurant_id: TEST_RESTAURANT_ID },
          },
        },
      };

      const createResponse = await POST(createRequest(createPayload));
      const createData = await createResponse.json();
      
      expect(createResponse.status).toBe(200);
      expect(createData.results[0].result).toBeDefined();

      // Vérifier qu'un SMS a été envoyé
      const smsCalls = apiCalls.filter(c => c.type === "fetch" && c.data.url.includes("twilio"));
      expect(smsCalls.length).toBeGreaterThan(0);
    });
  });

  describe("Scénario 2: Modification de réservation", () => {
    it("devrait permettre de modifier une réservation existante", async () => {
      const modifyPayload = {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "tc-modify-001",
            function: {
              name: "find_and_update_reservation",
              arguments: JSON.stringify({
                customer_name: "Jean Dupont",
                new_time: "21:00",
                new_number_of_guests: 3,
              }),
            },
          }],
          call: {
            id: "call-modify-001",
            customer: { number: "+33612345678" },
          },
          assistant: {
            metadata: { restaurant_id: TEST_RESTAURANT_ID },
          },
        },
      };

      const response = await POST(createRequest(modifyPayload));
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });
  });

  describe("Scénario 3: Annulation de réservation", () => {
    it("devrait permettre d'annuler une réservation", async () => {
      const cancelPayload = {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "tc-cancel-001",
            function: {
              name: "find_and_cancel_reservation",
              arguments: JSON.stringify({
                customer_name: "Pierre Martin",
                customer_phone: "+33699887766",
              }),
            },
          }],
          call: {
            id: "call-cancel-001",
            customer: { number: "+33699887766" },
          },
          assistant: {
            metadata: { restaurant_id: TEST_RESTAURANT_ID },
          },
        },
      };

      const response = await POST(createRequest(cancelPayload));
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
    });
  });

  describe("Scénario 4: Grand groupe", () => {
    it("devrait rediriger vers un rappel manager pour les grands groupes", async () => {
      const largeGroupPayload = {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "tc-large-001",
            function: {
              name: "create_reservation",
              arguments: JSON.stringify({
                customer_name: "Entreprise TechCorp",
                customer_phone: "+33612345678",
                date: "2025-02-01",
                time: "19:30",
                number_of_guests: 15,
              }),
            },
          }],
          call: {
            id: "call-large-001",
            customer: { number: "+33612345678" },
          },
          assistant: {
            metadata: { restaurant_id: TEST_RESTAURANT_ID },
          },
        },
      };

      const response = await POST(createRequest(largeGroupPayload));
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0].result).toContain("rappellera");
    });
  });

  describe("Scénario 5: Restaurant fermé", () => {
    it("devrait informer le client que le restaurant est fermé", async () => {
      // Test pour un dimanche (restaurant fermé)
      const closedPayload = {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "tc-closed-001",
            function: {
              name: "check_availability",
              arguments: JSON.stringify({
                date: "2025-01-19", // Dimanche
                time: "19:30",
                number_of_guests: 2,
              }),
            },
          }],
          call: {
            id: "call-closed-001",
            customer: { number: "+33612345678" },
          },
          assistant: {
            metadata: { restaurant_id: TEST_RESTAURANT_ID },
          },
        },
      };

      const response = await POST(createRequest(closedPayload));
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0].result).toContain("fermé");
    });
  });

  describe("Scénario 6: Capacité dépassée", () => {
    it("devrait proposer des alternatives quand complet", async () => {
      // Remplir la capacité
      mockConfig.reservations = [
        { number_of_guests: 58, reservation_time: "19:00" },
      ];

      const fullPayload = {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "tc-full-001",
            function: {
              name: "check_availability",
              arguments: JSON.stringify({
                date: "2025-01-15",
                time: "19:30",
                number_of_guests: 4,
              }),
            },
          }],
          call: {
            id: "call-full-001",
            customer: { number: "+33612345678" },
          },
          assistant: {
            metadata: { restaurant_id: TEST_RESTAURANT_ID },
          },
        },
      };

      const response = await POST(createRequest(fullPayload));
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results[0].result).toContain("insuffisante");
    });
  });

  describe("Vérification des formats de réponse Vapi", () => {
    it("devrait retourner le format correct pour tool-calls", async () => {
      const payload = {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "tc-format-001",
            function: {
              name: "get_current_date",
              arguments: "{}",
            },
          }],
          call: { id: "call-format-001" },
          assistant: { metadata: {} },
        },
      };

      const response = await POST(createRequest(payload));
      const data = await response.json();
      
      // Vérifier la structure de réponse attendue par Vapi
      expect(data).toHaveProperty("results");
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results[0]).toHaveProperty("toolCallId", "tc-format-001");
      expect(data.results[0]).toHaveProperty("result");
    });

    it("devrait gérer les arguments JSON string et objet", async () => {
      // Test avec arguments en tant que string JSON
      const stringPayload = {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "tc-string-001",
            function: {
              name: "check_availability",
              arguments: '{"date":"2025-01-15","time":"19:30","number_of_guests":2}',
            },
          }],
          call: { id: "call-string-001" },
          assistant: { metadata: { restaurant_id: TEST_RESTAURANT_ID } },
        },
      };

      const stringResponse = await POST(createRequest(stringPayload));
      expect(stringResponse.status).toBe(200);

      // Test avec arguments en tant qu'objet (certaines versions de Vapi)
      const objectPayload = {
        message: {
          type: "tool-calls",
          toolCalls: [{
            id: "tc-object-001",
            function: {
              name: "check_availability",
              arguments: { date: "2025-01-15", time: "19:30", number_of_guests: 2 },
            },
          }],
          call: { id: "call-object-001" },
          assistant: { metadata: { restaurant_id: TEST_RESTAURANT_ID } },
        },
      };

      const objectResponse = await POST(createRequest(objectPayload));
      expect(objectResponse.status).toBe(200);
    });
  });
});




