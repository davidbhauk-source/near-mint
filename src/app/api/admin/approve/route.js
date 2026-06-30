import { createServerSupabase } from "@/lib/supabase-server";

const ADMIN_ID = "634746c5-efe9-43ea-ba4d-0eea96cb95c7";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== ADMIN_ID) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { run } = await req.json();

  // Insert into live runs table
  const { error: insertError } = await supabase.from("runs").insert({
    title: run.title,
    publisher: run.publisher,
    start_year: run.start_year,
    end_year: run.end_year ?? null, 
    issue_count: run.issue_count,
    cover_url: run.cover_url,
    summary: run.summary,
    creative_team: run.creative_team ?? {},
    tags: run.tags ?? [],
    comicvine_id: run.comicvine_id ?? null,
  });

console.log("INSERT ERROR:", insertError);  // ← add this

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  // Delete from pending
  await supabase.from("pending_runs").delete().eq("id", run.id);

  return Response.json({ ok: true });
}