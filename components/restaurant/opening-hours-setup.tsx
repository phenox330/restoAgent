"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Calendar, Check, ArrowRight, ArrowLeft, Sun, Moon } from "lucide-react";
import type { OpeningHours, DaySchedule, TimeSlot } from "@/lib/restaurant/schemas";

interface OpeningHoursSetupProps {
  onComplete: (hours: OpeningHours) => void;
  onCancel: () => void;
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

type ServiceType = "lunch" | "dinner" | "both";

export function OpeningHoursSetup({ onComplete, onCancel }: OpeningHoursSetupProps) {
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<ServiceType>("both");
  const [lunchHours, setLunchHours] = useState<TimeSlot>({ start: "12:00", end: "14:30" });
  const [dinnerHours, setDinnerHours] = useState<TimeSlot>({ start: "19:00", end: "22:30" });
  const [closedDays, setClosedDays] = useState<Set<keyof OpeningHours>>(new Set(["sunday"]));

  const toggleClosedDay = (day: keyof OpeningHours) => {
    setClosedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const generateOpeningHours = (): OpeningHours => {
    const hours: OpeningHours = {};

    for (const day of daysOfWeek) {
      if (closedDays.has(day.key)) {
        hours[day.key] = undefined;
      } else {
        const schedule: DaySchedule = {};
        if (serviceType === "lunch" || serviceType === "both") {
          schedule.lunch = { ...lunchHours };
        }
        if (serviceType === "dinner" || serviceType === "both") {
          schedule.dinner = { ...dinnerHours };
        }
        hours[day.key] = schedule;
      }
    }

    return hours;
  };

  const handleComplete = () => {
    onComplete(generateOpeningHours());
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Configuration rapide</h2>
            <p className="text-sm text-muted-foreground">
              Étape {step} sur 3 — {step === 1 ? "Type de service" : step === 2 ? "Horaires" : "Aperçu"}
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Step 1: Service Type */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Quels services proposez-vous ?
            </p>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setServiceType("both")}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                  serviceType === "both"
                    ? "border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex gap-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Sun className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center -ml-3">
                    <Moon className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Midi et Soir</div>
                  <div className="text-sm text-muted-foreground">Service le midi et le soir</div>
                </div>
                {serviceType === "both" && (
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setServiceType("lunch")}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                  serviceType === "lunch"
                    ? "border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Sun className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Midi uniquement</div>
                  <div className="text-sm text-muted-foreground">Service du déjeuner seulement</div>
                </div>
                {serviceType === "lunch" && (
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setServiceType("dinner")}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                  serviceType === "dinner"
                    ? "border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Moon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Soir uniquement</div>
                  <div className="text-sm text-muted-foreground">Service du dîner seulement</div>
                </div>
                {serviceType === "dinner" && (
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Hours & Closed Days */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Hours */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Définissez vos horaires par défaut
              </p>

              {(serviceType === "lunch" || serviceType === "both") && (
                <div className="p-5 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                      <Sun className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-amber-900">Service Midi</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-amber-700 font-medium">Ouverture</Label>
                      <Input
                        type="time"
                        value={lunchHours.start}
                        onChange={(e) => setLunchHours({ ...lunchHours, start: e.target.value })}
                        className="h-12 rounded-xl bg-white border-amber-200 focus:border-amber-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-amber-700 font-medium">Fermeture</Label>
                      <Input
                        type="time"
                        value={lunchHours.end}
                        onChange={(e) => setLunchHours({ ...lunchHours, end: e.target.value })}
                        className="h-12 rounded-xl bg-white border-amber-200 focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(serviceType === "dinner" || serviceType === "both") && (
                <div className="p-5 bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-2xl border border-indigo-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                      <Moon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-indigo-900">Service Soir</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-indigo-700 font-medium">Ouverture</Label>
                      <Input
                        type="time"
                        value={dinnerHours.start}
                        onChange={(e) => setDinnerHours({ ...dinnerHours, start: e.target.value })}
                        className="h-12 rounded-xl bg-white border-indigo-200 focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-indigo-700 font-medium">Fermeture</Label>
                      <Input
                        type="time"
                        value={dinnerHours.end}
                        onChange={(e) => setDinnerHours({ ...dinnerHours, end: e.target.value })}
                        className="h-12 rounded-xl bg-white border-indigo-200 focus:border-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Closed Days */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Jours de fermeture</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleClosedDay(day.key)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      closedDays.has(day.key)
                        ? "bg-red-100 text-red-700 border-2 border-red-300 shadow-sm"
                        : "bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:border-emerald-300"
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Cliquez sur un jour pour le marquer comme fermé (rouge) ou ouvert (vert)
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vérifiez vos horaires avant de valider
            </p>
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="text-left p-4 font-semibold">Jour</th>
                    {(serviceType === "lunch" || serviceType === "both") && (
                      <th className="text-center p-4 font-semibold">
                        <div className="flex items-center justify-center gap-2">
                          <Sun className="h-4 w-4 text-amber-500" />
                          Midi
                        </div>
                      </th>
                    )}
                    {(serviceType === "dinner" || serviceType === "both") && (
                      <th className="text-center p-4 font-semibold">
                        <div className="flex items-center justify-center gap-2">
                          <Moon className="h-4 w-4 text-indigo-500" />
                          Soir
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {daysOfWeek.map((day, index) => (
                    <tr
                      key={day.key}
                      className={`border-t border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="p-4 font-medium">{day.label}</td>
                      {closedDays.has(day.key) ? (
                        <td
                          colSpan={serviceType === "both" ? 2 : 1}
                          className="p-4 text-center"
                        >
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                            Fermé
                          </span>
                        </td>
                      ) : (
                        <>
                          {(serviceType === "lunch" || serviceType === "both") && (
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                                {lunchHours.start} - {lunchHours.end}
                              </span>
                            </td>
                          )}
                          {(serviceType === "dinner" || serviceType === "both") && (
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
                                {dinnerHours.start} - {dinnerHours.end}
                              </span>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between p-6 border-t border-gray-100 bg-gray-50/50">
        <Button
          type="button"
          variant="outline"
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          className="h-11 px-5 rounded-xl"
        >
          {step === 1 ? (
            "Annuler"
          ) : (
            <>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </>
          )}
        </Button>
        <Button
          type="button"
          onClick={step === 3 ? handleComplete : () => setStep(step + 1)}
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
        >
          {step === 3 ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Valider les horaires
            </>
          ) : (
            <>
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
