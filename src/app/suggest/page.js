import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SuggestClient from "@/components/suggest-client";

export default async function SuggestPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <div className="nm-page-body" style={{ maxWidth: 700 }}>
      <div className="auth-header">
        <div className="nm-eyebrow">Near Mint</div>
        <h1 className="auth-title">Suggest a run</h1>
        <p className="auth-sub">Search ComicVine and suggest a run to be added to Near Mint.</p>
      </div>
      <SuggestClient />
    </div>
  );
}