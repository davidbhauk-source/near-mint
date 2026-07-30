'use client'
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ReviewsClient({ reviews, currentUserId }) {
  const [sort, setSort] = useState("likes");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterMinScore, setFilterMinScore] = useState("");
  const [filterMaxScore, setFilterMaxScore] = useState("");
  const [likeStates, setLikeStates] = useState(() => {
    const map = {};
    reviews.forEach((r) => {
      map[r.id] = { count: r.like_count, liked: r.user_liked };
    });
    return map;
  });

  async function handleLike(reviewId) {
    if (!currentUserId) return;
    const current = likeStates[reviewId];
    const endpoint = current.liked ? "/api/reviews/unlike" : "/api/reviews/like";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: reviewId }),
    });
    if (res.ok) {
      setLikeStates((prev) => ({
        ...prev,
        [reviewId]: {
          count: current.liked ? current.count - 1 : current.count + 1,
          liked: !current.liked,
        },
      }));
    }
  }

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filterType === "run" && r.review_type !== "run") return false;
      if (filterType === "issue" && r.review_type !== "issue") return false;
      if (filterMinScore !== "" && (r.reviewer_score ?? 0) < Number(filterMinScore)) return false;
      if (filterMaxScore !== "" && (r.reviewer_score ?? 100) > Number(filterMaxScore)) return false;
      return true;
    });
  }, [reviews, filterType, filterMinScore, filterMaxScore]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === "likes") {
      return copy.sort((a, b) => (likeStates[b.id]?.count ?? 0) - (likeStates[a.id]?.count ?? 0));
    }
    return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [filtered, sort, likeStates]);

  return (
    <div>
      {/* Sort + filter controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <button
          className={`cat-sort-btn ${sort === "likes" ? "on" : ""}`}
          onClick={() => setSort("likes")}
          type="button"
        >
          Most liked
        </button>
        <button
          className={`cat-sort-btn ${sort === "recent" ? "on" : ""}`}
          onClick={() => setSort("recent")}
          type="button"
        >
          Most recent
        </button>
        <button
          className="cat-sort-btn"
          onClick={() => setFilterOpen((v) => !v)}
          type="button"
          style={filterType !== "all" || filterMinScore || filterMaxScore
            ? { color: "#97c459", borderColor: "rgba(151,196,89,0.5)" }
            : {}}
        >
          Filter {filterOpen ? "▲" : "▼"}
        </button>
      </div>

      {/* Filter popup */}
      {filterOpen && (
        <div style={{
          background: "#1a2e1a",
          border: "0.5px solid rgba(45,90,39,0.4)",
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}>
          <div className="log-field">
            <div className="log-label">Review type</div>
            <div className="log-status-row">
              {[["all", "All"], ["run", "Whole run"], ["issue", "Specific issue"]].map(([val, label]) => (
                <button
                  key={val}
                  className={`log-status-btn ${filterType === val ? "on" : ""}`}
                  onClick={() => setFilterType(val)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="log-field">
            <div className="log-label">Score range</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="number"
                min="0"
                max="100"
                value={filterMinScore}
                onChange={(e) => setFilterMinScore(e.target.value)}
                className="log-issues-input"
                placeholder="Min"
                style={{ width: 64 }}
              />
              <span style={{ color: "rgba(245,242,235,0.3)", fontSize: 13 }}>to</span>
              <input
                type="number"
                min="0"
                max="100"
                value={filterMaxScore}
                onChange={(e) => setFilterMaxScore(e.target.value)}
                className="log-issues-input"
                placeholder="Max"
                style={{ width: 64 }}
              />
            </div>
          </div>
          <button
            className="log-btn-cancel"
            onClick={() => { setFilterType("all"); setFilterMinScore(""); setFilterMaxScore(""); }}
            type="button"
            style={{ fontSize: 12, alignSelf: "flex-start" }}
          >
            Clear filters
          </button>
        </div>
      )}

      <p style={{ fontSize: 12, color: "rgba(245,242,235,0.3)", marginBottom: 16 }}>
        {sorted.length} {sorted.length === 1 ? "review" : "reviews"}
      </p>

      {/* Review list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map((review) => {
          const likes = likeStates[review.id];
          return (
            <Link
              key={review.id}
              href={`/reviews/${review.id}`}
              style={{ textDecoration: "none" }}
            >
              <div className="rd-review-card" style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  {/* Run cover */}
                  {review.runs?.cover_url ? (
                    <img
                      src={review.runs.cover_url}
                      alt={review.runs.title}
                      style={{ width: 40, aspectRatio: "2/3", objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 40, aspectRatio: "2/3", background: "#111c11", borderRadius: 4, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#f5f2eb", marginBottom: 2 }}>
                      {review.runs?.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                      {review.profiles?.username && (
                        <span style={{ color: "rgba(245,242,235,0.4)" }}>
                          {review.profiles.display_name || review.profiles.username}
                        </span>
                      )}
                      {review.reviewer_score !== null && (
                        <span style={{ color: "#97c459" }}>{review.reviewer_score}/100</span>
                      )}
                      {review.review_type === "issue" && review.issue_number && (
                        <span style={{ color: "rgba(245,242,235,0.3)" }}>Issue #{review.issue_number}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(245,242,235,0.3)", flexShrink: 0 }}>
                    <span>{likes.count > 0 ? `♥ ${likes.count}` : "♡"}</span>
                  </div>
                </div>
                {review.contains_spoilers && (
                  <p className="rd-spoiler-warning">⚠ Contains spoilers</p>
                )}
                <p className="rd-review-text" style={{
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  margin: 0,
                }}>
                  {review.review_text}
                </p>
                <div style={{ fontSize: 11, color: "rgba(245,242,235,0.25)", marginTop: 8 }}>
                  {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}