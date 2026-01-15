"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ReservationsTable } from "./reservations-table";
import {
  notifyNewReservation,
  notifyReservationUpdated,
} from "@/lib/notifications";
import type { Reservation } from "@/types";

interface ReservationsPageClientProps {
  initialReservations: Reservation[];
  restaurantId: string;
}

export function ReservationsPageClient({
  initialReservations,
  restaurantId,
}: ReservationsPageClientProps) {
  const [reservations, setReservations] =
    useState<Reservation[]>(initialReservations);
  const [newReservationIds, setNewReservationIds] = useState<Set<string>>(
    new Set()
  );

  // Fonction pour retirer le highlight après l'animation
  const removeHighlight = useCallback((id: string) => {
    setTimeout(() => {
      setNewReservationIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 3000);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("reservations-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log("📅 Realtime update:", payload);

          if (payload.eventType === "INSERT") {
            const newReservation = payload.new as Reservation;
            setReservations((prev) => {
              // Éviter les doublons
              if (prev.some((r) => r.id === newReservation.id)) {
                return prev;
              }
              return [newReservation, ...prev];
            });
            // Ajouter le highlight
            setNewReservationIds((prev) => new Set(prev).add(newReservation.id));
            removeHighlight(newReservation.id);
            // Notification toast
            notifyNewReservation(newReservation);
          } else if (payload.eventType === "UPDATE") {
            const updatedReservation = payload.new as Reservation;
            setReservations((prev) =>
              prev.map((r) =>
                r.id === updatedReservation.id ? updatedReservation : r
              )
            );
            // Notification uniquement si le statut a changé
            const oldReservation = payload.old as Partial<Reservation>;
            if (oldReservation.status !== updatedReservation.status) {
              notifyReservationUpdated(updatedReservation);
            }
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as Partial<Reservation>).id;
            if (deletedId) {
              setReservations((prev) => prev.filter((r) => r.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, removeHighlight]);

  // Trier les réservations par date et heure
  const sortedReservations = [...reservations].sort((a, b) => {
    const dateCompare = a.reservation_date.localeCompare(b.reservation_date);
    if (dateCompare !== 0) return dateCompare;
    return a.reservation_time.localeCompare(b.reservation_time);
  });

  return (
    <ReservationsTable
      reservations={sortedReservations}
      newReservationIds={newReservationIds}
    />
  );
}
