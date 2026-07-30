import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import SingleReviewClient from "@/components/single-review-client";

export default async function ReviewPage({ params }) {
  const supabase = await createServerSupabase();
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const { data: { user } } = await supabase.auth.getUser();

  const { data: review } = await supabase
    .from("reviews")
    .select("*, runs(id, title, cover_url, publisher, start_year, end_year)")
    .eq("id", id)
    .single();

  if (!review) notFound();

  const { data: reviewerProfile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", review.user_id)
    .single();

  const { data: likes } = await supabase
    .from("review_likes")
    .select("user_id")
    .eq("review_id", id);

  const likeCount = likes?.length ?? 0;
  const userLiked = (likes ?? []).some(l => l.user_id === user?.id);

  // Fetch reviewer's score
  // Replace the reviewerLog fetch with:
  const reviewerScore = review.score;

  return (
    <div className="nm-page-body" style={{ maxWidth: 640 }}>
      <Link href="/reviews" className="back-link">← All reviews</Link>

      {/* Run card */}
      <Link href={`/runs/${review.runs?.id}`} style={{ textDecoration: "none" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "#1a2e1a",
          border: "0.5px solid rgba(45,90,39,0.3)",
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
        }}>
          {review.runs?.cover_url ? (
            <img
              src={review.runs.cover_url}
              alt={review.runs.title}
              style={{ width: 48, aspectRatio: "2/3", objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 48, aspectRatio: "2/3", background: "#111c11", borderRadius: 4, flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#f5f2eb", marginBottom: 3 }}>{review.runs?.title}</div>
            <div style={{ fontSize: 12, color: "rgba(245,242,235,0.35)" }}>
              {review.runs?.publisher}
              {review.runs?.start_year && ` · ${review.runs.start_year}${review.runs.end_year ? `–${review.runs.end_year}` : ""}`}
            </div>
          </div>
        </div>
      </Link>

      {/* Reviewer info */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "#2d5a27", border: "1.5px solid rgba(151,196,89,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 500, color: "#97c459", flexShrink: 0,
        }}>
          {(reviewerProfile?.username?.[0] ?? "?").toUpperCase()}
        </div>
        <div>
          <Link
            href={`/profile/${reviewerProfile?.username}`}
            style={{ fontSize: 14, fontWeight: 500, color: "#f5f2eb", textDecoration: "none" }}
          >
            {reviewerProfile?.display_name || reviewerProfile?.username}
          </Link>
          {reviewerScore !== null && reviewerScore !== undefined && (
            <span style={{ marginLeft: 8, fontSize: 13, color: "#97c459" }}>{reviewerScore}/100</span>
          )}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "rgba(245,242,235,0.3)" }}>
          {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>


      {review.review_type === "issue" && (review.issue_start || review.issue_end) && (
        <span style={{ color: "rgba(245,242,235,0.3)", fontSize: 11 }}>
          Issues #{review.issue_start}{review.issue_end && review.issue_end !== review.issue_start ? `–${review.issue_end}` : ""}
        </span>
      )}

      {review.contains_spoilers && (
        <p className="rd-spoiler-warning" style={{ marginBottom: 12 }}>⚠ Contains spoilers</p>
      )}

      <p style={{ fontSize: 15, color: "rgba(245,242,235,0.8)", lineHeight: 1.7, marginBottom: 24 }}>
        {review.review_text}
      </p>

      <SingleReviewClient
        reviewId={id}
        initialLikeCount={likeCount}
        initialUserLiked={userLiked}
        currentUserId={user?.id ?? null}
        isOwn={user?.id === review.user_id}
        runId={review.run_id}
      />
    </div>
  );
}