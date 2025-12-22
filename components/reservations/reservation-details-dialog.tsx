"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Users,
  Timer,
  MessageSquare,
  FileText,
  PhoneCall,
  TrendingUp,
  CalendarClock,
  Pencil,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { ReservationStatusBadge, ConfidenceScoreBadge } from "./reservation-status-badge";
import { updateReservation } from "@/lib/reservations/actions";
import type { Reservation } from "@/types";

interface ReservationDetailsDialogProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReservationDetailsDialog({
  reservation,
  open,
  onOpenChange,
}: ReservationDetailsDialogProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États du formulaire d'édition
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editGuests, setEditGuests] = useState(0);
  const [editInternalNotes, setEditInternalNotes] = useState("");

  if (!reservation) return null;

  const date = new Date(reservation.reservation_date);
  const formattedDate = format(date, "EEEE d MMMM yyyy", { locale: fr });
  const createdAt = new Date(reservation.created_at);
  const updatedAt = new Date(reservation.updated_at);

  const handleStartEdit = () => {
    setEditDate(reservation.reservation_date);
    setEditTime(reservation.reservation_time.slice(0, 5)); // Format HH:mm
    setEditGuests(reservation.number_of_guests);
    setEditInternalNotes(reservation.internal_notes || "");
    setError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const result = await updateReservation(reservation.id, {
      reservation_date: editDate,
      reservation_time: editTime,
      number_of_guests: editGuests,
      internal_notes: editInternalNotes || null,
    });

    setIsSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setIsEditing(false);
      router.refresh();
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <DialogTitle>
            {isEditing ? "Modifier la réservation" : "Détails de la réservation"}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <ReservationStatusBadge
              status={reservation.status}
              needsConfirmation={reservation.needs_confirmation}
              confidenceScore={reservation.confidence_score}
            />
            <DialogDescription className="!mt-0">
              #{reservation.id.slice(0, 8)}
            </DialogDescription>
          </div>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4 mt-4">
          {/* Informations client (lecture seule) */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
              Informations client
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{reservation.customer_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <a
                  href={`tel:${reservation.customer_phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {reservation.customer_phone}
                </a>
              </div>
              {reservation.customer_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a
                    href={`mailto:${reservation.customer_email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {reservation.customer_email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Détails réservation (éditable) */}
          {isEditing ? (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                Détails réservation
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Date
                  </Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    Heure
                  </Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-guests" className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    Couverts
                  </Label>
                  <Input
                    id="edit-guests"
                    type="number"
                    min={1}
                    max={50}
                    value={editGuests}
                    onChange={(e) => setEditGuests(parseInt(e.target.value) || 1)}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Timer className="h-4 w-4 text-gray-400" />
                  <span>{reservation.duration} minutes</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                Détails réservation
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="capitalize">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{reservation.reservation_time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>
                    {reservation.number_of_guests} personne
                    {reservation.number_of_guests > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Timer className="h-4 w-4 text-gray-400" />
                  <span>{reservation.duration} minutes</span>
                </div>
              </div>
            </div>
          )}

          {/* Demandes spéciales (lecture seule) */}
          {reservation.special_requests && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm text-amber-700 uppercase tracking-wide flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Demandes spéciales
              </h4>
              <p className="text-amber-900">{reservation.special_requests}</p>
            </div>
          )}

          {/* Notes internes (éditable) */}
          {isEditing ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <Label
                htmlFor="edit-notes"
                className="font-medium text-sm text-blue-700 uppercase tracking-wide flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Notes internes
              </Label>
              <Textarea
                id="edit-notes"
                placeholder="Ajouter des notes internes..."
                value={editInternalNotes}
                onChange={(e) => setEditInternalNotes(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
            </div>
          ) : (
            reservation.internal_notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm text-blue-700 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes internes
                </h4>
                <p className="text-blue-900">{reservation.internal_notes}</p>
              </div>
            )
          )}

          {/* Métadonnées (lecture seule, masqué en édition) */}
          {!isEditing && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                Informations complémentaires
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-2">
                    <PhoneCall className="h-4 w-4" />
                    Source
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {reservation.source === "phone" && "Téléphone"}
                    {reservation.source === "web" && "Web"}
                    {reservation.source === "manual" && "Manuel"}
                  </Badge>
                </div>

                {reservation.confidence_score !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Score de confiance IA
                    </span>
                    <ConfidenceScoreBadge score={reservation.confidence_score} />
                  </div>
                )}

                {reservation.call_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Appel associé
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-600"
                      onClick={() => {
                        window.location.href = `/dashboard/calls?callId=${reservation.call_id}`;
                      }}
                    >
                      Voir l&apos;appel
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500 flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Créée le
                  </span>
                  <span className="text-gray-700">
                    {format(createdAt, "d MMM yyyy 'à' HH:mm", { locale: fr })}
                  </span>
                </div>

                {updatedAt.getTime() !== createdAt.getTime() && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Modifiée le</span>
                    <span className="text-gray-700">
                      {format(updatedAt, "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-4">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Fermer
              </Button>
              <Button onClick={handleStartEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
