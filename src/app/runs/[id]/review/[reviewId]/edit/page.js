import { createServerSupabase } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EditReviewClient from "@/components/edit-review-client";

export default async function EditReviewPage({ params }) {
  const supabase = await createServerSupabase();
  const resolvedParams = await params;
  const { id, reviewId } = resolvedParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: review } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .single();

  if (!review) notFound();

  const { data: run } = await supabase
    .from("runs")
    .select("id, title, cover_url, issue_count")
    .eq("id", id)
    .single();

  return (
    <div className="nm-page-body" style={{ maxWidth: 560 }}>
      <Link href={`/reviews/${reviewId}`} className="back-link">← Back to review</Link>

      <div className="log-run-head">
        {run?.cover_url ? (
          <img src={run.cover_url} alt={run.title} className="log-thumb" />
        ) : (
          <div className="log-thumb log-thumb-ph" />
        )}
        <div>
          <h2 className="log-run-title">{run?.title}</h2>
          <p style={{ fontSize: 12, color: "rgba(245,242,235,0.35)", margin: 0 }}>Editing review</p>
        </div>
      </div>

      <EditReviewClient
        review={review}
        runId={id}
        issueStart={run?.issue_start}
        issueEnd={run?.issue_end}
      />
    </div>
  );
}