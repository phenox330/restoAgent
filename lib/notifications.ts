import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Reservation } from "@/types";

/**
 * Toast pour une nouvelle réservation
 */
export function notifyNewReservation(reservation: Reservation) {
  const date = format(new Date(reservation.reservation_date), "d MMM", {
    locale: fr,
  });

  toast.info(`Nouvelle réservation: ${reservation.customer_name}`, {
    description: `${reservation.number_of_guests} pers. - ${date} à ${reservation.reservation_time}`,
  });

  // Si demande spéciale, afficher un toast warning supplémentaire
  if (reservation.special_requests) {
    setTimeout(() => {
      notifySpecialRequest(reservation);
    }, 500);
  }

  // Si nécessite confirmation, afficher un toast warning
  if (reservation.needs_confirmation) {
    setTimeout(() => {
      notifyNeedsConfirmation(reservation);
    }, 1000);
  }
}

/**
 * Toast pour une demande spéciale
 */
export function notifySpecialRequest(reservation: Reservation) {
  if (!reservation.special_requests) return;

  toast.warning(`Demande spéciale: ${reservation.customer_name}`, {
    description: reservation.special_requests,
    duration: 10000,
  });
}

/**
 * Toast pour une réservation nécessitant confirmation
 */
export function notifyNeedsConfirmation(reservation: Reservation) {
  const score = Math.round((reservation.confidence_score || 0) * 100);

  toast.warning(`À confirmer: ${reservation.customer_name}`, {
    description: `Score de confiance: ${score}%`,
    duration: 10000,
  });
}

/**
 * Toast pour une mise à jour de réservation
 */
export function notifyReservationUpdated(reservation: Reservation) {
  toast.info(`Réservation mise à jour: ${reservation.customer_name}`, {
    description: `Statut: ${getStatusLabel(reservation.status)}`,
  });
}

/**
 * Toast de succès pour confirmation
 */
export function notifyConfirmationSuccess() {
  toast.success("Réservation confirmée");
}

/**
 * Toast de succès pour annulation
 */
export function notifyCancellationSuccess() {
  toast.success("Réservation annulée");
}

/**
 * Toast de succès pour suppression
 */
export function notifyDeletionSuccess() {
  toast.success("Réservation supprimée");
}

/**
 * Toast d'erreur
 */
export function notifyError(message: string) {
  toast.error("Erreur", {
    description: message,
  });
}

/**
 * Convertit le statut en label français
 */
function getStatusLabel(status: Reservation["status"]): string {
  const labels: Record<Reservation["status"], string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    completed: "Terminée",
    cancelled: "Annulée",
    no_show: "Non présenté",
  };
  return labels[status] || status;
}
