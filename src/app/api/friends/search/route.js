import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) return Response.json({ results: [] });

  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .neq("id", user.id)
    .limit(8);

  return Response.json({ results: data ?? [] });
}