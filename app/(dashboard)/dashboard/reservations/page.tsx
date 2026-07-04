import { ReservationsFilters } from "@/components/reservations/reservations-filters";
import { ReservationsPageClient } from "@/components/reservations/reservations-page-client";
import { getReservations, getNeedsConfirmationCount, getRestaurantId } from "@/lib/reservations/actions";
import { AlertCircle } from "lucide-react";

interface ReservationsPageProps {
  searchParams: Promise<{
    date?: string;
    status?: string;
    search?: string;
    needs_confirmation?: string;
  }>;
}

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const params = await searchParams;

  const [result, needsConfirmationResult, restaurantId] = await Promise.all([
    getReservations({
      date: params.date,
      status: params.status as any,
      search: params.search,
      needs_confirmation: params.needs_confirmation,
    }),
    getNeedsConfirmationCount(),
    getRestaurantId(),
  ]);

  const reservations = result.data || [];
  const needsConfirmationCount = needsConfirmationResult.count;
  const hasError = Boolean(result.error);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Réservations</h1>
          <p className="text-muted-foreground">
            {hasError
              ? "Impossible de charger vos réservations"
              : `Gérez toutes vos réservations (${reservations.length})`}
          </p>
        </div>

        {/* Badge pour les réservations à confirmer */}
        {needsConfirmationCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-amber-800">
              {needsConfirmationCount} réservation{needsConfirmationCount > 1 ? "s" : ""} à confirmer
            </span>
          </div>
        )}
      </div>

      <ReservationsFilters />

      {hasError ? (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">
            Une erreur est survenue lors du chargement des réservations. Rafraîchissez la page ou réessayez dans un instant.
          </span>
        </div>
      ) : restaurantId ? (
        <ReservationsPageClient
          initialReservations={reservations}
          restaurantId={restaurantId}
        />
      ) : (
        <p className="text-muted-foreground">Aucun restaurant configuré</p>
      )}
    </div>
  );
}
