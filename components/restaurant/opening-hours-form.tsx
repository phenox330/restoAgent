"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { OpeningHours, DaySchedule } from "@/lib/restaurant/schemas";

interface OpeningHoursFormProps {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
  disabled?: boolean;
}

const daysOfWeek = [
  { key: "monday" as const, label: "Lundi" },
  { key: "tuesday" as const, label: "Mardi" },
  { key: "wednesday" as const, label: "Mercredi" },
  { key: "thursday" as const, label: "Jeudi" },
  { key: "friday" as const, label: "Vendredi" },
  { key: "saturday" as const, label: "Samedi" },
  { key: "sunday" as const, label: "Dimanche" },
];

export function OpeningHoursForm({ value, onChange, disabled }: OpeningHoursFormProps) {
  const updateDay = (day: keyof OpeningHours, schedule: DaySchedule | undefined) => {
    onChange({
      ...value,
      [day]: schedule,
    });
  };

  const toggleService = (
    day: keyof OpeningHours,
    service: "lunch" | "dinner",
    enabled: boolean
  ) => {
    const currentDay = value[day] || {};
    updateDay(day, {
      ...currentDay,
      [service]: enabled ? { start: "12:00", end: "14:00" } : undefined,
    });
  };

  const updateTime = (
    day: keyof OpeningHours,
    service: "lunch" | "dinner",
    field: "start" | "end",
    time: string
  ) => {
    const currentDay = value[day] || {};
    const currentService = currentDay[service] || { start: "12:00", end: "14:00" };

    updateDay(day, {
      ...currentDay,
      [service]: {
        ...currentService,
        [field]: time,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horaires d&apos;ouverture</CardTitle>
        <CardDescription>
          Configurez vos horaires de service (midi et/ou soir)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {daysOfWeek.map((day, index) => {
          const daySchedule = value[day.key] || {};
          const hasLunch = !!daySchedule.lunch;
          const hasDinner = !!daySchedule.dinner;

          return (
            <div key={day.key}>
              {index > 0 && <Separator className="mb-6" />}
              <div className="space-y-4">
                <h4 className="font-medium">{day.label}</h4>

                {/* Service midi */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${day.key}-lunch`}>Service midi</Label>
                    <Switch
                      id={`${day.key}-lunch`}
                      checked={hasLunch}
                      onCheckedChange={(checked) =>
                        toggleService(day.key, "lunch", checked)
                      }
                      disabled={disabled}
                    />
                  </div>

                  {hasLunch && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Ouverture</Label>
                        <Input
                          type="time"
                          value={daySchedule.lunch?.start || "12:00"}
                          onChange={(e) =>
                            updateTime(day.key, "lunch", "start", e.target.value)
                          }
                          disabled={disabled}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Fermeture</Label>
                        <Input
                          type="time"
                          value={daySchedule.lunch?.end || "14:00"}
                          onChange={(e) =>
                            updateTime(day.key, "lunch", "end", e.target.value)
                          }
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Service soir */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${day.key}-dinner`}>Service soir</Label>
                    <Switch
                      id={`${day.key}-dinner`}
                      checked={hasDinner}
                      onCheckedChange={(checked) =>
                        toggleService(day.key, "dinner", checked)
                      }
                      disabled={disabled}
                    />
                  </div>

                  {hasDinner && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Ouverture</Label>
                        <Input
                          type="time"
                          value={daySchedule.dinner?.start || "19:00"}
                          onChange={(e) =>
                            updateTime(day.key, "dinner", "start", e.target.value)
                          }
                          disabled={disabled}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Fermeture</Label>
                        <Input
                          type="time"
                          value={daySchedule.dinner?.end || "22:00"}
                          onChange={(e) =>
                            updateTime(day.key, "dinner", "end", e.target.value)
                          }
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
