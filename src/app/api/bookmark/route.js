import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { run_id, bookmarked } = await req.json();

  const { error } = await supabase
    .from("readlogs")
    .upsert(
      { run_id, user_id: user.id, bookmarked },
      { onConflict: "run_id,user_id" }
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}