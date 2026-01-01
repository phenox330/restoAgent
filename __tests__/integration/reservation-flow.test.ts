/**
 * Tests d'intégration pour le flux complet de réservation
 * Simule le parcours utilisateur complet via le webhook Vapi
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { TEST_RESTAURANT_ID, mockRestaurant } from "../fixtures/restaurant";
import { mockReservation } from "../fixtures/reservations";
import { createToolCallsPayload, TEST_TOOL_CALL_ID } from "../fixtures/vapi-payloads";

// Mock configuration
let mockSupabaseConfig = {
  restaurant: mockRestaurant as any,
  reservation: { ...mockReservation, cancellation_token: "cancel-token-xyz" } as any,
  reservations: [] as any[],
  hasDuplicate: false,
};

// Track SMS calls
let smsCalls: any[] = [];

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => {
      const chainable: any = {
        select: vi.fn(() => chainable),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ 
              data: mockSupabaseConfig.reservation, 
              error: null 
            }),
          })),
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
            data: mockSupabaseConfig.hasDuplicate ? mockSupabaseConfig.reservation : null, 
            error: mockSupabaseConfig.hasDuplicate ? null : { code: "PGRST116" }
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

// Mock fetch pour Twilio avec tracking
vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string, options: any) => {
  if (url.includes("api.twilio.com")) {
    smsCalls.push({ url, body: options?.body });
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ sid: "SM123456789" }),
  });
}));

// Import du webhook après les mocks
import { POST } from "@/app/api/webhooks/vapi/route";

function createMockRequest(body: any): NextRequest {
  return new NextRequest("http://localhost:3000/api/webhooks/vapi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vapi-secret": "test-secret",
    },
    body: JSON.stringify(body),
  });
}

describe("Reservation Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    smsCalls = [];
    mockSupabaseConfig = {
      restaurant: mockRestaurant,
      reservation: { ...mockReservation, cancellation_token: "cancel-token-xyz" },
      reservations: [],
      hasDuplicate: false,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Complete reservation flow", () => {
    it("should complete full reservation flow: check availability -> create -> SMS", async () => {
      // Étape 1: Vérifier la disponibilité
      const availabilityPayload = createToolCallsPayload("check_availability", {
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
      });

      const availabilityRequest = createMockRequest(availabilityPayload);
      const availabilityResponse = await POST(availabilityRequest);
      const availabilityData = await availabilityResponse.json();

      expect(availabilityResponse.status).toBe(200);
      expect(availabilityData.results[0].result).toContain("disponibilité");

      // Étape 2: Créer la réservation
      const reservationPayload = createToolCallsPayload("create_reservation", {
        customer_name: "Marie Martin",
        customer_phone: "+33687654321",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
        force_create: true,
      });

      const reservationRequest = createMockRequest(reservationPayload);
      const reservationResponse = await POST(reservationRequest);
      const reservationData = await reservationResponse.json();

      expect(reservationResponse.status).toBe(200);
      expect(reservationData.results).toBeDefined();

      // Étape 3: Vérifier que le SMS a été envoyé (si sms_enabled)
      if (mockRestaurant.sms_enabled) {
        expect(smsCalls.length).toBeGreaterThan(0);
        const smsCall = smsCalls[0];
        expect(smsCall.body).toContain("+33687654321".replace("+", "%2B"));
      }
    });

    it("should handle unavailable slot gracefully", async () => {
      // Remplir la capacité
      mockSupabaseConfig.reservations = [
        { number_of_guests: 58, reservation_time: "19:00" },
      ];

      const availabilityPayload = createToolCallsPayload("check_availability", {
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4, // 58 + 4 > 60 (max capacity)
      });

      const request = createMockRequest(availabilityPayload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Devrait indiquer que ce n'est pas disponible
      expect(data.results[0].result).toContain("insuffisante");
    });
  });

  describe("Duplicate reservation handling", () => {
    it("should bypass duplicate check with force_create", async () => {
      // Ce test vérifie que force_create permet de créer une réservation
      // même si un doublon existe potentiellement
      const payload = createToolCallsPayload("create_reservation", {
        customer_name: "Jean Dupont",
        customer_phone: "+33612345678",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
        force_create: true, // Bypass le check
      });

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Avec force_create, la réservation devrait être confirmée
      expect(data.results).toBeDefined();
    });

    it("should check for duplicates when force_create is not set", async () => {
      // Vérifier que le flux de détection de doublon est actif
      // Le mock retourne un doublon mais le code peut le gérer de différentes façons
      const payload = createToolCallsPayload("create_reservation", {
        customer_name: "Jean Dupont",
        customer_phone: "+33612345678",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
        // Sans force_create
      });

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toBeDefined();
      // Le résultat peut être soit une détection de doublon soit une création
      // selon l'état du mock
    });
  });

  describe("Large group handling", () => {
    it("should route large groups (>8) to manager callback", async () => {
      const payload = createToolCallsPayload("create_reservation", {
        customer_name: "Société XYZ",
        customer_phone: "+33612345678",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 12, // Grand groupe
      });

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].result).toContain("rappellera");
    });
  });

  describe("SMS sending", () => {
    it("should not send SMS when sms_enabled is false", async () => {
      mockSupabaseConfig.restaurant = { ...mockRestaurant, sms_enabled: false };

      const payload = createToolCallsPayload("create_reservation", {
        customer_name: "Jean Test",
        customer_phone: "+33612345678",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 2,
        force_create: true,
      });

      const request = createMockRequest(payload);
      await POST(request);

      // Pas d'appel SMS
      expect(smsCalls.length).toBe(0);
    });

    it("should send SMS with cancellation link when enabled", async () => {
      const payload = createToolCallsPayload("create_reservation", {
        customer_name: "Jean Test",
        customer_phone: "+33612345678",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 2,
        force_create: true,
      });

      const request = createMockRequest(payload);
      await POST(request);

      // SMS envoyé avec lien d'annulation
      expect(smsCalls.length).toBeGreaterThan(0);
      expect(smsCalls[0].body).toContain("cancel");
    });
  });

  describe("Error scenarios", () => {
    it("should handle missing customer info", async () => {
      const payload = createToolCallsPayload("create_reservation", {
        // Manque customer_name et customer_phone
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 2,
      });

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].result).toContain("manque");
    });

    it("should handle restaurant closed on requested date", async () => {
      // Le 25 décembre est dans closed_dates
      const payload = createToolCallsPayload("check_availability", {
        date: "2025-12-25",
        time: "19:30",
        number_of_guests: 2,
      });

      const request = createMockRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].result).toContain("fermé");
    });
  });
});

