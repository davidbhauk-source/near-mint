import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { volume } = await req.json();

  // Check if already in live runs table
  const { data: existing } = await supabase
    .from("runs")
    .select("id")
    .eq("comicvine_id", String(volume.id))
    .single();

  if (existing) {
    return Response.json({ error: "This run is already on Near Mint." }, { status: 409 });
  }

  const { error } = await supabase.from("pending_runs").insert({
  comicvine_id: String(volume.id),
  title: volume.name,
  publisher: volume.publisher?.name ?? null,
  start_year: volume.start_year ? parseInt(volume.start_year) : null,
  issue_count: volume.count_of_issues ?? null,
  cover_url: volume.image?.medium_url ?? null,
  summary: volume.description
    ? volume.description.replace(/<[^>]*>/g, "").slice(0, 1000)
    : null,
  creative_team: volume.creative_team ?? {},  // ← now includes people
  suggested_by: user.id,
});

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "This run has already been suggested and is pending review." }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}