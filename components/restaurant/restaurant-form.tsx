"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createRestaurant, updateRestaurant } from "@/lib/restaurant/actions";
import { OpeningHoursForm } from "./opening-hours-form";
import { Phone, MessageSquare, Users } from "lucide-react";
import type { Restaurant } from "@/types";
import type { OpeningHours } from "@/lib/restaurant/schemas";

interface RestaurantFormProps {
  restaurant?: Restaurant;
}

export function RestaurantForm({ restaurant }: RestaurantFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(
    (restaurant?.opening_hours as OpeningHours) || {}
  );
  const [smsEnabled, setSmsEnabled] = useState(restaurant?.sms_enabled ?? true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      max_capacity: parseInt(formData.get("max_capacity") as string),
      max_capacity_lunch: parseInt(formData.get("max_capacity_lunch") as string),
      max_capacity_dinner: parseInt(formData.get("max_capacity_dinner") as string),
      fallback_phone: formData.get("fallback_phone") as string || null,
      sms_enabled: smsEnabled,
      default_reservation_duration: parseInt(formData.get("default_reservation_duration") as string),
      opening_hours: openingHours,
      closed_dates: [],
    };

    const result = restaurant
      ? await updateRestaurant(restaurant.id, data)
      : await createRestaurant(data);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>
            Les informations principales de votre restaurant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du restaurant *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={restaurant?.name}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone principal *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={restaurant?.phone}
                placeholder="+33 1 23 45 67 89"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={restaurant?.email || ""}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                name="address"
                defaultValue={restaurant?.address || ""}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacité par service */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Capacité par service
          </CardTitle>
          <CardDescription>
            Définissez la capacité maximale pour chaque service (midi et soir)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="max_capacity">Capacité totale *</Label>
              <Input
                id="max_capacity"
                name="max_capacity"
                type="number"
                min="1"
                max="1000"
                defaultValue={restaurant?.max_capacity || 50}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Capacité globale du restaurant
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_capacity_lunch">Capacité midi *</Label>
              <Input
                id="max_capacity_lunch"
                name="max_capacity_lunch"
                type="number"
                min="1"
                max="1000"
                defaultValue={restaurant?.max_capacity_lunch || 25}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Couverts max pour le service du midi
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_capacity_dinner">Capacité soir *</Label>
              <Input
                id="max_capacity_dinner"
                name="max_capacity_dinner"
                type="number"
                min="1"
                max="1000"
                defaultValue={restaurant?.max_capacity_dinner || 50}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Couverts max pour le service du soir
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_reservation_duration">Durée réservation (min) *</Label>
            <Input
              id="default_reservation_duration"
              name="default_reservation_duration"
              type="number"
              min="15"
              max="480"
              step="15"
              defaultValue={restaurant?.default_reservation_duration || 90}
              required
              disabled={loading}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Durée par défaut d&apos;une réservation en minutes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transfert et notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Transfert et notifications
          </CardTitle>
          <CardDescription>
            Configuration du transfert vers humain et des SMS de confirmation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fallback_phone">Numéro de transfert</Label>
            <Input
              id="fallback_phone"
              name="fallback_phone"
              type="tel"
              defaultValue={restaurant?.fallback_phone || restaurant?.phone || ""}
              placeholder="+33 1 23 45 67 89"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Numéro vers lequel transférer l&apos;appel en cas de besoin (groupes &gt; 8 personnes, incompréhension, demande explicite).
              Si vide, le téléphone principal sera utilisé.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <div>
                <Label htmlFor="sms_enabled" className="cursor-pointer">
                  SMS de confirmation
                </Label>
                <p className="text-xs text-muted-foreground">
                  Envoyer automatiquement un SMS de confirmation avec lien d&apos;annulation
                </p>
              </div>
            </div>
            <Switch
              id="sms_enabled"
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
              disabled={loading}
            />
          </div>

          {smsEnabled && (
            <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-800 mb-1">Configuration Twilio requise</p>
              <p className="text-blue-700">
                Pour activer les SMS, configurez les variables d&apos;environnement:
                <code className="block mt-1 text-xs bg-blue-100 p-1 rounded">
                  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
                </code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Horaires d'ouverture */}
      <OpeningHoursForm
        value={openingHours}
        onChange={setOpeningHours}
        disabled={loading}
      />

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : restaurant ? "Mettre à jour" : "Créer"}
        </Button>
      </div>
    </form>
  );
}
