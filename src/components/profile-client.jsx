'use client'
import { useState } from "react";
import Link from "next/link";
import SettingsPanel from "@/components/settings-panel";

export default function ProfileClient({
  profile,
  logs,
  reviews,
  favouriteRuns,
  recentLogs,
  stats,
  readingCount,
  followerCount,
  followingCount, 
}) {
  const [activeTab, setActiveTab] = useState("stats");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const username = profile?.username ?? "Anonymous";
  const bio = profile?.bio ?? "No bio yet.";
  const initial = username[0].toUpperCase();

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

      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">{initial}</div>
        <div className="profile-info">
          <h1 className="profile-username">{username}</h1>
          <p className="profile-bio">{bio}</p>
          <div className="profile-counts">
            <div className="profile-count">
              <span>{stats.logCount}</span>
              <small>logged</small>
            </div>
            <div className="profile-count">
              <span>{stats.reviewCount}</span>
              <small>reviews</small>
            </div>
            <div className="profile-count">
              <span>{readingCount}</span>
              <small>reading</small>
            </div>
              <div className="profile-count">
         <Link href="/friends" style={{ textDecoration: "none" }}>
          <span>{followerCount}</span><small>followers</small>
        </Link>
      </div>
      <div className="profile-count">
        <Link href="/friends" style={{ textDecoration: "none" }}>
          <span>{followingCount}</span><small>following</small>
        </Link>
          </div>
          </div>
        </div>
        <button className="profile-edit" onClick={() => setSettingsOpen(true)} type="button">
          ⚙ Settings
        </button>
      </div>

      {/* Favourite runs */}
      <div className="fav-section">
        <div className="fav-header">
          <span className="fav-label">Favourite runs</span>
          <button className="fav-edit" onClick={() => setSettingsOpen(true)} type="button">Edit →</button>
        </div>
        {favouriteRuns.length === 0 ? (
          <p className="profile-empty">No favourite runs set yet — open settings to add some.</p>
        ) : (
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
        )}
      </div>

      {/* Recently logged */}
      <div className="recent-section">
        <div className="recent-header">
          <span className="recent-label">Recently logged</span>
          <button className="recent-see-all" onClick={() => setActiveTab("logs")}>
            See all →
          </button>
        </div>
        {recentLogs.length === 0 ? (
          <p className="profile-empty">No runs logged yet.</p>
        ) : (
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
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {["stats", "reviews", "logs"].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "on" : ""}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab === "stats" ? "Stats" : tab === "reviews" ? "Reviews" : "All logged runs"}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {activeTab === "stats" && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">{stats.logCount}</div>
            <div className="stat-label">Runs logged</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{stats.totalIssuesRead}</div>
            <div className="stat-label">Issues read</div>
            <div className="stat-sub">across all runs</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{stats.reviewCount}</div>
            <div className="stat-label">Reviews written</div>
            <div className="stat-sub">{stats.reviewPct}% of logged runs</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{stats.topPublisher?.name ?? "—"}</div>
            <div className="stat-label">Top publisher</div>
            {stats.topPublisher && (
              <div className="stat-sub">{stats.topPublisher.count} runs</div>
            )}
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ fontSize: stats.topWriter?.name?.length > 10 ? 18 : 26 }}>
              {stats.topWriter?.name ?? "—"}
            </div>
            <div className="stat-label">Favourite writer</div>
            {stats.topWriter && (
              <div className="stat-sub">{stats.topWriter.count} runs logged</div>
            )}
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ fontSize: stats.topArtist?.name?.length > 10 ? 18 : 26 }}>
              {stats.topArtist?.name ?? "—"}
            </div>
            <div className="stat-label">Favourite artist</div>
            {stats.topArtist && (
              <div className="stat-sub">{stats.topArtist.count} runs logged</div>
            )}
          </div>
        </div>
      )}

      {/* Reviews tab */}
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
                    <div className="review-stars">
                      {renderStars(review.rating)} · {review.rating}/10
                    </div>
                  )}
                  {review.review_text && (
                    <div className="review-text">{review.review_text}</div>
                  )}
                  <div className="review-date">
                    {new Date(review.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric"
                    })}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Logs tab */}
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
                      <img
                        src={log.runs.cover_url}
                        alt={log.runs.title}
                        className="log-cover"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="log-cover" style={{ background: "#1a2e1a" }} />
                    )}
                    {pct !== null && (
                      <span className="log-badge">
                        {pct >= 100 ? "✓" : `${pct}%`}
                      </span>
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

      {/* Settings panel */}
      {settingsOpen && (
        <SettingsPanel
          profile={profile}
          onClose={() => setSettingsOpen(false)}
        />
      )}

    </div>
  );
}