"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-dashed border-gray-300 shadow-xl shadow-gray-200/40 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-5">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun horaire configuré</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Définissez rapidement vos horaires d&apos;ouverture et jours de fermeture en quelques clics
          </p>
          <Button
            type="button"
            onClick={() => setShowSetup(true)}
            disabled={disabled}
            className="h-12 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Configurer les horaires
          </Button>
        </div>
      </div>
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
