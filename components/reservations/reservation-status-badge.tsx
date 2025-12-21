"use client";

import { Badge } from "@/components/ui/badge";
import type { ReservationStatus } from "@/types";
import { AlertCircle } from "lucide-react";

const statusConfig: Record<
  ReservationStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "En attente", variant: "secondary" },
  confirmed: { label: "Confirmée", variant: "default" },
  completed: { label: "Terminée", variant: "outline" },
  cancelled: { label: "Annulée", variant: "destructive" },
  no_show: { label: "Non présenté", variant: "destructive" },
};

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  needsConfirmation?: boolean;
  confidenceScore?: number;
}

export function ReservationStatusBadge({
  status,
  needsConfirmation = false,
  confidenceScore,
}: ReservationStatusBadgeProps) {
  // Si la réservation nécessite une confirmation manuelle
  if (needsConfirmation && status !== "cancelled" && status !== "completed") {
    return (
      <Badge
        variant="outline"
        className="bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
        title={
          confidenceScore !== undefined
            ? `Score de confiance: ${Math.round(confidenceScore * 100)}%`
            : "Cette réservation nécessite une vérification"
        }
      >
        <AlertCircle className="h-3 w-3 mr-1" />
        À confirmer
      </Badge>
    );
  }

  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Badge compact pour afficher uniquement le score de confiance
 */
export function ConfidenceScoreBadge({
  score,
}: {
  score: number;
}) {
  const percentage = Math.round(score * 100);
  
  let colorClass = "text-green-700 bg-green-50 border-green-300";
  if (score < 0.7) {
    colorClass = "text-amber-700 bg-amber-50 border-amber-300";
  }
  if (score < 0.5) {
    colorClass = "text-red-700 bg-red-50 border-red-300";
  }

  return (
    <Badge
      variant="outline"
      className={`text-xs ${colorClass}`}
      title="Score de confiance de l'IA"
    >
      {percentage}%
    </Badge>
  );
}
