"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { data: result, error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  // Si la confirmation d'email est activée, signUp ne crée pas de session :
  // ne pas rediriger vers le dashboard (l'utilisateur n'est pas connecté),
  // mais demander de confirmer son email.
  if (!result.session) {
    return { needsEmailConfirmation: true, email: data.email };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function changePassword(formData: FormData) {
  const password = formData.get("password") as string;

  if (!password || password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  // Supprime l'utilisateur (cascade vers restaurants/reservations/calls)
  const { error } = await getSupabaseAdmin().auth.admin.deleteUser(user.id);

  if (error) {
    return { error: error.message };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
