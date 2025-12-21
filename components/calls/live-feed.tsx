"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Clock, FileText, Loader2, PhoneCall, PhoneOff } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Call } from "@/types";

interface LiveFeedProps {
  restaurantId: string;
  initialCalls: Call[];
}

export function LiveFeed({ restaurantId, initialCalls }: LiveFeedProps) {
  const [calls, setCalls] = useState<Call[]>(initialCalls);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Souscrire aux changements en temps réel sur la table calls
    const channel = supabase
      .channel("calls-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calls",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log("📞 Realtime update:", payload);

          if (payload.eventType === "INSERT") {
            setCalls((prev) => [payload.new as Call, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setCalls((prev) =>
              prev.map((call) =>
                call.id === payload.new.id ? (payload.new as Call) : call
              )
            );
          } else if (payload.eventType === "DELETE") {
            setCalls((prev) =>
              prev.filter((call) => call.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <PhoneOff className="h-3 w-3 mr-1" />
            Terminé
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 animate-pulse">
            <PhoneCall className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            Échoué
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Séparer les appels en cours des autres
  const inProgressCalls = calls.filter((c) => c.status === "in_progress");
  const completedCalls = calls.filter((c) => c.status !== "in_progress");

  return (
    <div className="space-y-6">
      {/* Section des appels en cours */}
      {inProgressCalls.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <PhoneCall className="h-5 w-5 animate-pulse" />
              Appels en cours ({inProgressCalls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inProgressCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Phone className="h-5 w-5 text-blue-600 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium">{call.phone_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Commencé{" "}
                        {formatDistanceToNow(new Date(call.started_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-600">En direct</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des appels terminés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Historique des appels
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedCalls.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun appel enregistré
            </p>
          ) : (
            <div className="space-y-3">
              {completedCalls.slice(0, 20).map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-200 rounded-full">
                      <Phone className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono">
                          {call.phone_number}
                        </span>
                        {getStatusBadge(call.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(call.started_at), "d MMM yyyy HH:mm", {
                            locale: fr,
                          })}
                        </span>
                        {call.duration && (
                          <span>Durée: {formatDuration(call.duration)}</span>
                        )}
                      </div>
                      {call.summary && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {call.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bouton pour voir le transcript */}
                  {call.transcript && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCall(call)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Transcript
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Transcript de l'appel - {call.phone_number}
                          </DialogTitle>
                          <DialogDescription>
                            {format(
                              new Date(call.started_at),
                              "EEEE d MMMM yyyy 'à' HH:mm",
                              { locale: fr }
                            )}
                            {call.duration && ` - Durée: ${formatDuration(call.duration)}`}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          {call.summary && (
                            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                              <h4 className="font-medium text-blue-800 mb-1">
                                Résumé
                              </h4>
                              <p className="text-blue-700">{call.summary}</p>
                            </div>
                          )}
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">
                              Transcription complète
                            </h4>
                            <div className="whitespace-pre-wrap text-sm font-mono">
                              {call.transcript}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
