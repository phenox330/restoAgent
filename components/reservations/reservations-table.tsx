import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ReservationStatusBadge, ConfidenceScoreBadge } from "./reservation-status-badge";
import { ReservationActions } from "./reservation-actions";
import type { Reservation } from "@/types";
import { AlertCircle } from "lucide-react";

interface ReservationsTableProps {
  reservations: Reservation[];
  showConfidenceScore?: boolean;
}

export function ReservationsTable({
  reservations,
  showConfidenceScore = false,
}: ReservationsTableProps) {
  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Aucune réservation trouvée</p>
        </CardContent>
      </Card>
    );
  }

  // Séparer les réservations à confirmer des autres
  const needsConfirmationReservations = reservations.filter(
    (r) => r.needs_confirmation && r.status !== "cancelled" && r.status !== "completed"
  );
  const otherReservations = reservations.filter(
    (r) => !r.needs_confirmation || r.status === "cancelled" || r.status === "completed"
  );

  return (
    <div className="space-y-6">
      {/* Section des réservations à confirmer */}
      {needsConfirmationReservations.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">
                À confirmer ({needsConfirmationReservations.length})
              </h3>
              <span className="text-sm text-amber-600">
                Ces réservations nécessitent une vérification manuelle
              </span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Heure</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Couverts</TableHead>
                    <TableHead>Confiance</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {needsConfirmationReservations.map((reservation) => (
                    <ReservationRow
                      key={reservation.id}
                      reservation={reservation}
                      showConfidenceScore={true}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau principal */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Couverts</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(needsConfirmationReservations.length > 0
                  ? otherReservations
                  : reservations
                ).map((reservation) => (
                  <ReservationRow
                    key={reservation.id}
                    reservation={reservation}
                    showConfidenceScore={showConfidenceScore}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ReservationRowProps {
  reservation: Reservation;
  showConfidenceScore?: boolean;
}

function ReservationRow({
  reservation,
  showConfidenceScore = false,
}: ReservationRowProps) {
  const date = new Date(reservation.reservation_date);
  const formattedDate = format(date, "EEE dd MMM yyyy", { locale: fr });

  return (
    <TableRow>
      <TableCell className="font-medium">{formattedDate}</TableCell>
      <TableCell>{reservation.reservation_time}</TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{reservation.customer_name}</div>
          {reservation.customer_email && (
            <div className="text-sm text-muted-foreground">
              {reservation.customer_email}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>{reservation.customer_phone}</TableCell>
      <TableCell>{reservation.number_of_guests}</TableCell>
      <TableCell>
        {showConfidenceScore && reservation.confidence_score !== undefined ? (
          <ConfidenceScoreBadge score={reservation.confidence_score} />
        ) : (
          <ReservationStatusBadge
            status={reservation.status}
            needsConfirmation={reservation.needs_confirmation}
            confidenceScore={reservation.confidence_score}
          />
        )}
      </TableCell>
      <TableCell className="capitalize">
        {reservation.source === "phone" && "Téléphone"}
        {reservation.source === "web" && "Web"}
        {reservation.source === "manual" && "Manuel"}
      </TableCell>
      <TableCell className="text-right">
        <ReservationActions reservation={reservation} />
      </TableCell>
    </TableRow>
  );
}
