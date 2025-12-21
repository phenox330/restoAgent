"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createRestaurant, updateRestaurant } from "@/lib/restaurant/actions";
import { OpeningHoursForm } from "./opening-hours-form";
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
              <Label htmlFor="phone">Téléphone *</Label>
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

      {/* Paramètres */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres</CardTitle>
          <CardDescription>
            Configuration de la capacité et des réservations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max_capacity">Capacité maximale *</Label>
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
                Nombre maximum de couverts par service
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_reservation_duration">Durée par défaut (min) *</Label>
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
              />
              <p className="text-xs text-muted-foreground">
                Durée par défaut d&apos;une réservation
              </p>
            </div>
          </div>
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
