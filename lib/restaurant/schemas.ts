import { z } from "zod";

// Schéma pour un créneau horaire
export const timeSlotSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format invalide (HH:mm)"),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format invalide (HH:mm)"),
}).refine((data) => {
  const [startH, startM] = data.start.split(":").map(Number);
  const [endH, endM] = data.end.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return endMinutes > startMinutes;
}, {
  message: "L'heure de fin doit être après l'heure de début",
});

// Schéma pour les horaires d'une journée
export const dayScheduleSchema = z.object({
  lunch: timeSlotSchema.optional(),
  dinner: timeSlotSchema.optional(),
}).optional();

// Schéma pour tous les horaires de la semaine
export const openingHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
});

// Schéma principal pour le restaurant
export const restaurantSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  address: z.string().optional(),
  max_capacity: z.number().min(1, "La capacité doit être d'au moins 1").max(1000, "Capacité maximale : 1000"),
  default_reservation_duration: z.number().min(15, "Durée minimale : 15 minutes").max(480, "Durée maximale : 8 heures"),
  opening_hours: openingHoursSchema.optional(),
  closed_dates: z.array(z.string()).optional(),
});

export type RestaurantFormData = z.infer<typeof restaurantSchema>;
export type TimeSlot = z.infer<typeof timeSlotSchema>;
export type DaySchedule = z.infer<typeof dayScheduleSchema>;
export type OpeningHours = z.infer<typeof openingHoursSchema>;
