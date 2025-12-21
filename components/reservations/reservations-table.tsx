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
import { ReservationStatusBadge } from "./reservation-status-badge";
import { ReservationActions } from "./reservation-actions";
import type { Reservation } from "@/types";

interface ReservationsTableProps {
  reservations: Reservation[];
}

export function ReservationsTable({ reservations }: ReservationsTableProps) {
  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Aucune réservation trouvée</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
              {reservations.map((reservation) => {
                const date = new Date(reservation.reservation_date);
                const formattedDate = format(date, "EEE dd MMM yyyy", { locale: fr });

                return (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">
                      {formattedDate}
                    </TableCell>
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
                      <ReservationStatusBadge status={reservation.status} />
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
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
