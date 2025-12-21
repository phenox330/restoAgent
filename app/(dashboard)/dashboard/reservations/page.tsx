import { ReservationsFilters } from "@/components/reservations/reservations-filters";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { getReservations } from "@/lib/reservations/actions";

interface ReservationsPageProps {
  searchParams: Promise<{
    date?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const params = await searchParams;

  const result = await getReservations({
    date: params.date,
    status: params.status as any,
    search: params.search,
  });

  const reservations = result.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Réservations</h1>
        <p className="text-muted-foreground">
          Gérez toutes vos réservations ({reservations.length})
        </p>
      </div>

      <ReservationsFilters />

      <ReservationsTable reservations={reservations} />
    </div>
  );
}
