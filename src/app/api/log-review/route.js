import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { run_id, status, issues_read, score } = body;
  
  console.log("LOG BODY:", { run_id, status, issues_read, score }); // ← add this

  const { error: logError } = await supabase
    .from("readlogs")
    .upsert(
      { run_id, user_id: user.id, status, issues_read, score },
      { onConflict: "run_id,user_id" }
    );

  if (logError) {
    console.error("LOG ERROR:", logError);
    return new Response("Failed to save log", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}