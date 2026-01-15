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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Réservations</h1>
          <p className="text-muted-foreground">
            Gérez toutes vos réservations ({reservations.length})
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

      {restaurantId ? (
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
