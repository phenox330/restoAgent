import type { Database } from './database'

// Types simplifiés pour l'utilisation dans l'app
export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type RestaurantInsert = Database['public']['Tables']['restaurants']['Insert']
export type RestaurantUpdate = Database['public']['Tables']['restaurants']['Update']

export type Reservation = Database['public']['Tables']['reservations']['Row']
export type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
export type ReservationUpdate = Database['public']['Tables']['reservations']['Update']

export type Call = Database['public']['Tables']['calls']['Row']
export type CallInsert = Database['public']['Tables']['calls']['Insert']
export type CallUpdate = Database['public']['Tables']['calls']['Update']

// Types des vues
export type ReservationToday = Database['public']['Views']['reservations_today']['Row']
export type ReservationStats = Database['public']['Views']['reservation_stats']['Row']

// Types des enums
export type ReservationStatus = Database['public']['Tables']['reservations']['Row']['status']
export type ReservationSource = Database['public']['Tables']['reservations']['Row']['source']
export type CallStatus = Database['public']['Tables']['calls']['Row']['status']

// Types pour les horaires d'ouverture
export interface TimeSlot {
  start: string // Format: "HH:mm"
  end: string   // Format: "HH:mm"
}

export interface DaySchedule {
  lunch?: TimeSlot
  dinner?: TimeSlot
}

export interface OpeningHours {
  monday?: DaySchedule
  tuesday?: DaySchedule
  wednesday?: DaySchedule
  thursday?: DaySchedule
  friday?: DaySchedule
  saturday?: DaySchedule
  sunday?: DaySchedule
}

// Réservation avec infos restaurant (pour l'affichage)
export interface ReservationWithRestaurant extends Reservation {
  restaurant: Restaurant
}

// Réservation avec infos appel
export interface ReservationWithCall extends Reservation {
  call?: Call
}
