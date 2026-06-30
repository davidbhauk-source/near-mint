'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogReviewForm({ runId, issueCount, existingLog, existingReview }) {
  const router = useRouter();

  const [status, setStatus] = useState(existingLog?.status ?? "");
  const [issuesRead, setIssuesRead] = useState(existingLog?.issues_read ?? "");
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  // starState tracks each star: 0 = empty, 1 = full, 0.5 = half
  const [starStates, setStarStates] = useState(() => {
    const initial = existingReview?.rating ?? 0;
    return buildStarStates(initial);
  });
  const [reviewText, setReviewText] = useState(existingReview?.review_text ?? "");
  const [spoilers, setSpoilers] = useState(existingReview?.contains_spoilers ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function buildStarStates(rating) {
    // rating is 1-10, stars are 1-5 where each star = 2 points
    const states = [];
    for (let i = 1; i <= 5; i++) {
      const full = i * 2;
      const half = i * 2 - 1;
      if (rating >= full) states.push(1);
      else if (rating >= half) states.push(0.5);
      else states.push(0);
    }
    return states;
  }

  function starsToRating(states) {
    return states.reduce((sum, s) => sum + (s === 1 ? 2 : s === 0.5 ? 1 : 0), 0);
  }

  function handleStarClick(index) {
    const current = starStates[index];
    const newStates = [...starStates];

    if (current === 0) {
      // Empty → full, fill all stars up to this one
      for (let i = 0; i <= index; i++) newStates[i] = 1;
      for (let i = index + 1; i < 5; i++) newStates[i] = 0;
    } else if (current === 1) {
      // Full → half
      newStates[index] = 0.5;
    } else {
      // Half → empty, clear this star and all after
      for (let i = index; i < 5; i++) newStates[i] = 0;
    }

    setStarStates(newStates);
    setRating(starsToRating(newStates));
  }

  function getPct() {
    if (!issueCount || !issuesRead) return null;
    const pct = Math.round((Number(issuesRead) / issueCount) * 100);
    if (pct >= 100) return "Complete";
    return `${pct}%`;
  }

  async function handleSubmit() {
    if (!status) { setError("Please select a status."); return; }
    setSaving(true);
    setError(null);

    const res = await fetch("/api/log-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        run_id: runId,
        status,
        issues_read: issuesRead === "" ? null : Number(issuesRead),
        rating: rating === 0 ? null : rating,
        review_text: reviewText.trim() === "" ? null : reviewText.trim(),
        contains_spoilers: spoilers,
      }),
    });

    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      setSaving(false);
      return;
    }

    router.push(`/runs/${runId}`);
  }

  return (
    <div className="log-form">

      {/* Status */}
      <div className="log-field">
        <div className="log-label">Status</div>
        <div className="log-status-row">
          {["Want to read", "Reading", "Complete"].map((s) => (
            <button
              key={s}
              className={`log-status-btn ${status === s ? "on" : ""}`}
              onClick={() => { 
                setStatus(s);
                if (s === "Complete" && issueCount) { 
                    setIssuesRead (issueCount);
                }
            }}
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Progress — hidden for Want to read */}
      {status !== "Want to read" && status !== "" && (
        <div className="log-field">
          <div className="log-label">
            Progress <span className="log-optional">optional</span>
          </div>
          <div className="log-progress-row">
            <input
              type="number"
              min="0"
              max={issueCount ?? undefined}
              value={issuesRead}
              onChange={(e) => setIssuesRead(e.target.value)}
              className="log-issues-input"
              placeholder="0"
            />
            {issueCount && (
              <span className="log-issues-of">of {issueCount} issues</span>
            )}
            {getPct() && (
              <span className="log-pct-pill">{getPct()}</span>
            )}
          </div>
        </div>
      )}

      {/* Rating */}
      <div className="log-field">
        <div className="log-label">
          Rating <span className="log-optional">optional</span>
        </div>
        <div className="log-stars-row">
          {starStates.map((state, i) => (
            <button
              key={i}
              type="button"
              className="log-star-btn"
              onClick={() => handleStarClick(i)}
              aria-label={`Star ${i + 1}`}
            >
              {state === 1 ? "★" : state === 0.5 ? <span style={{fontSize: "24px"}}>½</span> : "☆"}
            </button>
          ))}
          {rating > 0 && (
            <span className="log-rating-val">{rating}/10</span>
          )}
        </div>
      </div>

      {/* Review */}
      <div className="log-field">
        <div className="log-label">
          Review <span className="log-optional">optional</span>
        </div>
        <textarea
          className="log-textarea"
          placeholder="Share your thoughts…"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
        />
      </div>

      {/* Spoilers */}
      <label className="log-spoiler-row">
        <input
          type="checkbox"
          checked={spoilers}
          onChange={(e) => setSpoilers(e.target.checked)}
        />
        <span className="log-spoiler-label">Contains spoilers</span>
      </label>

      {error && <p className="log-error">{error}</p>}

      {/* Submit */}
      <div className="log-submit-row">
        <button
          className="log-btn-save"
          onClick={handleSubmit}
          disabled={saving}
          type="button"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          className="log-btn-cancel"
          onClick={() => router.back()}
          type="button"
        >
          Cancel
        </button>
      </div>

    </div>
  );
}