'use client'
import { useState, useMemo } from "react";
import Link from "next/link";

export default function ReviewList({ reviews, currentUserId, runId }) {
  const [sort, setSort] = useState("likes");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterMinScore, setFilterMinScore] = useState("");
  const [filterMaxScore, setFilterMaxScore] = useState("");
  const [filterIssueStart, setFilterIssueStart] = useState("");
  const [filterIssueEnd, setFilterIssueEnd] = useState("");
  const [likeStates, setLikeStates] = useState(() => {
    const map = {};
    reviews.forEach((r) => {
      map[r.id] = { count: r.like_count, liked: r.user_liked };
    });
    return map;
  });

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filterType === "run" && r.review_type !== "run") return false;
      if (filterType === "issue" && r.review_type !== "issue") return false;
      if (filterType === "issue" && filterIssueStart !== "" && (r.issue_start ?? 0) < Number(filterIssueStart)) return false;
      if (filterType === "issue" && filterIssueEnd !== "" && (r.issue_end ?? 9999) > Number(filterIssueEnd)) return false;
      if (filterMinScore !== "" && (r.reviewer_score ?? 0) < Number(filterMinScore)) return false;
      if (filterMaxScore !== "" && (r.reviewer_score ?? 100) > Number(filterMaxScore)) return false;
      return true;
    });
  }, [reviews, filterType, filterMinScore, filterMaxScore, filterIssueStart, filterIssueEnd]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === "likes") {
      return copy.sort((a, b) => (likeStates[b.id]?.count ?? 0) - (likeStates[a.id]?.count ?? 0));
    }
    return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [filtered, sort, likeStates]);

  const hasActiveFilters = filterType !== "all" || filterMinScore || filterMaxScore;

  if (reviews.length === 0) {
    return <p className="rd-empty">No reviews yet — be the first.</p>;
  }

  return (
    <div>
      {/* Sort + filter controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
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
          style={hasActiveFilters ? { color: "#97c459", borderColor: "rgba(151,196,89,0.5)" } : {}}
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
          marginBottom: 16,
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
                  onClick={() => { setFilterType(val); setFilterIssueStart(""); setFilterIssueEnd(""); }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filterType === "issue" && (
            <div className="log-field">
              <div className="log-label">Issue range</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  min="1"
                  value={filterIssueStart}
                  onChange={(e) => setFilterIssueStart(e.target.value)}
                  className="log-issues-input"
                  placeholder="From #"
                  style={{ width: 80 }}
                />
                <span style={{ color: "rgba(245,242,235,0.4)", fontSize: 13 }}>–</span>
                <input
                  type="number"
                  min="1"
                  value={filterIssueEnd}
                  onChange={(e) => setFilterIssueEnd(e.target.value)}
                  className="log-issues-input"
                  placeholder="To #"
                  style={{ width: 80 }}
                />
              </div>
            </div>
          )}

          <div className="log-field">
            <div className="log-label">Score range</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              <span style={{ color: "rgba(245,242,235,0.4)", fontSize: 13 }}>to</span>
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
            onClick={() => {
              setFilterType("all");
              setFilterMinScore("");
              setFilterMaxScore("");
              setFilterIssueStart("");
              setFilterIssueEnd("");
            }}
            type="button"
            style={{ fontSize: 12, alignSelf: "flex-start" }}
          >
            Clear filters
          </button>
        </div>
      )}

      <p style={{ fontSize: 12, color: "rgba(245,242,235,0.3)", marginBottom: 12 }}>
        {sorted.length} {sorted.length === 1 ? "review" : "reviews"}
      </p>

      {sorted.length === 0 ? (
        <p className="rd-empty">No reviews match your filters.</p>
      ) : (
        <ul className="rd-reviews-list">
          {sorted.map((review) => (
            <li key={review.id}>
              <Link href={`/reviews/${review.id}`} style={{ textDecoration: "none" }}>
                <div className="rd-review-card" style={{ cursor: "pointer" }}>
                  <div className="rd-review-top">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {review.profiles?.username && (
                        <span style={{ fontSize: 12, color: "rgba(245,242,235,0.5)" }}>
                          {review.profiles.display_name || review.profiles.username}
                        </span>
                      )}
                      {review.reviewer_score !== null && review.reviewer_score !== undefined && (
                        <span style={{ fontSize: 12, color: "#97c459" }}>{review.reviewer_score}/100</span>
                      )}
                      {review.review_type === "issue" && (review.issue_start || review.issue_end) && (
                        <span style={{ fontSize: 11, color: "rgba(245,242,235,0.3)" }}>
                          Issues #{review.issue_start}{review.issue_end && review.issue_end !== review.issue_start ? `–${review.issue_end}` : ""}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {likeStates[review.id]?.count > 0 && (
                        <span style={{ fontSize: 11, color: "rgba(245,242,235,0.3)" }}>
                          ♥ {likeStates[review.id].count}
                        </span>
                      )}
                      <span className="rd-review-date">
                        {new Date(review.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>
                  {review.contains_spoilers && (
                    <p className="rd-spoiler-warning">⚠ Contains spoilers</p>
                  )}
                  {review.review_text && (
                    <p className="rd-review-text" style={{
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      margin: "8px 0 0",
                    }}>
                      {review.review_text}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}