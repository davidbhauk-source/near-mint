import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { list_id, title, description, is_ranked, is_public } = await req.json();

  const { error } = await supabase
    .from("lists")
    .update({ title: title.trim(), description: description?.trim() ?? null, is_ranked, is_public })
    .eq("id", list_id)
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}