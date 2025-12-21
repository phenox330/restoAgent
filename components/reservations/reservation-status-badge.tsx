import { Badge } from "@/components/ui/badge";
import type { ReservationStatus } from "@/types";

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
}

export function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
