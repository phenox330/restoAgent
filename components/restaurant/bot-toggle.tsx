"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { setBotEnabled } from "@/lib/restaurant/actions";
import { Bot, PhoneForwarded } from "lucide-react";

interface BotToggleProps {
  enabled: boolean;
  hasVapiNumber: boolean;
}

export function BotToggle({ enabled, hasVapiNumber }: BotToggleProps) {
  const [checked, setChecked] = useState(enabled);
  const [loading, setLoading] = useState(false);

  async function handleChange(next: boolean) {
    setLoading(true);
    setChecked(next);

    const result = await setBotEnabled(next);
    setLoading(false);

    if (result.error) {
      setChecked(!next);
      toast.error(result.error);
      return;
    }

    toast.success(
      next
        ? "Agent vocal activé — il prend les appels manqués"
        : "Agent vocal désactivé"
    );
  }

  return (
    <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
              checked
                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25"
                : "bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-400/25"
            }`}
          >
            {checked ? (
              <Bot className="h-6 w-6 text-white" />
            ) : (
              <PhoneForwarded className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Agent vocal</h2>
            <p className="text-sm text-muted-foreground">
              {checked
                ? "Répond aux appels manqués et prend les réservations"
                : "Désactivé — les appels manqués ne sont pas pris par l'agent"}
            </p>
          </div>
        </div>

        <Switch
          checked={checked}
          onCheckedChange={handleChange}
          disabled={loading || !hasVapiNumber}
          aria-label="Activer ou désactiver l'agent vocal"
        />
      </div>

      {!hasVapiNumber && (
        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <p className="text-sm text-amber-800">
            Aucun numéro vocal n&apos;est encore lié à votre restaurant.
            Contactez le support pour l&apos;activer.
          </p>
        </div>
      )}

      {hasVapiNumber && (
        <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <p className="text-sm text-blue-800">
            Votre numéro habituel sonne toujours en premier. L&apos;agent ne
            prend que les appels que vous ne décrochez pas (renvoi sur
            non-réponse). Désactivé, ces appels manqués reçoivent un message
            d&apos;indisponibilité.
          </p>
        </div>
      )}
    </section>
  );
}
