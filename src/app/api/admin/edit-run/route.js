import { createServerSupabase } from "@/lib/supabase-server";

const ADMIN_ID = "634746c5-efe9-43ea-ba4d-0eea96cb95c7";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== ADMIN_ID) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { error } = await supabase
    .from("runs")
    .update({
      title: body.title,
      publisher: body.publisher,
      start_year: body.start_year,
      end_year: body.end_year,
      issue_count: body.issue_count,
      summary: body.summary,
      creative_team: body.creative_team,
      tags: body.tags,
    })
    .eq("id", body.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}