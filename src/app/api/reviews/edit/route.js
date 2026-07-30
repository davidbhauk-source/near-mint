import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { review_id, review_text, contains_spoilers, review_type, issue_start, issue_end, score } = await req.json();

  const { error } = await supabase
    .from("reviews")
    .update({ review_text, contains_spoilers, review_type, issue_start, issue_end, score })
    .eq("id", review_id)
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}