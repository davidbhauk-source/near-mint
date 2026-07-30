import { createServerSupabase } from "@/lib/supabase-server";


export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { run_id, review_text, contains_spoilers, review_type, issue_start, issue_end, score } = await req.json();

  console.log("REVIEW CREATE BODY:", { run_id, review_text, score }); // ← add this

  if (!review_text?.trim()) {
    return Response.json({ error: "Review text is required" }, { status: 400 });
  }

  const { error } = await supabase.from("reviews").insert({
    run_id,
    user_id: user.id,
    review_text: review_text.trim(),
    contains_spoilers: contains_spoilers ?? false,
    review_type: review_type ?? "run",
    issue_start: issue_start ?? null,
    issue_end: issue_end ?? null,
    score: score ?? null,
  });

  if (error) {
    console.error("REVIEW CREATE ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}