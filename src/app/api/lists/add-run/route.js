import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { list_id, run_id, position } = await req.json();

  const { error } = await supabase.from("list_runs").insert({
    list_id,
    run_id,
    position: position ?? 0,
  });

  if (error) {
    if (error.code === "23505") return Response.json({ error: "Run already in list" }, { status: 409 });
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}