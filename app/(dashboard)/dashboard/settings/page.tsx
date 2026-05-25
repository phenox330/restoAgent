import { createClient } from "@/lib/supabase/server";
import { AccountSettings } from "@/components/settings/account-settings";
import { DangerZone } from "@/components/settings/danger-zone";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre compte</p>
      </div>

      <AccountSettings email={user?.email ?? ""} />
      <DangerZone />
    </div>
  );
}
