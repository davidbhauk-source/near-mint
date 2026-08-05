import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ListClient from "@/components/list-client";

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