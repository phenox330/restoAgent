import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Phone,
  Store,
  TrendingUp,
  AlertCircle,
  CalendarDays,
  Users,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { getDashboardStats } from "@/lib/dashboard/actions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Récupérer les stats réelles
  const stats = await getDashboardStats();

  // Date du jour pour le lien
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenue, {user?.email}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Réservations du jour
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayReservations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayReservations === 0
                ? "Aucune réservation aujourd&apos;hui"
                : stats.todayReservations === 1
                ? "1 réservation aujourd&apos;hui"
                : `${stats.todayReservations} réservations aujourd&apos;hui`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Appels ce mois-ci
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthCalls}</div>
            <p className="text-xs text-muted-foreground">
              {stats.monthCalls === 0
                ? "Aucun appel ce mois"
                : stats.monthCalls === 1
                ? "1 appel ce mois"
                : `${stats.monthCalls} appels ce mois`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux de confirmation
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmationRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.confirmationRate === 0
                ? "Aucune donnée disponible"
                : `${stats.confirmationRate}% de réservations confirmées`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Restaurant
            </CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.restaurantName ? "✓" : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.restaurantName ? stats.restaurantName : "Non configuré"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerte réservations à confirmer */}
      {stats.needsConfirmationCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  {stats.needsConfirmationCount} réservation{stats.needsConfirmationCount > 1 ? "s" : ""} à confirmer
                </p>
                <p className="text-sm text-amber-600">
                  Ces réservations nécessitent une vérification manuelle
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              <Link href="/dashboard/reservations?needs_confirmation=true">
                Voir les réservations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Éléments non redondants avec la sidebar */}
      <Card>
        <CardHeader>
          <CardTitle>Accès rapide</CardTitle>
          <CardDescription>
            Raccourcis vers les vues les plus utilisées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Réservations du jour */}
            <Link href={`/dashboard/reservations?date=${today}`} className="block">
              <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="p-2 rounded-full bg-blue-100">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Réservations du jour</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.todayReservations > 0
                      ? `${stats.todayReservations} réservation${stats.todayReservations > 1 ? "s" : ""} - ${format(new Date(), "d MMM", { locale: fr })}`
                      : `Aucune pour le ${format(new Date(), "d MMM", { locale: fr })}`}
                  </p>
                </div>
              </div>
            </Link>

            {/* À confirmer */}
            <Link
              href="/dashboard/reservations?needs_confirmation=true"
              className="block"
            >
              <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-full ${stats.needsConfirmationCount > 0 ? "bg-amber-100" : "bg-gray-100"}`}>
                  <AlertCircle className={`h-5 w-5 ${stats.needsConfirmationCount > 0 ? "text-amber-600" : "text-gray-400"}`} />
                </div>
                <div>
                  <p className="font-medium">À confirmer</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.needsConfirmationCount > 0
                      ? `${stats.needsConfirmationCount} réservation${stats.needsConfirmationCount > 1 ? "s" : ""} en attente`
                      : "Aucune vérification requise"}
                  </p>
                </div>
              </div>
            </Link>

            {/* Statistiques / Vue d'ensemble */}
            <Link href="/dashboard/reservations?status=confirmed" className="block">
              <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="p-2 rounded-full bg-green-100">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Réservations confirmées</p>
                  <p className="text-sm text-muted-foreground">
                    Taux de confirmation : {stats.confirmationRate}%
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
