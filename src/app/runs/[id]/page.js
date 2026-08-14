import { createServerSupabase } from "@/lib/supabase-server";
import Link from "next/link";
import AdminRunEdit from "@/components/admin-run-edit";
import BookmarkButton from "@/components/bookmark-button";
import AddToListButton from "@/components/add-to-list-button";
import ReviewList from "@/components/review-list";

export const revalidate = 0

export async function generateMetadata({ params }) {
  const supabase = await createServerSupabase();
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const { data: run } = await supabase
    .from("runs")
    .select("title, summary, cover_url, publisher")
    .eq("id", id)
    .single();

  if (!run) return { title: "Run not found — Near Mint" };

  return {
    title: `${run.title} — Near Mint`,
    description: run.summary?.slice(0, 160) ?? `${run.title} on Near Mint.`,
    openGraph: {
      title: run.title,
      description: run.summary?.slice(0, 160) ?? "",
      images: run.cover_url ? [run.cover_url] : [],
    },
  };
}

export default async function RunPage({ params }) {
  const supabase = await createServerSupabase();
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.id === "634746c5-efe9-43ea-ba4d-0eea96cb95c7";

  let isBookmarked = false;
  if (user) {
    const { data: log } = await supabase
      .from("readlogs")
      .select("bookmarked")
      .eq("run_id", id)
      .eq("user_id", user.id)
      .single();
    isBookmarked = log?.bookmarked ?? false;
  }

  const { data: run, error } = await supabase
    .from("runs")
    .select("*")
    .eq("id", id)
    .single();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("run_id", id)
    .order("created_at", { ascending: false });

  const safeReviews = reviews ?? [];

  const reviewerUserIds = [...new Set(safeReviews.map(r => r.user_id))];
  let profileMap = {};
  if (reviewerUserIds.length > 0) {
    const { data: reviewProfiles } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", reviewerUserIds);
    (reviewProfiles ?? []).forEach(p => {
      profileMap[p.id] = p;
    });
  }

  const reviewsWithProfiles = safeReviews.map(r => ({
    ...r,
    profiles: profileMap[r.user_id] ?? null,
    reviewer_score: r.score,
  }));

  const { data: likes } = await supabase
    .from("review_likes")
    .select("review_id, user_id");

  const likeCounts = {};
  const userLikes = new Set();
  (likes ?? []).forEach(({ review_id, user_id }) => {
    likeCounts[review_id] = (likeCounts[review_id] ?? 0) + 1;
    if (user_id === user?.id) userLikes.add(review_id);
  });

  const reviewsWithLikes = reviewsWithProfiles.map((r) => ({
    ...r,
    like_count: likeCounts[r.id] ?? 0,
    user_liked: userLikes.has(r.id),
  }));

  const scoredReviews = reviewsWithProfiles.filter(r => r.reviewer_score !== null && r.reviewer_score !== undefined);
  const avgScore = scoredReviews.length > 0
    ? Math.round(scoredReviews.reduce((sum, r) => sum + Number(r.reviewer_score), 0) / scoredReviews.length)
    : null;

  if (error) {
    return <pre>{JSON.stringify(error, null, 2)}</pre>;
  }

  return (
    <div className="nm-page-body">

      <Link href="/" className="back-link">← All runs</Link>

      {isAdmin && <AdminRunEdit run={run} />}

      <div className="rd-hero">
        <div className="rd-cover-wrap">
          {run.cover_url ? (
            <img src={run.cover_url} alt={run.title} className="rd-cover" />
          ) : (
            <div className="rd-cover rd-cover-ph">{run.title}</div>
          )}
        </div>

        <div className="rd-info">
          {run.publisher && <div className="rd-publisher">{run.publisher}</div>}
          <h1 className="rd-title">{run.title}</h1>
          <div className="rd-meta">
            {run.start_year && (
              <span>{run.start_year}{run.end_year ? ` – ${run.end_year}` : ""}</span>
            )}
            {run.issue_count && <span>{run.issue_count} issues</span>}
          </div>

          {avgScore !== null && !isNaN(avgScore) && (
            <div className="rd-rating-row">
              <span className="rd-avg">{avgScore}</span>
              <div>
                <div style={{ fontSize: 12, color: "rgba(245,242,235,0.4)" }}>out of 100</div>
                <div className="rd-review-count">
                  {reviewsWithLikes.length} {reviewsWithLikes.length === 1 ? "review" : "reviews"}
                </div>
              </div>
            </div>
          )}

          <div className="rd-actions">
            <Link href={`/runs/${id}/log`} className="rd-btn-primary">
              + Log this run
            </Link>
            {user && (
              <BookmarkButton runId={id} initialBookmarked={isBookmarked} />
            )}
            {user && (
              <AddToListButton runId={id} />
            )}
          </div>
        </div>
      </div>

      <hr className="rd-divider" />

      <div className="rd-body">
        <div className="rd-main">

          {run.summary && (
            <div className="rd-section">
              <div className="rd-section-label">Summary</div>
              <p className="rd-summary">{run.summary}</p>
            </div>
          )}

          <div className="rd-section">
            <div className="rd-reviews-header">
              <div className="rd-section-label" style={{ margin: 0 }}>
                Reviews {reviewsWithLikes.length > 0 && (
                  <span className="rd-review-badge">{reviewsWithLikes.length}</span>
                )}
              </div>
            </div>
            <ReviewList
              reviews={reviewsWithLikes}
              currentUserId={user?.id ?? null}
              runId={id}
            />
          </div>

        </div>

        <div className="rd-sidebar">
          {run.creative_team && (
            <div className="rd-sidebar-card">
              <div className="rd-section-label">Creative team</div>
              {Object.entries(run.creative_team).map(([role, names]) => (
                <div key={role} className="rd-team-entry">
                  <div className="rd-team-role">{role}</div>
                  <div className="rd-team-names">
                    {Array.isArray(names) ? names.join(", ") : names}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rd-sidebar-card">
            <div className="rd-section-label">Details</div>
            {run.publisher && (
              <div className="rd-detail-row">
                <span className="rd-detail-label">Publisher</span>
                <span className="rd-detail-val">{run.publisher}</span>
              </div>
            )}
            {run.issue_count && (
              <div className="rd-detail-row">
                <span className="rd-detail-label">Issues</span>
                <span className="rd-detail-val">{run.issue_count}</span>
              </div>
            )}
            {run.start_year && (
              <div className="rd-detail-row">
                <span className="rd-detail-label">Years</span>
                <span className="rd-detail-val">
                  {run.start_year}{run.end_year ? ` – ${run.end_year}` : ""}
                </span>
              </div>
            )}
            <div className="rd-detail-row">
              <span className="rd-detail-label">Status</span>
              <span className="rd-detail-val" style={{
                color: run.end_year?.toLowerCase() === "present" ? "#97c459" : "inherit"
              }}>
                {run.end_year?.toLowerCase() === "present" ? "Ongoing" : "Complete"}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}