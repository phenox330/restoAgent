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
          vapi_phone_number_id: string | null
          bot_enabled: boolean
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
          vapi_phone_number_id?: string | null
          bot_enabled?: boolean
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
          vapi_phone_number_id?: string | null
          bot_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
          idempotency_key: string | null
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
          idempotency_key?: string | null
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
          idempotency_key?: string | null
          reminder_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      calls: {
        Row: {
          id: string
          restaurant_id: string
          vapi_call_id: string | null
          phone_number: string | null
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
          phone_number?: string | null
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
          phone_number?: string | null
          duration?: number | null
          status?: CallStatus
          transcript?: string | null
          summary?: string | null
          vapi_metadata?: Json | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
      create_reservation_atomic: {
        Args: {
          p_restaurant_id: string
          p_customer_name: string
          p_customer_phone: string
          p_date: string
          p_time: string
          p_number_of_guests: number
          p_customer_email?: string | null
          p_special_requests?: string | null
          p_status?: ReservationStatus
          p_source?: ReservationSource
          p_confidence_score?: number
          p_needs_confirmation?: boolean
          p_call_id?: string | null
          p_idempotency_key?: string | null
          p_capacity_buffer_ratio?: number
        }
        Returns: {
          reservation_id: string
          reservation_cancellation_token: string
          was_created: boolean
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
    Enums: {
      reservation_status: ReservationStatus
      reservation_source: ReservationSource
      call_status: CallStatus
      waitlist_status: WaitlistStatus
      request_type: 'reservation' | 'technical_error' | 'complex_request'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
