'use client'
import { useState } from "react";

export default function BookmarkButton({ runId, initialBookmarked }) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const res = await fetch("/api/bookmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ run_id: runId, bookmarked: !bookmarked }),
    });
    if (res.ok) setBookmarked((v) => !v);
    setLoading(false);
  }

  return (
    <button
      className={`rd-btn-secondary ${bookmarked ? "bookmarked" : ""}`}
      onClick={handleToggle}
      disabled={loading}
      type="button"
      style={{
        color: bookmarked ? "#97c459" : "rgba(245,242,235,0.6)",
        borderColor: bookmarked ? "rgba(151,196,89,0.5)" : "rgba(45,90,39,0.5)",
      }}
    >
      {bookmarked ? "🔖" : "🔖"}
    </button>
  );
}