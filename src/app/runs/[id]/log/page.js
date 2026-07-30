import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogReviewForm from "@/components/log-review-form";

export default async function LogPage({ params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const resolvedParams = await params;
  const { id } = resolvedParams;

  const { data: run } = await supabase
    .from("runs")
    .select("id, title, cover_url, publisher, issue_count, creative_team")
    .eq("id", id)
    .single();

  if (!run) return <p style={{ color: "#f5f2eb", padding: 24 }}>Run not found.</p>;

  const { data: existingLog } = await supabase
    .from("readlogs")
    .select("*")
    .eq("run_id", id)
    .eq("user_id", user.id)
    .single();

  // Fetch all reviews by this user for this run
  const { data: userReviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("run_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="nm-page-body" style={{ maxWidth: 560 }}>
      <Link href={`/runs/${id}`} className="back-link">
        ← {run.title}
      </Link>

      <div className="log-run-head">
        {run.cover_url ? (
          <img src={run.cover_url} alt={run.title} className="log-thumb" />
        ) : (
          <div className="log-thumb log-thumb-ph" />
        )}
        <div>
          <h2 className="log-run-title">{run.title}</h2>
          <p className="log-run-meta">
            {run.creative_team?.writers?.join(", ")} · {run.publisher}
            {run.issue_count ? ` · ${run.issue_count} issues` : ""}
          </p>
        </div>
      </div>

      <LogReviewForm
        runId={id}
        issueCount={run.issue_count}
        existingLog={existingLog}
        userReviews={userReviews ?? []}
      />
    </div>
  );
}