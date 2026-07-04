import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { following_id } = await req.json();

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}