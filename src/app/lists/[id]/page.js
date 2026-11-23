import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ListClient from "@/components/list-client";

export async function generateMetadata({ params }) {
  const supabase = await createServerSupabase();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();

  const { data: list } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .single();

  // Private or missing lists get the plain site preview (nothing leaks)
  if (!list || (!list.is_public && list.user_id !== user?.id)) {
    return { title: "Near Mint" };
  }

  const { data: owner } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", list.user_id)
    .single();

  const ownerName = owner?.display_name || owner?.username || "a reader";
  const description =
    list.description || `A list of comic runs by ${ownerName} on Near Mint.`;

  return {
    title: list.title,
    description,
    openGraph: {
      type: "article",
      title: list.title,
      description,
      url: `/lists/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: list.title,
      description,
    },
  };
}

export default async function ListPage({ params }) {
  const supabase = await createServerSupabase();
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const { data: { user } } = await supabase.auth.getUser();

  const { data: list } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .single();

  if (!list) notFound();
  if (!list.is_public && list.user_id !== user?.id) notFound();

  const { data: listRuns } = await supabase
    .from("list_runs")
    .select("*, runs(*)")
    .eq("list_id", id)
    .order("position", { ascending: true });

  const { data: owner } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", list.user_id)
    .single();

  const isOwner = user?.id === list.user_id;

  return (
    <div className="nm-page-body" style={{ maxWidth: 720 }}>
      <Link href={isOwner ? "/profile" : `/profile/${owner?.username}`} className="back-link">
        ← {isOwner ? "Your profile" : (owner?.display_name || owner?.username)}
      </Link>

      <ListClient
        list={list}
        listRuns={listRuns ?? []}
        isOwner={isOwner}
        owner={owner}
      />
    </div>
  );
}