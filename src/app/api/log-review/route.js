import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req) {
  const supabase = await createServerSupabase();

  // Get real logged in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { run_id, status, issues_read, rating, review_text, contains_spoilers } = body;

  const { error: logError } = await supabase
    .from("readlogs")
    .upsert(
      { run_id, user_id: user.id, status, issues_read },
      { onConflict: "run_id,user_id" }
    );

  if (logError) {
    console.error("LOG ERROR:", logError);
    return new Response("Failed to save log", { status: 500 });
  }

  if (rating || review_text) {
    const { error: reviewError } = await supabase
      .from("reviews")
      .upsert(
        { run_id, user_id: user.id, rating, review_text, contains_spoilers },
        { onConflict: "run_id,user_id" }
      );

    if (reviewError) {
      console.error("REVIEW ERROR:", reviewError);
      return new Response("Failed to save review", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}