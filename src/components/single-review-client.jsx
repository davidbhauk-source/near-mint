'use client'
import { useState } from "react";
import Link from "next/link";

export default function SingleReviewClient({
  reviewId,
  initialLikeCount,
  initialUserLiked,
  currentUserId,
  isOwn,
  runId,
}) {
  const [liked, setLiked] = useState(initialUserLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    if (!currentUserId) return;
    setLoading(true);
    const endpoint = liked ? "/api/reviews/unlike" : "/api/reviews/like";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: reviewId }),
    });
    if (res.ok) {
      setLiked((v) => !v);
      setLikeCount((v) => liked ? v - 1 : v + 1);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {currentUserId && (
        <button
          className="review-like-btn"
          onClick={handleLike}
          disabled={loading}
          type="button"
          style={{
            fontSize: 18,
            color: liked ? "#e88e7d" : "rgba(245,242,235,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {liked ? "♥" : "♡"}
          {likeCount > 0 && (
            <span style={{ fontSize: 13 }}>{likeCount}</span>
          )}
        </button>
      )}
      {isOwn && (
        <Link
          href={`/runs/${runId}/review/${reviewId}/edit`}
          className="rd-btn-secondary"
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          Edit review
        </Link>
      )}
    </div>
  );
}