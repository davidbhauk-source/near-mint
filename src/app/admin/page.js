import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AdminClient from "@/components/admin-client";

export const revalidate = 0

const ADMIN_ID = "634746c5-efe9-43ea-ba4d-0eea96cb95c7";

export default async function AdminPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== ADMIN_ID) redirect("/");

  const { data: pending } = await supabase
    .from("pending_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .throwOnError();

  return (
    <div className="nm-page-body" style={{ maxWidth: 800 }}>
      <div className="auth-header">
        <div className="nm-eyebrow">Admin</div>
        <h1 className="auth-title">Pending runs</h1>
        <p className="auth-sub">{pending?.length ?? 0} runs awaiting review.</p>
      </div>
      <AdminClient pending={pending ?? []} />
    </div>
  );
}