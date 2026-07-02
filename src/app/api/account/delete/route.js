import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });

  const adminSupabase = createAdminClient();

  // Delete profile first
  await supabase.from("profiles").delete().eq("id", user.id);

  // Delete the auth user using admin client
  const { error } = await adminSupabase.auth.admin.deleteUser(user.id);

  if (error) return new Response("Failed to delete account", { status: 500 });

  return new Response("OK", { status: 200 });
}