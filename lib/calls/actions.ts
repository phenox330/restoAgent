'use server'

import { createClient } from '@/lib/supabase/server'
import type { Call } from '@/types'

export interface CallsResult {
  calls: Call[]
  restaurantId: string | null
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

/**
 * Récupère les appels et l'ID du restaurant (pour le composant realtime)
 */
export async function getCallsWithRestaurantId(): Promise<CallsResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { calls: [], restaurantId: null }
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!restaurant) {
    return { calls: [], restaurantId: null }
  }

  const { data: calls, error } = await supabase
    .from('calls')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('started_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching calls:', error)
    return { calls: [], restaurantId: restaurant.id }
  }

  return {
    calls: calls || [],
    restaurantId: restaurant.id,
  }
}

/**
 * Récupère le nombre d'appels en cours
 */
export async function getInProgressCallsCount(): Promise<number> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return 0
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!restaurant) {
    return 0
  }

  const { count, error } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant.id)
    .eq('status', 'in_progress')

  if (error) {
    return 0
  }

  return count || 0
}
