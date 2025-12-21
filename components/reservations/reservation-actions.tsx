"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Check, X, Clock, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  updateReservationStatus,
  deleteReservation,
  confirmReservationManually,
} from "@/lib/reservations/actions";
import type { Reservation } from "@/types";

interface ReservationActionsProps {
  reservation: Reservation;
}

export function ReservationActions({ reservation }: ReservationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  async function handleStatusChange(status: Reservation["status"]) {
    setLoading(true);
    const result = await updateReservationStatus(reservation.id, status);

    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  async function handleConfirmManually() {
    setLoading(true);
    const result = await confirmReservationManually(reservation.id);

    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteReservation(reservation.id);

    if (result.error) {
      alert(result.error);
    } else {
      setDeleteDialogOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  // Vérifier si la réservation nécessite une confirmation
  const needsConfirmation =
    reservation.needs_confirmation &&
    reservation.status !== "cancelled" &&
    reservation.status !== "completed";

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Bouton de confirmation rapide pour les réservations à confirmer */}
        {needsConfirmation && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleConfirmManually}
            disabled={loading}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Valider
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={loading}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Option de confirmation manuelle si nécessaire */}
            {needsConfirmation && (
              <>
                <DropdownMenuItem onClick={handleConfirmManually}>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                  Valider la réservation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {reservation.status === "pending" && !needsConfirmation && (
              <DropdownMenuItem onClick={() => handleStatusChange("confirmed")}>
                <Check className="mr-2 h-4 w-4" />
                Confirmer
              </DropdownMenuItem>
            )}

            {(reservation.status === "pending" || reservation.status === "confirmed") && (
              <>
                <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                  <Clock className="mr-2 h-4 w-4" />
                  Marquer terminée
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("no_show")}>
                  <X className="mr-2 h-4 w-4" />
                  Non présenté
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("cancelled")}>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la réservation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
