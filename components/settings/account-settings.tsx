"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, logout } from "@/lib/auth/actions";
import { Mail, KeyRound, LogOut } from "lucide-react";

interface AccountSettingsProps {
  email: string;
}

export function AccountSettings({ email }: AccountSettingsProps) {
  const [loading, setLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    const result = await changePassword(formData);
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Mot de passe mis à jour");
    form.reset();
  }

  return (
    <div className="space-y-6">
      {/* Compte */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Compte</h2>
            <p className="text-sm text-muted-foreground">Vos informations de connexion</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Email</Label>
          <Input
            value={email}
            disabled
            className="h-12 rounded-xl border-gray-200 bg-gray-50/50"
          />
        </div>
      </section>

      {/* Mot de passe */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Mot de passe</h2>
            <p className="text-sm text-muted-foreground">Modifiez votre mot de passe</p>
          </div>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Nouveau mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              disabled={loading}
              placeholder="Au moins 8 caractères"
              className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm font-medium">Confirmer le mot de passe</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              disabled={loading}
              className="h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-lg"
          >
            {loading ? "Enregistrement..." : "Mettre à jour"}
          </Button>
        </form>
      </section>

      {/* Déconnexion */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <LogOut className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Déconnexion</h2>
              <p className="text-sm text-muted-foreground">Se déconnecter de cet appareil</p>
            </div>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" className="h-11 px-5 rounded-xl">
              Se déconnecter
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
