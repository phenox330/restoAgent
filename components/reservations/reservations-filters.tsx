"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function ReservationsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`/dashboard/reservations?${params.toString()}`);
  }

  const needsConfirmationOnly = searchParams.get("needs_confirmation") === "true";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Recherche */}
          <div className="space-y-2">
            <Label htmlFor="search">Rechercher</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nom, téléphone, email..."
                className="pl-8"
                defaultValue={searchParams.get("search") || ""}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              defaultValue={searchParams.get("date") || ""}
              onChange={(e) => updateFilter("date", e.target.value)}
            />
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              defaultValue={searchParams.get("status") || "all"}
              onValueChange={(value) => updateFilter("status", value === "all" ? "" : value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="no_show">Non présenté</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtre À confirmer */}
          <div className="space-y-2">
            <Label htmlFor="needs_confirmation" className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              À confirmer uniquement
            </Label>
            <div className="flex items-center h-10">
              <Switch
                id="needs_confirmation"
                checked={needsConfirmationOnly}
                onCheckedChange={(checked) =>
                  updateFilter("needs_confirmation", checked ? "true" : "")
                }
              />
              <span className="ml-2 text-sm text-muted-foreground">
                {needsConfirmationOnly ? "Activé" : "Désactivé"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
