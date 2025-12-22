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
export type WaitlistStatus = 'waiting' | 'needs_manager_call' | 'contacted' | 'converted' | 'expired' | 'cancelled'

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
          max_capacity_lunch: number
          max_capacity_dinner: number
          fallback_phone: string | null
          sms_enabled: boolean
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
          max_capacity_lunch?: number
          max_capacity_dinner?: number
          fallback_phone?: string | null
          sms_enabled?: boolean
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
          max_capacity_lunch?: number
          max_capacity_dinner?: number
          fallback_phone?: string | null
          sms_enabled?: boolean
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
          confidence_score: number
          needs_confirmation: boolean
          cancellation_token: string
          reminder_sent_at: string | null
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
          confidence_score?: number
          needs_confirmation?: boolean
          cancellation_token?: string
          reminder_sent_at?: string | null
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
          confidence_score?: number
          needs_confirmation?: boolean
          cancellation_token?: string
          reminder_sent_at?: string | null
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
      waitlist: {
        Row: {
          id: string
          restaurant_id: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          desired_date: string
          desired_time: string | null
          desired_service: 'lunch' | 'dinner' | 'any' | null
          party_size: number
          status: WaitlistStatus
          notes: string | null
          converted_reservation_id: string | null
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
          desired_date: string
          desired_time?: string | null
          desired_service?: 'lunch' | 'dinner' | 'any' | null
          party_size: number
          status?: WaitlistStatus
          notes?: string | null
          converted_reservation_id?: string | null
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
          desired_date?: string
          desired_time?: string | null
          desired_service?: 'lunch' | 'dinner' | 'any' | null
          party_size?: number
          status?: WaitlistStatus
          notes?: string | null
          converted_reservation_id?: string | null
          call_id?: string | null
          created_at?: string
          updated_at?: string
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
          confidence_score: number
          needs_confirmation: boolean
          cancellation_token: string
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
      reservations_needs_confirmation: {
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
          confidence_score: number
          needs_confirmation: boolean
          cancellation_token: string
          created_at: string
          updated_at: string
          restaurant_name: string
          restaurant_user_id: string
        }
      }
      waitlist_active: {
        Row: {
          id: string
          restaurant_id: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          desired_date: string
          desired_time: string | null
          desired_service: 'lunch' | 'dinner' | 'any' | null
          party_size: number
          status: WaitlistStatus
          notes: string | null
          converted_reservation_id: string | null
          call_id: string | null
          created_at: string
          updated_at: string
          restaurant_name: string
          restaurant_user_id: string
        }
      }
    }
    Functions: {
      fuzzy_search_reservations: {
        Args: {
          p_restaurant_id: string
          p_name: string
          p_phone?: string | null
          p_min_similarity?: number
        }
        Returns: {
          id: string
          customer_name: string
          customer_phone: string
          reservation_date: string
          reservation_time: string
          number_of_guests: number
          status: ReservationStatus
          similarity_score: number
        }[]
      }
      check_duplicate_reservation: {
        Args: {
          p_restaurant_id: string
          p_phone: string
          p_date: string
        }
        Returns: {
          id: string
          customer_name: string
          reservation_time: string
          number_of_guests: number
          status: ReservationStatus
        }[]
      }
      get_service_capacity: {
        Args: {
          p_restaurant_id: string
          p_time: string
        }
        Returns: {
          service_type: string
          max_capacity: number
        }[]
      }
      get_service_booked_count: {
        Args: {
          p_restaurant_id: string
          p_date: string
          p_time: string
        }
        Returns: number
      }
      find_alternative_slots: {
        Args: {
          p_restaurant_id: string
          p_date: string
          p_party_size: number
          p_days_ahead?: number
        }
        Returns: {
          available_date: string
          service_type: string
          available_capacity: number
        }[]
      }
    }
  }
}
