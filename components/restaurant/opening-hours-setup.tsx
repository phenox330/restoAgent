"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Configuration rapide des horaires
        </CardTitle>
        <CardDescription>
          Étape {step} sur 3 - {step === 1 ? "Type de service" : step === 2 ? "Horaires" : "Aperçu"}
        </CardDescription>
        {/* Progress bar */}
        <div className="flex gap-1 mt-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Step 1: Service Type */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Quels services proposez-vous ?
            </p>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setServiceType("both")}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                  serviceType === "both"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <div className="flex gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <Moon className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <div className="font-medium">Midi et Soir</div>
                  <div className="text-sm text-muted-foreground">Service le midi et le soir</div>
                </div>
                {serviceType === "both" && (
                  <Check className="h-5 w-5 text-primary ml-auto" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setServiceType("lunch")}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                  serviceType === "lunch"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <Sun className="h-5 w-5 text-amber-500" />
                <div>
                  <div className="font-medium">Midi uniquement</div>
                  <div className="text-sm text-muted-foreground">Service du déjeuner seulement</div>
                </div>
                {serviceType === "lunch" && (
                  <Check className="h-5 w-5 text-primary ml-auto" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setServiceType("dinner")}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                  serviceType === "dinner"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <Moon className="h-5 w-5 text-indigo-500" />
                <div>
                  <div className="font-medium">Soir uniquement</div>
                  <div className="text-sm text-muted-foreground">Service du dîner seulement</div>
                </div>
                {serviceType === "dinner" && (
                  <Check className="h-5 w-5 text-primary ml-auto" />
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
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800">Service Midi</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-amber-700">Ouverture</Label>
                      <Input
                        type="time"
                        value={lunchHours.start}
                        onChange={(e) => setLunchHours({ ...lunchHours, start: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-amber-700">Fermeture</Label>
                      <Input
                        type="time"
                        value={lunchHours.end}
                        onChange={(e) => setLunchHours({ ...lunchHours, end: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(serviceType === "dinner" || serviceType === "both") && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium text-indigo-800">Service Soir</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-indigo-700">Ouverture</Label>
                      <Input
                        type="time"
                        value={dinnerHours.start}
                        onChange={(e) => setDinnerHours({ ...dinnerHours, start: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-indigo-700">Fermeture</Label>
                      <Input
                        type="time"
                        value={dinnerHours.end}
                        onChange={(e) => setDinnerHours({ ...dinnerHours, end: e.target.value })}
                        className="bg-white"
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
                <span className="text-sm text-muted-foreground">Jours de fermeture</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleClosedDay(day.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      closedDays.has(day.key)
                        ? "bg-red-100 text-red-700 border-2 border-red-300"
                        : "bg-green-50 text-green-700 border-2 border-green-200 hover:border-green-300"
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
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Jour</th>
                    {(serviceType === "lunch" || serviceType === "both") && (
                      <th className="text-center p-3 font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <Sun className="h-4 w-4 text-amber-500" />
                          Midi
                        </div>
                      </th>
                    )}
                    {(serviceType === "dinner" || serviceType === "both") && (
                      <th className="text-center p-3 font-medium">
                        <div className="flex items-center justify-center gap-1">
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
                      className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}
                    >
                      <td className="p-3 font-medium">{day.label}</td>
                      {closedDays.has(day.key) ? (
                        <td
                          colSpan={serviceType === "both" ? 2 : 1}
                          className="p-3 text-center text-red-600 font-medium"
                        >
                          Fermé
                        </td>
                      ) : (
                        <>
                          {(serviceType === "lunch" || serviceType === "both") && (
                            <td className="p-3 text-center text-amber-700">
                              {lunchHours.start} - {lunchHours.end}
                            </td>
                          )}
                          {(serviceType === "dinner" || serviceType === "both") && (
                            <td className="p-3 text-center text-indigo-700">
                              {dinnerHours.start} - {dinnerHours.end}
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

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          >
            {step === 1 ? (
              "Annuler"
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Précédent
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={step === 3 ? handleComplete : () => setStep(step + 1)}
          >
            {step === 3 ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Valider
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
