"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Pencil, Sun, Moon, Check, X, RefreshCw } from "lucide-react";
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
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Modifier {day.label}</DialogTitle>
          <DialogDescription>
            Configurez les horaires d&apos;ouverture pour ce jour
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Closed toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isClosed ? "bg-red-100" : "bg-gray-200"
              }`}>
                <X className={`h-5 w-5 ${isClosed ? "text-red-600" : "text-gray-400"}`} />
              </div>
              <Label htmlFor="is-closed" className="cursor-pointer font-medium">
                Jour de fermeture
              </Label>
            </div>
            <Switch
              id="is-closed"
              checked={isClosed}
              onCheckedChange={setIsClosed}
            />
          </div>

          {!isClosed && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              {/* Lunch */}
              <div className={`p-4 rounded-2xl border-2 transition-all ${
                hasLunch
                  ? "border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50"
                  : "border-gray-200 bg-gray-50/50"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      hasLunch ? "bg-amber-500" : "bg-gray-300"
                    }`}>
                      <Sun className={`h-4 w-4 ${hasLunch ? "text-white" : "text-gray-500"}`} />
                    </div>
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
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-amber-700 font-medium">Ouverture</Label>
                      <Input
                        type="time"
                        value={lunchStart}
                        onChange={(e) => setLunchStart(e.target.value)}
                        className="h-11 rounded-xl bg-white border-amber-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-amber-700 font-medium">Fermeture</Label>
                      <Input
                        type="time"
                        value={lunchEnd}
                        onChange={(e) => setLunchEnd(e.target.value)}
                        className="h-11 rounded-xl bg-white border-amber-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dinner */}
              <div className={`p-4 rounded-2xl border-2 transition-all ${
                hasDinner
                  ? "border-indigo-200 bg-gradient-to-r from-indigo-50 to-indigo-100/50"
                  : "border-gray-200 bg-gray-50/50"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      hasDinner ? "bg-indigo-500" : "bg-gray-300"
                    }`}>
                      <Moon className={`h-4 w-4 ${hasDinner ? "text-white" : "text-gray-500"}`} />
                    </div>
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
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-indigo-700 font-medium">Ouverture</Label>
                      <Input
                        type="time"
                        value={dinnerStart}
                        onChange={(e) => setDinnerStart(e.target.value)}
                        className="h-11 rounded-xl bg-white border-indigo-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-indigo-700 font-medium">Fermeture</Label>
                      <Input
                        type="time"
                        value={dinnerEnd}
                        onChange={(e) => setDinnerEnd(e.target.value)}
                        className="h-11 rounded-xl bg-white border-indigo-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-xl"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            className="h-11 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-lg"
          >
            <Check className="h-4 w-4 mr-2" />
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
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Horaires configurés</h2>
              <p className="text-sm text-muted-foreground">
                Cliquez sur un jour pour modifier
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={disabled}
            className="h-9 rounded-xl gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reconfigurer
          </Button>
        </div>

        {/* Days list */}
        <div className="p-4">
          <div className="space-y-2">
            {daysOfWeek.map((day) => {
              const schedule = value[day.key];
              const isClosed = !schedule || (!schedule.lunch && !schedule.dinner);

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => !disabled && setEditingDay(day)}
                  disabled={disabled}
                  className={`flex items-center justify-between w-full p-4 rounded-2xl transition-all text-left group ${
                    isClosed
                      ? "bg-red-50 hover:bg-red-100/80"
                      : "bg-gray-50 hover:bg-gray-100"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold w-28 text-gray-900">{day.label}</span>
                    {isClosed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                        <X className="h-3.5 w-3.5" />
                        Fermé
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {schedule?.lunch && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                            <Sun className="h-3.5 w-3.5" />
                            {formatTime(schedule.lunch)}
                          </span>
                        )}
                        {schedule?.dinner && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
                            <Moon className="h-3.5 w-3.5" />
                            {formatTime(schedule.dinner)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!disabled && (
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

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
