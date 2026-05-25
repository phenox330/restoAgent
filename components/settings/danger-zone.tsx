"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/lib/auth/actions";
import { AlertTriangle } from "lucide-react";

const CONFIRM_WORD = "SUPPRIMER";

export function DangerZone() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteAccount();
    // En cas de succès, deleteAccount redirige (pas de retour).
    if (result?.error) {
      setLoading(false);
      toast.error(result.error);
    }
  }

  return (
    <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-red-200/60 shadow-xl shadow-red-100/40 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-red-700">Supprimer le compte</h2>
            <p className="text-sm text-muted-foreground">
              Supprime définitivement votre compte, votre restaurant et ses données.
            </p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-11 px-5 rounded-xl border-red-300 text-red-700 hover:bg-red-50">
              Supprimer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle>Supprimer définitivement le compte ?</DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Toutes vos données (restaurant,
                réservations, appels) seront supprimées. Tapez{" "}
                <span className="font-mono font-semibold">{CONFIRM_WORD}</span> pour confirmer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="confirm-delete" className="sr-only">Confirmation</Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRM_WORD}
                  disabled={loading}
                  className="h-12 rounded-xl"
                />
              </div>
              <Button
                onClick={handleDelete}
                disabled={loading || confirmText !== CONFIRM_WORD}
                className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Suppression..." : "Supprimer définitivement"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
