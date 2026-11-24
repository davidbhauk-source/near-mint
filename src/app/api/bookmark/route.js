import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { run_id, bookmarked } = await req.json();

  const { data: existing } = await supabase
    .from("readlogs")
    .select("id, status")
    .eq("run_id", run_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isRealLog = existing && ["Reading", "Complete"].includes(existing.status);
  let error = null;

  if (bookmarked) {
    if (existing) {
      ({ error } = await supabase.from("readlogs").update({ bookmarked: true }).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("readlogs").insert({
        run_id, user_id: user.id, bookmarked: true, status: null,
      }));
    }
  } else if (existing) {
    if (isRealLog) {
      // They've actually logged it, so keep the log and just clear the bookmark
      ({ error } = await supabase.from("readlogs").update({ bookmarked: false }).eq("id", existing.id));
    } else {
      // Bookmark-only row, so remove it entirely
      ({ error } = await supabase.from("readlogs").delete().eq("id", existing.id));
    }
  }

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}