'use server'

import { createClient } from '@/lib/supabase/server'

export interface Call {
  id: string
  vapi_call_id: string | null
  phone_number: string
  duration: number | null
  status: 'in_progress' | 'completed' | 'failed'
  transcript: string | null
  summary: string | null
  started_at: string
  ended_at: string | null
}

/**
 * Récupère tous les appels du restaurant
 */
export async function getCalls(): Promise<Call[]> {
  const supabase = await createClient()

  // Récupérer le restaurant de l'utilisateur
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!restaurant) {
    return []
  }

  // Récupérer les appels, triés par date (plus récent en premier)
  const { data: calls, error } = await supabase
    .from('calls')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching calls:', error)
    return []
  }

  return calls || []
}
