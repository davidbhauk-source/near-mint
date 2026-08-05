import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, is_ranked, is_public } = await req.json();

  if (!title?.trim()) return Response.json({ error: "Title is required" }, { status: 400 });

  const { data, error } = await supabase.from("lists").insert({
    user_id: user.id,
    title: title.trim(),
    description: description?.trim() ?? null,
    is_ranked: is_ranked ?? false,
    is_public: is_public ?? true,
  }).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ list: data });
}