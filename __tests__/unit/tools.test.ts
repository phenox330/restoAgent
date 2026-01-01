/**
 * Tests unitaires pour lib/vapi/tools.ts
 * 
 * Note: Ces tests vérifient la logique des handlers de tools sans
 * dépendre de l'implémentation réelle de Supabase.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TEST_RESTAURANT_ID, mockRestaurant } from "../fixtures/restaurant";
import { mockReservation } from "../fixtures/reservations";

// Mock fetch pour Twilio
let mockFetch: ReturnType<typeof vi.fn>;

// Configuration du mock Supabase
let mockConfig = {
  restaurant: mockRestaurant as any,
  restaurantError: null as any,
  reservation: { ...mockReservation, cancellation_token: "test-token-123" } as any,
  reservations: [] as any[],
  hasDuplicate: false,
  callExists: false,
};

// Mock Supabase AVANT tout import de tools
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => {
      const chainable: any = {
        select: vi.fn(() => chainable),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ 
              data: mockConfig.reservation, 
              error: null 
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        eq: vi.fn(() => chainable),
        in: vi.fn(() => chainable),
        or: vi.fn(() => chainable),
        order: vi.fn(() => chainable),
        limit: vi.fn(() => chainable),
        single: vi.fn().mockImplementation(() => {
          if (table === "restaurants") {
            return Promise.resolve({ 
              data: mockConfig.restaurant, 
              error: mockConfig.restaurantError 
            });
          }
          if (table === "calls") {
            return Promise.resolve({ 
              data: mockConfig.callExists ? { id: "call-id" } : null, 
              error: null 
            });
          }
          // reservations - pour duplicate check
          return Promise.resolve({ 
            data: mockConfig.hasDuplicate ? mockConfig.reservation : null, 
            error: mockConfig.hasDuplicate ? null : { code: "PGRST116" }
          });
        }),
      };

      // Handle the then for list queries (for availability check)
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

// Helper pour configurer le mock
function setupMockConfig(config: Partial<typeof mockConfig>) {
  Object.assign(mockConfig, config);
}

// Import après les mocks
import {
  handleGetCurrentDate,
  handleCheckAvailability,
  handleCreateReservation,
  handleCancelReservation,
  handleToolCall,
} from "@/lib/vapi/tools";

describe("tools.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset config to defaults
    mockConfig = {
      restaurant: mockRestaurant,
      restaurantError: null,
      reservation: { ...mockReservation, cancellation_token: "test-token-123" },
      reservations: [],
      hasDuplicate: false,
      callExists: false,
    };
    
    // Mock Twilio fetch response
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ sid: "SM123456789" }),
    });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("handleGetCurrentDate", () => {
    it("should return current date information in French", async () => {
      const result = await handleGetCurrentDate();

      expect(result.success).toBe(true);
      expect(result.current_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.current_time).toMatch(/^\d{2}:\d{2}$/);
      expect(result.day_of_week).toBeDefined();
      expect(result.message).toContain("Nous sommes le");
    });

    it("should return French day names", async () => {
      const result = await handleGetCurrentDate();
      
      const frenchDays = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
      expect(frenchDays).toContain(result.day_of_week);
    });

    it("should return tomorrow and next week dates", async () => {
      const result = await handleGetCurrentDate();

      expect(result.tomorrow_date).toBeDefined();
      expect(result.tomorrow_day).toBeDefined();
      expect(result.next_week_date).toBeDefined();
    });
  });

  describe("handleCheckAvailability", () => {
    it("should return available=true when capacity is available", async () => {
      setupMockConfig({ reservations: [] });

      const result = await handleCheckAvailability({
        restaurant_id: TEST_RESTAURANT_ID,
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
      });

      expect(result.success).toBe(true);
      expect(result.available).toBe(true);
      expect(result.message).toContain("disponibilité");
    });

    it("should return available=false when restaurant not found", async () => {
      // Ce test vérifie le comportement quand le restaurant n'est pas trouvé
      setupMockConfig({ 
        restaurant: null, 
        restaurantError: { message: "Not found" },
      });

      const result = await handleCheckAvailability({
        restaurant_id: "invalid-id",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
      });

      // Quand le restaurant n'est pas trouvé, le message contient "Restaurant non trouvé"
      expect(result.available).toBe(false);
      expect(result.message).toContain("Restaurant non trouvé");
    });

    it("should include service type in response", async () => {
      setupMockConfig({ reservations: [] });

      const dinnerResult = await handleCheckAvailability({
        restaurant_id: TEST_RESTAURANT_ID,
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
      });

      expect(dinnerResult.serviceType).toBe("dinner");
    });
  });

  describe("handleCreateReservation", () => {
    it("should return error when required fields are missing", async () => {
      const result = await handleCreateReservation({
        restaurant_id: TEST_RESTAURANT_ID,
        customer_name: "",
        customer_phone: "",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
      });

      expect(result.success).toBe(false);
      expect(result.missing_fields).toBeDefined();
      expect(result.message).toContain("manque");
    });

    it("should handle large groups (>8 persons) specially", async () => {
      const result = await handleCreateReservation({
        restaurant_id: TEST_RESTAURANT_ID,
        customer_name: "Entreprise ABC",
        customer_phone: "+33612345678",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 12,
      });

      expect(result.success).toBe(true);
      expect(result.requires_callback).toBe(true);
      expect(result.message).toContain("rappellera");
    });

    it("should create reservation and return success message", async () => {
      setupMockConfig({ reservations: [], hasDuplicate: false });

      const result = await handleCreateReservation({
        restaurant_id: TEST_RESTAURANT_ID,
        customer_name: "Jean Dupont",
        customer_phone: "+33612345678",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
        force_create: true, // Bypass duplicate check
      });

      expect(result.success).toBe(true);
      expect(result.reservation_id).toBeDefined();
      expect(result.message).toContain("confirmée");
    });

    it("should send SMS when sms_enabled is true", async () => {
      setupMockConfig({ reservations: [], hasDuplicate: false });

      await handleCreateReservation({
        restaurant_id: TEST_RESTAURANT_ID,
        customer_name: "Jean Dupont",
        customer_phone: "+33612345678",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
        force_create: true, // Bypass duplicate check
      });

      // Vérifier que fetch a été appelé pour Twilio
      expect(mockFetch).toHaveBeenCalled();
      const twilioCall = mockFetch.mock.calls.find((call: any) => 
        call[0].includes("api.twilio.com")
      );
      expect(twilioCall).toBeDefined();
    });

    it("should not send SMS when sms_enabled is false", async () => {
      setupMockConfig({ 
        restaurant: { ...mockRestaurant, sms_enabled: false },
        reservations: [],
        hasDuplicate: false,
      });

      await handleCreateReservation({
        restaurant_id: TEST_RESTAURANT_ID,
        customer_name: "Jean Dupont",
        customer_phone: "+33612345678",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
        force_create: true, // Bypass duplicate check
      });

      // Vérifier que fetch n'a PAS été appelé pour Twilio
      const twilioCall = mockFetch.mock.calls.find((call: any) => 
        call[0].includes("api.twilio.com")
      );
      expect(twilioCall).toBeUndefined();
    });

    it("should calculate confidence score", async () => {
      setupMockConfig({ reservations: [], hasDuplicate: false });

      const result = await handleCreateReservation({
        restaurant_id: TEST_RESTAURANT_ID,
        customer_name: "Jean Dupont",
        customer_phone: "+33612345678",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
        force_create: true, // Bypass duplicate check
      });

      expect(result.confidence_score).toBeDefined();
      expect(result.confidence_score).toBeGreaterThan(0);
      expect(result.confidence_score).toBeLessThanOrEqual(1);
    });
  });

  describe("handleCancelReservation", () => {
    it("should cancel reservation successfully", async () => {
      const result = await handleCancelReservation({
        reservation_id: "res-123-456-789",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("annulée");
    });
  });

  describe("handleToolCall (router)", () => {
    it("should route get_current_date correctly", async () => {
      const result = await handleToolCall("get_current_date", {});

      expect(result.success).toBe(true);
      expect(result.current_date).toBeDefined();
    });

    it("should route check_availability correctly", async () => {
      setupMockConfig({ reservations: [] });

      const result = await handleToolCall("check_availability", {
        restaurant_id: TEST_RESTAURANT_ID,
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
      });

      expect(result.available).toBeDefined();
    });

    it("should route create_reservation correctly", async () => {
      setupMockConfig({ reservations: [], hasDuplicate: false });

      const result = await handleToolCall("create_reservation", {
        restaurant_id: TEST_RESTAURANT_ID,
        customer_name: "Test User",
        customer_phone: "+33612345678",
        date: "2025-01-15",
        time: "19:30",
        number_of_guests: 4,
        force_create: true, // Bypass duplicate check
      });

      expect(result.success).toBeDefined();
    });

    it("should return error for unknown function", async () => {
      const result = await handleToolCall("unknown_function", {});

      expect(result.success).toBe(false);
      expect(result.message).toContain("inconnue");
    });
  });
});

