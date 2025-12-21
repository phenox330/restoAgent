import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCalls } from "@/lib/calls/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Phone, Clock } from "lucide-react";

export default async function CallsPage() {
  const calls = await getCalls();

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Terminé</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">En cours</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Appels</h1>
        <p className="text-muted-foreground">
          Historique des appels de votre agent vocal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des appels</CardTitle>
          <CardDescription>
            {calls.length === 0
              ? "Aucun appel enregistré"
              : `${calls.length} appel${calls.length > 1 ? 's' : ''} enregistré${calls.length > 1 ? 's' : ''}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Phone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucun appel enregistré pour le moment
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Les appels apparaîtront ici automatiquement
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Résumé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(call.started_at), "d MMM yyyy", { locale: fr })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(call.started_at), "HH:mm")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {call.phone_number}
                      </TableCell>
                      <TableCell>
                        {formatDuration(call.duration)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(call.status)}
                      </TableCell>
                      <TableCell className="max-w-md">
                        {call.summary ? (
                          <p className="text-sm text-muted-foreground truncate">
                            {call.summary}
                          </p>
                        ) : call.transcript ? (
                          <p className="text-sm text-muted-foreground truncate">
                            {call.transcript.substring(0, 100)}...
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Pas de résumé
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
