"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface ReservationData {
  id: string;
  customer_name: string;
  reservation_date: string;
  reservation_time: string;
  number_of_guests: number;
  status: string;
  restaurant_name: string;
}

type PageState = "loading" | "found" | "cancelled" | "already_cancelled" | "not_found" | "error";

export default function CancelReservationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchReservation();
    }
  }, [token]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/cancel/${token}`);
      const data = await response.json();

      if (response.ok) {
        setReservation(data.reservation);
        if (data.reservation.status === "cancelled") {
          setPageState("already_cancelled");
        } else {
          setPageState("found");
        }
      } else if (response.status === 404) {
        setPageState("not_found");
      } else {
        setError(data.error || "Une erreur est survenue");
        setPageState("error");
      }
    } catch (err) {
      setError("Impossible de charger les informations de la réservation");
      setPageState("error");
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/cancel/${token}`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        setPageState("cancelled");
      } else {
        setError(data.error || "Erreur lors de l'annulation");
        setPageState("error");
      }
    } catch (err) {
      setError("Impossible d'annuler la réservation");
      setPageState("error");
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="mt-4 text-gray-600">Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not found state
  if (pageState === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <CardTitle>Réservation introuvable</CardTitle>
            <CardDescription>
              Ce lien d'annulation n'est pas valide ou a expiré.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <p className="text-sm text-gray-500 text-center">
              Si vous souhaitez annuler votre réservation, veuillez contacter le restaurant directement.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Error state
  if (pageState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <CardTitle>Erreur</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Already cancelled state
  if (pageState === "already_cancelled") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <CardTitle>Réservation déjà annulée</CardTitle>
            <CardDescription>
              Cette réservation a déjà été annulée.
            </CardDescription>
          </CardHeader>
          {reservation && (
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span>{formatDate(reservation.reservation_date)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span>{reservation.reservation_time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span>{reservation.number_of_guests} personne{reservation.number_of_guests > 1 ? "s" : ""}</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // Cancelled state (just cancelled)
  if (pageState === "cancelled") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Réservation annulée</CardTitle>
            <CardDescription>
              Votre réservation a bien été annulée. Nous espérons vous revoir bientôt !
            </CardDescription>
          </CardHeader>
          {reservation && (
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="font-medium text-center text-gray-700">
                  {reservation.restaurant_name}
                </p>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="line-through text-gray-400">
                    {formatDate(reservation.reservation_date)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="line-through text-gray-400">
                    {reservation.reservation_time}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="line-through text-gray-400">
                    {reservation.number_of_guests} personne{reservation.number_of_guests > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // Found state - show reservation details and cancel button
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Annuler ma réservation</CardTitle>
            <Badge variant="secondary">
              {reservation?.status === "confirmed" ? "Confirmée" : "En attente"}
            </Badge>
          </div>
          <CardDescription>
            {reservation?.restaurant_name}
          </CardDescription>
        </CardHeader>
        
        {reservation && (
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="font-medium">
                  {formatDate(reservation.reservation_date)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <span>{reservation.reservation_time}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-400" />
                <span>
                  {reservation.number_of_guests} personne{reservation.number_of_guests > 1 ? "s" : ""}
                </span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  Réservation au nom de <span className="font-medium">{reservation.customer_name}</span>
                </p>
              </div>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex flex-col gap-3">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Annulation en cours...
              </>
            ) : (
              "Confirmer l'annulation"
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Cette action est irréversible. Pour toute question, contactez le restaurant.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
