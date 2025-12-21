'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth } from 'date-fns'

export interface DashboardStats {
  todayReservations: number
  monthCalls: number
  confirmationRate: number
  restaurantName: string | null
}

/**
 * Récupère les statistiques du dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  // 1. Récupérer le restaurant de l'utilisateur
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      todayReservations: 0,
      monthCalls: 0,
      confirmationRate: 0,
      restaurantName: null,
    }
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!restaurant) {
    return {
      todayReservations: 0,
      monthCalls: 0,
      confirmationRate: 0,
      restaurantName: null,
    }
  }

  // 2. Réservations du jour (via vue reservations_today)
  const { count: todayReservationsCount } = await supabase
    .from('reservations_today')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant.id)

  // 3. Appels du mois en cours
  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()
  const monthEnd = endOfMonth(now).toISOString()

  const { count: monthCallsCount } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant.id)
    .gte('started_at', monthStart)
    .lte('started_at', monthEnd)

  // 4. Taux de confirmation (via vue reservation_stats)
  const { data: stats } = await supabase
    .from('reservation_stats')
    .select('total_reservations, confirmed_count')
    .eq('restaurant_id', restaurant.id)
    .single()

  const confirmationRate = stats && stats.total_reservations > 0
    ? Math.round((stats.confirmed_count / stats.total_reservations) * 100)
    : 0

  return {
    todayReservations: todayReservationsCount ?? 0,
    monthCalls: monthCallsCount ?? 0,
    confirmationRate,
    restaurantName: restaurant.name,
  }
}
