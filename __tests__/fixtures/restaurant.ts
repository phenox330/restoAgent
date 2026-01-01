/**
 * Fixtures pour les données restaurant
 */

export const TEST_RESTAURANT_ID = "a0a1a251-0f2d-495a-9141-8115a10a9d77";

export const mockRestaurant = {
  id: TEST_RESTAURANT_ID,
  name: "Restaurant Épicurie",
  phone: "+33123456789",
  email: "contact@epicurie.fr",
  address: "123 Rue de la Gastronomie, 75001 Paris",
  max_capacity_lunch: 50,
  max_capacity_dinner: 60,
  sms_enabled: true,
  opening_hours: {
    monday: {
      lunch: { start: "12:00", end: "14:30" },
      dinner: { start: "19:00", end: "22:30" },
    },
    tuesday: {
      lunch: { start: "12:00", end: "14:30" },
      dinner: { start: "19:00", end: "22:30" },
    },
    wednesday: {
      lunch: { start: "12:00", end: "14:30" },
      dinner: { start: "19:00", end: "22:30" },
    },
    thursday: {
      lunch: { start: "12:00", end: "14:30" },
      dinner: { start: "19:00", end: "22:30" },
    },
    friday: {
      lunch: { start: "12:00", end: "14:30" },
      dinner: { start: "19:00", end: "23:00" },
    },
    saturday: {
      lunch: null, // Fermé le samedi midi
      dinner: { start: "19:00", end: "23:00" },
    },
    sunday: null, // Fermé le dimanche
  },
  closed_dates: ["2025-12-25", "2025-01-01"],
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  user_id: "user-123",
};

export const mockRestaurantWithSmsDisabled = {
  ...mockRestaurant,
  sms_enabled: false,
};

export const mockRestaurantFull = {
  ...mockRestaurant,
  max_capacity_lunch: 10,
  max_capacity_dinner: 10,
};




