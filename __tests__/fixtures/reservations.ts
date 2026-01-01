/**
 * Fixtures pour les réservations de test
 */

import { TEST_RESTAURANT_ID } from "./restaurant";

export const mockReservation = {
  id: "res-123-456-789",
  restaurant_id: TEST_RESTAURANT_ID,
  customer_name: "Jean Dupont",
  customer_phone: "+33612345678",
  customer_email: "jean.dupont@email.com",
  reservation_date: "2025-01-15",
  reservation_time: "19:30",
  number_of_guests: 4,
  status: "confirmed",
  special_requests: null,
  source: "phone",
  call_id: null,
  confidence_score: 0.85,
  needs_confirmation: false,
  cancellation_token: "cancel-token-abc123",
  created_at: "2025-01-10T10:00:00.000Z",
  updated_at: "2025-01-10T10:00:00.000Z",
};

export const mockPendingReservation = {
  ...mockReservation,
  id: "res-pending-123",
  status: "pending",
  needs_confirmation: true,
  confidence_score: 0.6,
};

export const mockCancelledReservation = {
  ...mockReservation,
  id: "res-cancelled-123",
  status: "cancelled",
};

// Liste de réservations pour tester la capacité
export const mockExistingReservations = [
  {
    number_of_guests: 4,
    reservation_time: "19:30",
  },
  {
    number_of_guests: 6,
    reservation_time: "20:00",
  },
  {
    number_of_guests: 2,
    reservation_time: "12:30", // Midi
  },
];

// Réservations pour test de doublon
export const mockDuplicateCheckReservations = [
  {
    id: "res-dup-123",
    customer_name: "Marie Martin",
    customer_phone: "+33687654321",
    reservation_date: "2025-01-20",
    reservation_time: "20:00",
    number_of_guests: 2,
    status: "confirmed",
  },
];

// Réservations pour test de recherche fuzzy
export const mockFuzzySearchReservations = [
  {
    id: "res-fuzzy-1",
    customer_name: "Pierre Durand",
    customer_phone: "+33611111111",
    reservation_date: "2025-01-25",
    reservation_time: "19:00",
    number_of_guests: 3,
    status: "confirmed",
    similarity_score: 0.9,
  },
  {
    id: "res-fuzzy-2",
    customer_name: "Pierre Durant",
    customer_phone: "+33622222222",
    reservation_date: "2025-01-26",
    reservation_time: "20:00",
    number_of_guests: 2,
    status: "confirmed",
    similarity_score: 0.85,
  },
];




