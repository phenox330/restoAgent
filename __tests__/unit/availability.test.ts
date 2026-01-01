/**
 * Tests unitaires pour lib/vapi/availability.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getServiceType,
  checkAvailability,
  checkDuplicateReservation,
} from "@/lib/vapi/availability";
import { mockRestaurant, TEST_RESTAURANT_ID } from "../fixtures/restaurant";
import { mockExistingReservations, mockDuplicateCheckReservations } from "../fixtures/reservations";

// Mock du client Supabase
const createMockSupabase = (options: {
  restaurant?: typeof mockRestaurant | null;
  restaurantError?: any;
  reservations?: any[];
  reservationsError?: any;
  duplicateReservation?: any;
} = {}) => {
  const {
    restaurant = mockRestaurant,
    restaurantError = null,
    reservations = [],
    reservationsError = null,
    duplicateReservation = null,
  } = options;

  return {
    from: vi.fn((table: string) => {
      if (table === "restaurants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: restaurant, error: restaurantError }),
        };
      }
      if (table === "reservations") {
        const chainableMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnValue({
            data: reservations,
            error: reservationsError,
            then: (resolve: any) => resolve({ data: reservations, error: reservationsError }),
          }),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: duplicateReservation, 
            error: duplicateReservation ? null : { code: "PGRST116" } 
          }),
        };
        // Make all methods chainable
        chainableMock.select = vi.fn(() => chainableMock);
        chainableMock.eq = vi.fn(() => chainableMock);
        chainableMock.limit = vi.fn(() => chainableMock);
        chainableMock.in = vi.fn(() => ({
          ...chainableMock,
          then: (resolve: any) => resolve({ data: reservations, error: reservationsError }),
        }));
        chainableMock.single = vi.fn().mockResolvedValue({ 
          data: duplicateReservation, 
          error: duplicateReservation ? null : { code: "PGRST116" } 
        });
        return chainableMock;
      }
      return {};
    }),
  } as any;
};

describe("availability.ts", () => {
  describe("getServiceType", () => {
    it("should return 'lunch' for times before 15:00", () => {
      expect(getServiceType("12:00")).toBe("lunch");
      expect(getServiceType("12:30")).toBe("lunch");
      expect(getServiceType("13:00")).toBe("lunch");
      expect(getServiceType("14:00")).toBe("lunch");
      expect(getServiceType("14:59")).toBe("lunch");
    });

    it("should return 'dinner' for times at or after 15:00", () => {
      expect(getServiceType("15:00")).toBe("dinner");
      expect(getServiceType("19:00")).toBe("dinner");
      expect(getServiceType("19:30")).toBe("dinner");
      expect(getServiceType("20:00")).toBe("dinner");
      expect(getServiceType("22:00")).toBe("dinner");
    });

    it("should handle edge cases", () => {
      expect(getServiceType("00:00")).toBe("lunch"); // Minuit considéré comme midi
      expect(getServiceType("11:59")).toBe("lunch");
      expect(getServiceType("23:59")).toBe("dinner");
    });
  });

  describe("checkAvailability", () => {
    it("should return available=true when restaurant has capacity", async () => {
      const mockSupabase = createMockSupabase({
        restaurant: mockRestaurant,
        reservations: [], // Pas de réservations existantes
      });

      const result = await checkAvailability(mockSupabase, {
        restaurantId: TEST_RESTAURANT_ID,
        date: "2025-01-15", // Mercredi
        time: "19:30",
        numberOfGuests: 4,
      });

      expect(result.available).toBe(true);
      expect(result.serviceType).toBe("dinner");
      expect(result.availableCapacity).toBe(60); // max_capacity_dinner
    });

    it("should return available=false when restaurant is not found", async () => {
      const mockSupabase = createMockSupabase({
        restaurant: null,
        restaurantError: { message: "Not found" },
      });

      const result = await checkAvailability(mockSupabase, {
        restaurantId: "invalid-id",
        date: "2025-01-15",
        time: "19:30",
        numberOfGuests: 4,
      });

      expect(result.available).toBe(false);
      expect(result.reason).toBe("Restaurant non trouvé");
    });

    it("should return available=false when restaurant is closed on that day", async () => {
      const mockSupabase = createMockSupabase({
        restaurant: mockRestaurant,
      });

      const result = await checkAvailability(mockSupabase, {
        restaurantId: TEST_RESTAURANT_ID,
        date: "2025-01-19", // Dimanche - fermé
        time: "19:30",
        numberOfGuests: 4,
      });

      expect(result.available).toBe(false);
      expect(result.reason).toBe("Le restaurant est fermé ce jour-là");
    });

    it("should return available=false on closed dates", async () => {
      const mockSupabase = createMockSupabase({
        restaurant: mockRestaurant,
      });

      const result = await checkAvailability(mockSupabase, {
        restaurantId: TEST_RESTAURANT_ID,
        date: "2025-12-25", // Noël - dans closed_dates
        time: "19:30",
        numberOfGuests: 4,
      });

      expect(result.available).toBe(false);
      expect(result.reason).toBe("Le restaurant est fermé ce jour-là");
    });

    it("should return available=false when outside opening hours", async () => {
      const mockSupabase = createMockSupabase({
        restaurant: mockRestaurant,
      });

      const result = await checkAvailability(mockSupabase, {
        restaurantId: TEST_RESTAURANT_ID,
        date: "2025-01-15", // Mercredi
        time: "17:00", // Entre les services
        numberOfGuests: 4,
      });

      expect(result.available).toBe(false);
      expect(result.reason).toBe("Le restaurant n'est pas ouvert à cette heure");
    });

    it("should return available=false when capacity is exceeded", async () => {
      // 56 couverts déjà réservés pour le dîner (max 60)
      const existingReservations = [
        { number_of_guests: 30, reservation_time: "19:00" },
        { number_of_guests: 26, reservation_time: "20:00" },
      ];

      const mockSupabase = createMockSupabase({
        restaurant: mockRestaurant,
        reservations: existingReservations,
      });

      const result = await checkAvailability(mockSupabase, {
        restaurantId: TEST_RESTAURANT_ID,
        date: "2025-01-15",
        time: "19:30",
        numberOfGuests: 6, // 56 + 6 = 62 > 60
      });

      expect(result.available).toBe(false);
      expect(result.reason).toContain("Capacité insuffisante");
      expect(result.availableCapacity).toBe(4); // 60 - 56 = 4
    });

    it("should only count reservations from the same service (lunch/dinner)", async () => {
      // Réservations mixtes midi et soir
      const existingReservations = [
        { number_of_guests: 45, reservation_time: "12:30" }, // Midi
        { number_of_guests: 10, reservation_time: "19:00" }, // Soir
      ];

      const mockSupabase = createMockSupabase({
        restaurant: mockRestaurant,
        reservations: existingReservations,
      });

      // Demande pour le soir - devrait ne compter que les 10 du soir
      const result = await checkAvailability(mockSupabase, {
        restaurantId: TEST_RESTAURANT_ID,
        date: "2025-01-15",
        time: "19:30",
        numberOfGuests: 4,
      });

      expect(result.available).toBe(true);
      expect(result.availableCapacity).toBe(50); // 60 - 10 = 50
    });

    it("should return alternatives when not available", async () => {
      const existingReservations = [
        { number_of_guests: 58, reservation_time: "19:00" },
      ];

      const mockSupabase = createMockSupabase({
        restaurant: mockRestaurant,
        reservations: existingReservations,
      });

      const result = await checkAvailability(mockSupabase, {
        restaurantId: TEST_RESTAURANT_ID,
        date: "2025-01-15",
        time: "19:30",
        numberOfGuests: 4,
      });

      expect(result.available).toBe(false);
      expect(result.alternatives).toBeDefined();
    });
  });

  describe("checkDuplicateReservation", () => {
    it("should return hasDuplicate=true when duplicate exists", async () => {
      const mockSupabase = createMockSupabase({
        duplicateReservation: mockDuplicateCheckReservations[0],
      });

      const result = await checkDuplicateReservation(mockSupabase, {
        restaurantId: TEST_RESTAURANT_ID,
        customerPhone: "+33687654321",
        date: "2025-01-20",
      });

      expect(result.hasDuplicate).toBe(true);
      expect(result.existingReservation).toBeDefined();
      expect(result.existingReservation?.customer_name).toBe("Marie Martin");
    });

    it("should return hasDuplicate=false when no duplicate exists", async () => {
      const mockSupabase = createMockSupabase({
        duplicateReservation: null,
      });

      const result = await checkDuplicateReservation(mockSupabase, {
        restaurantId: TEST_RESTAURANT_ID,
        customerPhone: "+33699999999",
        date: "2025-01-25",
      });

      expect(result.hasDuplicate).toBe(false);
      expect(result.existingReservation).toBeUndefined();
    });
  });
});

