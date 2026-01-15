"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Plus } from "lucide-react";
import { OpeningHoursSetup } from "./opening-hours-setup";
import { OpeningHoursDisplay } from "./opening-hours-display";
import type { OpeningHours } from "@/lib/restaurant/schemas";

interface OpeningHoursFormProps {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
  disabled?: boolean;
}

/**
 * Check if opening hours are configured (has at least one day with service)
 */
function hasConfiguredHours(hours: OpeningHours): boolean {
  const days: (keyof OpeningHours)[] = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
  ];

  return days.some((day) => {
    const schedule = hours[day];
    return schedule && (schedule.lunch || schedule.dinner);
  });
}

export function OpeningHoursForm({ value, onChange, disabled }: OpeningHoursFormProps) {
  const isConfigured = hasConfiguredHours(value);
  const [showSetup, setShowSetup] = useState(false);

  // Empty state - show setup button
  if (!isConfigured && !showSetup) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horaires d&apos;ouverture
          </CardTitle>
          <CardDescription>
            Configurez vos horaires de service pour commencer à recevoir des réservations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Aucun horaire configuré</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Définissez rapidement vos horaires d&apos;ouverture et jours de fermeture en quelques clics
            </p>
            <Button
              type="button"
              onClick={() => setShowSetup(true)}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Configurer les horaires
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Setup wizard
  if (showSetup) {
    return (
      <OpeningHoursSetup
        onComplete={(hours) => {
          onChange(hours);
          setShowSetup(false);
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  // Display configured hours
  return (
    <OpeningHoursDisplay
      value={value}
      onChange={onChange}
      disabled={disabled}
      onReset={() => setShowSetup(true)}
    />
  );
}
