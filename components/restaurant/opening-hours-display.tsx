"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Pencil, Sun, Moon, Check, X } from "lucide-react";
import type { OpeningHours, DaySchedule, TimeSlot } from "@/lib/restaurant/schemas";

interface OpeningHoursDisplayProps {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
  disabled?: boolean;
  onReset: () => void;
}

const daysOfWeek = [
  { key: "monday" as const, label: "Lundi", short: "Lun" },
  { key: "tuesday" as const, label: "Mardi", short: "Mar" },
  { key: "wednesday" as const, label: "Mercredi", short: "Mer" },
  { key: "thursday" as const, label: "Jeudi", short: "Jeu" },
  { key: "friday" as const, label: "Vendredi", short: "Ven" },
  { key: "saturday" as const, label: "Samedi", short: "Sam" },
  { key: "sunday" as const, label: "Dimanche", short: "Dim" },
];

interface EditDayDialogProps {
  day: { key: keyof OpeningHours; label: string } | null;
  schedule: DaySchedule | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (day: keyof OpeningHours, schedule: DaySchedule | undefined) => void;
}

function EditDayDialog({ day, schedule, open, onOpenChange, onSave }: EditDayDialogProps) {
  const [isClosed, setIsClosed] = useState(false);
  const [hasLunch, setHasLunch] = useState(true);
  const [hasDinner, setHasDinner] = useState(true);
  const [lunchStart, setLunchStart] = useState("12:00");
  const [lunchEnd, setLunchEnd] = useState("14:30");
  const [dinnerStart, setDinnerStart] = useState("19:00");
  const [dinnerEnd, setDinnerEnd] = useState("22:30");

  // Reset state when dialog opens
  useEffect(() => {
    if (open && day) {
      const dayIsClosed = !schedule || (!schedule.lunch && !schedule.dinner);
      setIsClosed(dayIsClosed);

      // If day is closed, default to showing both services for easy configuration
      // If day is open, show the current configuration
      if (dayIsClosed) {
        setHasLunch(true);
        setHasDinner(true);
        setLunchStart("12:00");
        setLunchEnd("14:30");
        setDinnerStart("19:00");
        setDinnerEnd("22:30");
      } else {
        setHasLunch(!!schedule?.lunch);
        setHasDinner(!!schedule?.dinner);
        setLunchStart(schedule?.lunch?.start || "12:00");
        setLunchEnd(schedule?.lunch?.end || "14:30");
        setDinnerStart(schedule?.dinner?.start || "19:00");
        setDinnerEnd(schedule?.dinner?.end || "22:30");
      }
    }
  }, [open, day, schedule]);

  const handleSave = () => {
    if (!day) return;

    if (isClosed) {
      onSave(day.key, undefined);
    } else {
      const newSchedule: DaySchedule = {};
      if (hasLunch) {
        newSchedule.lunch = { start: lunchStart, end: lunchEnd };
      }
      if (hasDinner) {
        newSchedule.dinner = { start: dinnerStart, end: dinnerEnd };
      }
      onSave(day.key, Object.keys(newSchedule).length > 0 ? newSchedule : undefined);
    }
    onOpenChange(false);
  };

  if (!day) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier {day.label}</DialogTitle>
          <DialogDescription>
            Configurez les horaires d&apos;ouverture pour ce jour
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Closed toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label htmlFor="is-closed" className="cursor-pointer">
              Jour de fermeture
            </Label>
            <Switch
              id="is-closed"
              checked={isClosed}
              onCheckedChange={setIsClosed}
            />
          </div>

          {!isClosed && (
            <div className="space-y-4">
              {/* Lunch */}
              <div className={`p-4 rounded-lg border-2 transition-all ${
                hasLunch ? "border-amber-200 bg-amber-50" : "border-muted bg-muted/20"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <Label htmlFor="has-lunch" className="cursor-pointer font-medium">
                      Service Midi
                    </Label>
                  </div>
                  <Switch
                    id="has-lunch"
                    checked={hasLunch}
                    onCheckedChange={setHasLunch}
                  />
                </div>
                {hasLunch && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Ouverture</Label>
                      <Input
                        type="time"
                        value={lunchStart}
                        onChange={(e) => setLunchStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fermeture</Label>
                      <Input
                        type="time"
                        value={lunchEnd}
                        onChange={(e) => setLunchEnd(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dinner */}
              <div className={`p-4 rounded-lg border-2 transition-all ${
                hasDinner ? "border-indigo-200 bg-indigo-50" : "border-muted bg-muted/20"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-500" />
                    <Label htmlFor="has-dinner" className="cursor-pointer font-medium">
                      Service Soir
                    </Label>
                  </div>
                  <Switch
                    id="has-dinner"
                    checked={hasDinner}
                    onCheckedChange={setHasDinner}
                  />
                </div>
                {hasDinner && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Ouverture</Label>
                      <Input
                        type="time"
                        value={dinnerStart}
                        onChange={(e) => setDinnerStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fermeture</Label>
                      <Input
                        type="time"
                        value={dinnerEnd}
                        onChange={(e) => setDinnerEnd(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-1" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OpeningHoursDisplay({ value, onChange, disabled, onReset }: OpeningHoursDisplayProps) {
  const [editingDay, setEditingDay] = useState<{ key: keyof OpeningHours; label: string } | null>(null);

  const handleSaveDay = (day: keyof OpeningHours, schedule: DaySchedule | undefined) => {
    onChange({
      ...value,
      [day]: schedule,
    });
  };

  const formatTime = (slot: TimeSlot | undefined) => {
    if (!slot) return null;
    return `${slot.start} - ${slot.end}`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horaires d&apos;ouverture
              </CardTitle>
              <CardDescription>
                Cliquez sur un jour pour modifier ses horaires
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={disabled}
            >
              Reconfigurer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {daysOfWeek.map((day) => {
              const schedule = value[day.key];
              const isClosed = !schedule || (!schedule.lunch && !schedule.dinner);

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => !disabled && setEditingDay(day)}
                  disabled={disabled}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                    isClosed
                      ? "bg-red-50 border-red-200 hover:border-red-300"
                      : "bg-white border-muted hover:border-primary/50 hover:bg-muted/20"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium w-24">{day.label}</span>
                    {isClosed ? (
                      <span className="text-red-600 text-sm font-medium flex items-center gap-1">
                        <X className="h-4 w-4" />
                        Fermé
                      </span>
                    ) : (
                      <div className="flex items-center gap-4">
                        {schedule?.lunch && (
                          <span className="text-sm flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            <Sun className="h-3 w-3" />
                            {formatTime(schedule.lunch)}
                          </span>
                        )}
                        {schedule?.dinner && (
                          <span className="text-sm flex items-center gap-1 text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                            <Moon className="h-3 w-3" />
                            {formatTime(schedule.dinner)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!disabled && (
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <EditDayDialog
        day={editingDay}
        schedule={editingDay ? value[editingDay.key] : undefined}
        open={!!editingDay}
        onOpenChange={(open) => !open && setEditingDay(null)}
        onSave={handleSaveDay}
      />
    </>
  );
}
