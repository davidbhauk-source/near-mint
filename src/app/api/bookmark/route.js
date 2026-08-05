import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { run_id, bookmarked } = await req.json();

  // Check if log row exists
  const { data: existing } = await supabase
    .from("readlogs")
    .select("id")
    .eq("run_id", run_id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Update existing row
    await supabase
      .from("readlogs")
      .update({ bookmarked })
      .eq("run_id", run_id)
      .eq("user_id", user.id);
  } else {
    // Insert new row with just bookmark — no status required
    await supabase
      .from("readlogs")
      .insert({ run_id, user_id: user.id, bookmarked });
  }

  return Response.json({ ok: true });
}