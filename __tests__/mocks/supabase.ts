/**
 * Mock du client Supabase pour les tests
 */

import { vi } from "vitest";
import { mockRestaurant } from "../fixtures/restaurant";
import { mockReservation, mockExistingReservations } from "../fixtures/reservations";

type MockQueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
};

/**
 * Crée un mock de query builder Supabase
 */
export function createMockQueryBuilder(data: any = null, error: any = null): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    rpc: vi.fn().mockResolvedValue({ data, error }),
  };

  // Les méthodes chaînées retournent le builder
  Object.keys(builder).forEach((key) => {
    if (key !== "single" && key !== "rpc") {
      (builder as any)[key].mockReturnValue(builder);
    }
  });

  return builder;
}

/**
 * Crée un mock du client Supabase complet
 */
export function createMockSupabaseClient(options: {
  restaurantData?: typeof mockRestaurant | null;
  restaurantError?: any;
  reservationData?: typeof mockReservation | null;
  reservationError?: any;
  existingReservations?: typeof mockExistingReservations;
  rpcData?: any;
  rpcError?: any;
} = {}) {
  const {
    restaurantData = mockRestaurant,
    restaurantError = null,
    reservationData = mockReservation,
    reservationError = null,
    existingReservations = [],
    rpcData = null,
    rpcError = null,
  } = options;

  const from = vi.fn((table: string) => {
    if (table === "restaurants") {
      return createMockQueryBuilder(restaurantData, restaurantError);
    }
    if (table === "reservations") {
      const builder = createMockQueryBuilder(reservationData, reservationError);
      
      // Override select pour retourner la liste des réservations existantes
      builder.select = vi.fn().mockImplementation(() => {
        const selectBuilder = {
          ...builder,
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: reservationData, error: reservationError }),
        };
        
        // Pour les requêtes sans single(), retourner la liste
        Object.defineProperty(selectBuilder, "then", {
          value: (resolve: (value: any) => void) => {
            resolve({ data: existingReservations, error: null });
          },
        });
        
        return selectBuilder;
      });

      // Override insert pour retourner la réservation créée
      builder.insert = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: reservationData, error: reservationError }),
        }),
      }));

      return builder;
    }
    if (table === "calls") {
      return createMockQueryBuilder(null, null);
    }
    return createMockQueryBuilder(null, null);
  });

  const rpc = vi.fn().mockResolvedValue({ data: rpcData, error: rpcError });

  return {
    from,
    rpc,
  };
}

/**
 * Type pour le mock Supabase
 */
export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;

/**
 * Helper pour injecter le mock Supabase dans les modules
 */
export function mockSupabaseModule(mockClient: MockSupabaseClient) {
  vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => mockClient),
  }));
}




