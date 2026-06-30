import { createServerSupabase } from "@/lib/supabase-server";

const ADMIN_ID = "634746c5-efe9-43ea-ba4d-0eea96cb95c7";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== ADMIN_ID) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  await supabase.from("pending_runs").delete().eq("id", id);

  return Response.json({ ok: true });
}