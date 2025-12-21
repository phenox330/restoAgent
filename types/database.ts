export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type ReservationSource = 'phone' | 'web' | 'manual'
export type CallStatus = 'in_progress' | 'completed' | 'failed'

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string
          address: string | null
          max_capacity: number
          default_reservation_duration: number
          opening_hours: Json
          closed_dates: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone: string
          address?: string | null
          max_capacity?: number
          default_reservation_duration?: number
          opening_hours?: Json
          closed_dates?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string
          address?: string | null
          max_capacity?: number
          default_reservation_duration?: number
          opening_hours?: Json
          closed_dates?: Json
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          restaurant_id: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          reservation_date: string
          reservation_time: string
          number_of_guests: number
          duration: number
          status: ReservationStatus
          source: ReservationSource
          special_requests: string | null
          internal_notes: string | null
          call_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          reservation_date: string
          reservation_time: string
          number_of_guests: number
          duration?: number
          status?: ReservationStatus
          source?: ReservationSource
          special_requests?: string | null
          internal_notes?: string | null
          call_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          reservation_date?: string
          reservation_time?: string
          number_of_guests?: number
          duration?: number
          status?: ReservationStatus
          source?: ReservationSource
          special_requests?: string | null
          internal_notes?: string | null
          call_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      calls: {
        Row: {
          id: string
          restaurant_id: string
          vapi_call_id: string | null
          phone_number: string
          duration: number | null
          status: CallStatus
          transcript: string | null
          summary: string | null
          vapi_metadata: Json | null
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          vapi_call_id?: string | null
          phone_number: string
          duration?: number | null
          status?: CallStatus
          transcript?: string | null
          summary?: string | null
          vapi_metadata?: Json | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          vapi_call_id?: string | null
          phone_number?: string
          duration?: number | null
          status?: CallStatus
          transcript?: string | null
          summary?: string | null
          vapi_metadata?: Json | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      reservations_today: {
        Row: {
          id: string
          restaurant_id: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          reservation_date: string
          reservation_time: string
          number_of_guests: number
          duration: number
          status: ReservationStatus
          source: ReservationSource
          special_requests: string | null
          internal_notes: string | null
          call_id: string | null
          created_at: string
          updated_at: string
          restaurant_name: string
          restaurant_user_id: string
        }
      }
      reservation_stats: {
        Row: {
          restaurant_id: string
          total_reservations: number
          confirmed_count: number
          cancelled_count: number
          no_show_count: number
          completed_count: number
          avg_guests: number
        }
      }
    }
  }
}
