import { createServerSupabase } from "@/lib/supabase-server";
import Link from "next/link";
import AdminRunEdit from "@/components/admin-run-edit";

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

  if (!run) {
    return { title: "Run not found — Near Mint" };
  }

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

  const { data: run, error } = await supabase
    .from("runs")
    .select("*")
    .eq("id", id)
    .single()
    .range(0, 2000);

    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.id === "634746c5-efe9-43ea-ba4d-0eea96cb95c7";

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, review_text, contains_spoilers, created_at, user_id")
    .eq("run_id", id)
    .order("created_at", { ascending: false });

  const safeReviews = reviews ?? [];

  const avgRating = safeReviews.length > 0
    ? (safeReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / safeReviews.length).toFixed(1)
    : null;

  if (error) {
    return <pre>{JSON.stringify(error, null, 2)}</pre>;
  }

   

  return (
    <div className="nm-page-body">

      <Link href="/" className="back-link">← All runs</Link>

      {isAdmin && <AdminRunEdit run={run} />}

      {/* Hero */}
      <div className="rd-hero">
        <div className="rd-cover-wrap">
          {run.cover_url ? (
            <img src={run.cover_url} alt={run.title} className="rd-cover" />
          ) : (
            <div className="rd-cover rd-cover-ph">{run.title}</div>
          )}
        </div>

        <div className="rd-info">
          {run.publisher && (
            <div className="rd-publisher">{run.publisher}</div>
          )}
          <h1 className="rd-title">{run.title}</h1>
          <div className="rd-meta">
            {run.start_year && (
              <span>{run.start_year}{run.end_year ? ` – ${run.end_year}` : ""}</span>
            )}
            {run.issue_count && (
              <span>{run.issue_count} issues</span>
            )}
          </div>

          {avgRating && (
            <div className="rd-rating-row">
              <span className="rd-avg">{avgRating}</span>
              <div>
                <div className="rd-stars">
                  {renderStars(avgRating)}
                </div>
                <div className="rd-review-count">
                  {safeReviews.length} {safeReviews.length === 1 ? "review" : "reviews"}
                </div>
              </div>
            </div>
          )}

          <div className="rd-actions">
            <Link href={`/runs/${id}/log`} className="rd-btn-primary">
              + Log this run
            </Link>
            <Link href={`/runs/${id}/log`} className="rd-btn-secondary">
              Write a review
            </Link>
          </div>
        </div>
      </div>

      <hr className="rd-divider" />

      {/* Body */}
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
                Reviews {safeReviews.length > 0 && (
                  <span className="rd-review-badge">{safeReviews.length}</span>
                )}
              </div>
              <Link href={`/runs/${id}/log`} className="rd-btn-secondary" style={{ fontSize: 11, padding: "4px 12px" }}>
                Write a review
              </Link>
            </div>

            {safeReviews.length === 0 ? (
              <p className="rd-empty">No reviews yet — be the first.</p>
            ) : (
              <ul className="rd-reviews-list">
                {safeReviews.map((review) => (
                  <li key={review.id} className="rd-review-card">
                    <div className="rd-review-top">
                      <span className="rd-review-stars">
                        {review.rating ? renderStars(review.rating / 2) : null}
                      </span>
                      <span className="rd-review-date">
                        {new Date(review.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </span>
                    </div>
                    {review.contains_spoilers && (
                      <p className="rd-spoiler-warning">⚠ Contains spoilers</p>
                    )}
                    {review.review_text && (
                      <p className="rd-review-text">{review.review_text}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        {/* Sidebar */}
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

function renderStars(rating) {
  // rating is out of 5 here
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push("★");
    else if (rating >= i - 0.5) stars.push("½");
    else stars.push("☆");
  }
  return stars.join("");
}