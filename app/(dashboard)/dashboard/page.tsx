import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Phone, Store, TrendingUp } from "lucide-react";
import { getDashboardStats } from "@/lib/dashboard/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Récupérer les stats réelles
  const stats = await getDashboardStats();

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
                ? "Aucune réservation aujourd'hui"
                : stats.todayReservations === 1
                ? "1 réservation aujourd'hui"
                : `${stats.todayReservations} réservations aujourd'hui`}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Commencez par configurer votre restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configuration du restaurant en cours de développement...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
