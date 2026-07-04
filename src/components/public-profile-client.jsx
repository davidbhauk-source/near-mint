'use client'
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PublicProfileClient({
  profile,
  logs,
  reviews,
  favouriteRuns,
  recentLogs,
  isFollowing: initialIsFollowing,
  followerCount: initialFollowerCount,
  followingCount,
  currentUserId,
}) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("logs");

  const username = profile?.username ?? "Unknown";
  const initial = username[0].toUpperCase();

  async function handleFollow() {
    setProcessing(true);
    const endpoint = isFollowing ? "/api/friends/unfollow" : "/api/friends/follow";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following_id: profile.id }),
    });
    if (res.ok) {
      setIsFollowing((v) => !v);
      setFollowerCount((v) => isFollowing ? v - 1 : v + 1);
    }
    setProcessing(false);
  }

  function renderStars(rating) {
    if (!rating) return null;
    const outOfFive = rating / 2;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (outOfFive >= i) stars.push("★");
      else if (outOfFive >= i - 0.5) stars.push("½");
      else stars.push("☆");
    }
    return stars.join("");
  }

  return (
    <div className="nm-page-body">

      <div className="profile-header">
        <div className="profile-avatar">{initial}</div>
        <div className="profile-info">
          <h1 className="profile-username">{profile.display_name || username}</h1>
          {profile.display_name && (
            <p style={{ fontSize: 12, color: "rgba(245,242,235,0.35)", margin: "0 0 4px" }}>@{username}</p>
          )}
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-counts">
            <div className="profile-count"><span>{logs.length}</span><small>logged</small></div>
            <div className="profile-count"><span>{reviews.length}</span><small>reviews</small></div>
            <div className="profile-count"><span>{followerCount}</span><small>followers</small></div>
            <div className="profile-count"><span>{followingCount}</span><small>following</small></div>
          </div>
        </div>
        {currentUserId && (
          <button
            className={isFollowing ? "log-btn-cancel" : "log-btn-save"}
            onClick={handleFollow}
            disabled={processing}
            type="button"
            style={{ fontSize: 12, padding: "7px 16px", alignSelf: "flex-start" }}
          >
            {processing ? "…" : isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>

      {/* Favourite runs */}
      {favouriteRuns.length > 0 && (
        <div className="fav-section">
          <div className="fav-header">
            <span className="fav-label">Favourite runs</span>
          </div>
          <div className="fav-grid">
            {favouriteRuns.map((run) => (
              <Link key={run.id} href={`/runs/${run.id}`} className="fav-card">
                {run.cover_url ? (
                  <img src={run.cover_url} alt={run.title} className="fav-cover" style={{ objectFit: "cover" }} />
                ) : (
                  <div className="fav-cover fav-cover-ph">{run.title}</div>
                )}
                <div className="fav-meta">
                  <div className="fav-title">{run.title}</div>
                  <div className="fav-writer">{run.creative_team?.writers?.join(", ")}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recently logged */}
      {recentLogs.length > 0 && (
        <div className="recent-section">
          <div className="recent-header">
            <span className="recent-label">Recently logged</span>
          </div>
          <div className="recent-strip">
            {recentLogs.map((log) => (
              <Link key={log.id} href={`/runs/${log.run_id}`} className="recent-card">
                {log.runs?.cover_url ? (
                  <img src={log.runs.cover_url} alt={log.runs.title} className="recent-cover" style={{ objectFit: "cover" }} />
                ) : (
                  <div className="recent-cover" style={{ background: "#1a2e1a" }} />
                )}
                <div className="recent-meta">
                  <div className="recent-title">{log.runs?.title}</div>
                  <div className="recent-status">{log.status}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {["logs", "reviews"].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "on" : ""}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab === "logs" ? "All logged runs" : "Reviews"}
          </button>
        ))}
      </div>

      {activeTab === "logs" && (
        <div>
          {logs.length === 0 ? (
            <p className="profile-empty">No runs logged yet.</p>
          ) : (
            <div className="logs-grid">
              {logs.map((log) => {
                const pct = log.runs?.issue_count && log.issues_read
                  ? Math.round((log.issues_read / log.runs.issue_count) * 100)
                  : null;
                return (
                  <Link key={log.id} href={`/runs/${log.run_id}`} className="log-card">
                    {log.runs?.cover_url ? (
                      <img src={log.runs.cover_url} alt={log.runs.title} className="log-cover" style={{ objectFit: "cover" }} />
                    ) : (
                      <div className="log-cover" style={{ background: "#1a2e1a" }} />
                    )}
                    {pct !== null && (
                      <span className="log-badge">{pct >= 100 ? "✓" : `${pct}%`}</span>
                    )}
                    <div className="log-meta">
                      <div className="log-title">{log.runs?.title}</div>
                      <div className="log-status">{log.status}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div>
          {reviews.length === 0 ? (
            <p className="profile-empty">No reviews written yet.</p>
          ) : (
            reviews.map((review) => (
              <Link key={review.id} href={`/runs/${review.run_id}`} className="review-card" style={{ textDecoration: "none" }}>
                {review.runs?.cover_url ? (
                  <img src={review.runs.cover_url} alt={review.runs.title} className="review-thumb" />
                ) : (
                  <div className="review-thumb" style={{ background: "#1a2e1a", borderRadius: 3 }} />
                )}
                <div className="review-body">
                  <div className="review-run">{review.runs?.title}</div>
                  {review.rating && (
                    <div className="review-stars">{renderStars(review.rating)} · {review.rating}/10</div>
                  )}
                  {review.review_text && (
                    <div className="review-text">{review.review_text}</div>
                  )}
                  <div className="review-date">
                    {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

    </div>
  );
}