import { createClient } from "@/lib/supabase/server";
import { UserNav } from "./user-nav";

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
      <div className="flex flex-1 items-center justify-between">
        <div>
          {/* Breadcrumb ou titre de page ici si besoin */}
        </div>
        <UserNav user={user} />
      </div>
    </header>
  );
}
