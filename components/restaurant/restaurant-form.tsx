"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createRestaurant, updateRestaurant } from "@/lib/restaurant/actions";
import { OpeningHoursForm } from "./opening-hours-form";
import {
  Phone,
  MessageSquare,
  Users,
  MapPin,
  Mail,
  Building2,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { Restaurant } from "@/types";
import type { OpeningHours } from "@/lib/restaurant/schemas";

interface RestaurantFormProps {
  restaurant?: Restaurant;
}

export function RestaurantForm({ restaurant }: RestaurantFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(
    (restaurant?.opening_hours as OpeningHours) || {}
  );
  const [smsEnabled, setSmsEnabled] = useState(restaurant?.sms_enabled ?? true);

  const isNewRestaurant = !restaurant;

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
      fallback_phone: (formData.get("fallback_phone") as string) || null,
      sms_enabled: smsEnabled,
      default_reservation_duration: parseInt(
        formData.get("default_reservation_duration") as string
      ),
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
      setLoading(false);
      setShowSuccess(true);
    }
  }

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.refresh();
  };

  const handleGoToDashboard = () => {
    setShowSuccess(false);
    router.push("/dashboard");
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sticky Header with Save Button */}
        <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 -mt-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {restaurant ? "Modifiez les informations ci-dessous" : "Remplissez les informations pour créer votre restaurant"}
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-6 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-lg shadow-gray-900/25 transition-all hover:shadow-xl hover:shadow-gray-900/30"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </span>
              ) : restaurant ? (
                "Mettre à jour"
              ) : (
                <span className="flex items-center gap-2">
                  Créer
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            {error}
          </div>
        )}

        {/* Section 1: Informations générales */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Informations générales
              </h2>
              <p className="text-sm text-muted-foreground">
                Les informations principales de votre établissement
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nom du restaurant
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={restaurant?.name}
                  required
                  disabled={loading}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
                  placeholder="Le Petit Bistrot"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Téléphone principal
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={restaurant?.phone}
                  placeholder="+33 1 23 45 67 89"
                  required
                  disabled={loading}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={restaurant?.email || ""}
                  disabled={loading}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
                  placeholder="contact@restaurant.fr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Adresse
                </Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={restaurant?.address || ""}
                  disabled={loading}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
                  placeholder="123 Rue de Paris, 75001"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Capacité */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Capacité</h2>
              <p className="text-sm text-muted-foreground">
                Définissez le nombre de couverts par service
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-6">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="max_capacity" className="text-sm font-medium">
                  Capacité totale
                </Label>
                <Input
                  id="max_capacity"
                  name="max_capacity"
                  type="number"
                  min="1"
                  max="1000"
                  defaultValue={restaurant?.max_capacity || 50}
                  required
                  disabled={loading}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
                />
                <p className="text-xs text-muted-foreground">
                  Capacité globale
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_capacity_lunch" className="text-sm font-medium">
                  Capacité midi
                </Label>
                <Input
                  id="max_capacity_lunch"
                  name="max_capacity_lunch"
                  type="number"
                  min="1"
                  max="1000"
                  defaultValue={restaurant?.max_capacity_lunch || 25}
                  required
                  disabled={loading}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
                />
                <p className="text-xs text-muted-foreground">Service du midi</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_capacity_dinner" className="text-sm font-medium">
                  Capacité soir
                </Label>
                <Input
                  id="max_capacity_dinner"
                  name="max_capacity_dinner"
                  type="number"
                  min="1"
                  max="1000"
                  defaultValue={restaurant?.max_capacity_dinner || 50}
                  required
                  disabled={loading}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
                />
                <p className="text-xs text-muted-foreground">Service du soir</p>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="default_reservation_duration" className="text-sm font-medium">
                    Durée de réservation par défaut
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Temps moyen passé à table par client
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                    className="h-12 w-24 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors text-center"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Notifications */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Transfert et notifications
              </h2>
              <p className="text-sm text-muted-foreground">
                Configuration des appels et SMS
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fallback_phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Numéro de transfert
              </Label>
              <Input
                id="fallback_phone"
                name="fallback_phone"
                type="tel"
                defaultValue={restaurant?.fallback_phone || restaurant?.phone || ""}
                placeholder="+33 1 23 45 67 89"
                disabled={loading}
                className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
              />
              <p className="text-xs text-muted-foreground">
                Numéro vers lequel transférer l&apos;appel (groupes &gt; 8
                personnes, demande explicite)
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <Label htmlFor="sms_enabled" className="cursor-pointer font-medium">
                    SMS de confirmation
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Envoi automatique avec lien d&apos;annulation
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
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2">
                <p className="text-sm font-medium text-blue-800 mb-1">
                  Configuration Twilio requise
                </p>
                <p className="text-xs text-blue-600">
                  Variables d&apos;environnement: TWILIO_ACCOUNT_SID,
                  TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Section 4: Horaires */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Horaires d&apos;ouverture
              </h2>
              <p className="text-sm text-muted-foreground">
                Définissez vos jours et heures de service
              </p>
            </div>
          </div>

          <OpeningHoursForm
            value={openingHours}
            onChange={setOpeningHours}
            disabled={loading}
          />
        </section>

      </form>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
          <div className="flex flex-col items-center text-center py-6">
            {/* Animated Success Icon */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
              </div>
            </div>

            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-semibold">
                {isNewRestaurant ? "Restaurant créé !" : "Modifications enregistrées"}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground max-w-sm">
                {isNewRestaurant
                  ? "Votre restaurant est maintenant configuré et prêt à recevoir des réservations via l'agent vocal."
                  : "Les informations de votre restaurant ont été mises à jour avec succès."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 w-full mt-8">
              <Button
                onClick={handleGoToDashboard}
                className="h-12 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-lg"
              >
                <span className="flex items-center gap-2">
                  Aller au tableau de bord
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
              <Button
                variant="ghost"
                onClick={handleSuccessClose}
                className="h-12 rounded-xl text-muted-foreground hover:text-foreground"
              >
                Rester sur cette page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
