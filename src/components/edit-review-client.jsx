'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditReviewClient({ review, runId, issueCount }) {
  const router = useRouter();
  const [reviewText, setReviewText] = useState(review.review_text ?? "");
  const [spoilers, setSpoilers] = useState(review.contains_spoilers ?? false);
  const [reviewType, setReviewType] = useState(review.review_type ?? "run");
  const [issueStart, setIssueStart] = useState(review.issue_start ?? "");
  const [issueEnd, setIssueEnd] = useState(review.issue_end ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(review.score ?? "");

  async function handleSave() {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/reviews/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        review_id: review.id,
        review_text: reviewText.trim(),
        contains_spoilers: spoilers,
        review_type: reviewType,
        issue_start: reviewType === "issue" && issueStart ? Number(issueStart) : null,
        issue_end: reviewType === "issue" && issueEnd ? Number(issueEnd) : null,
        score: score === "" ? null : Number(score),
      }),
    });

    if (!res.ok) {
      setError("Failed to save.");
      setSaving(false);
      return;
    }

    router.push(`/reviews/${review.id}`);
  }

  async function handleDelete() {
    if (!deleting) { setDeleting(true); return; }

    const res = await fetch("/api/reviews/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: review.id }),
    });

    if (res.ok) {
      router.push(`/runs/${runId}`);
    } else {
      setError("Failed to delete.");
      setDeleting(false);
    }
  }

  return (
    <div className="log-form">

      <div className="log-field">
        <div className="log-label">Reviewing</div>
        <div className="log-status-row">
          <button
            className={`log-status-btn ${reviewType === "run" ? "on" : ""}`}
            onClick={() => setReviewType("run")}
            type="button"
          >
            Whole run
          </button>
          <button
            className={`log-status-btn ${reviewType === "issue" ? "on" : ""}`}
            onClick={() => setReviewType("issue")}
            type="button"
          >
            Specific issue
          </button>
        </div>
        {reviewType === "issue" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
           <input
             type="number"
             min="1"
             max={issueCount ?? undefined}
             value={issueStart}
             onChange={(e) => setIssueStart(e.target.value)}
             className="log-issues-input"
             placeholder="From #"
             style={{ width: 80 }}
           />
           <span style={{ color: "rgba(245,242,235,0.4)", fontSize: 13 }}>–</span>
           <input
             type="number"
             min="1"
             max={issueCount ?? undefined}
             value={issueEnd}
             onChange={(e) => setIssueEnd(e.target.value)}
             className="log-issues-input"
             placeholder="To #"
             style={{ width: 80 }}
           />
         </div>
       )}
      </div>
      <div className="log-field">
  <div className="log-label">Score <span className="log-optional">0–100, optional</span></div>
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <input
      type="number"
      min="0"
      max="100"
      value={score}
      onChange={(e) => {
        const val = e.target.value;
        if (val === "" || (Number(val) >= 0 && Number(val) <= 100)) setScore(val);
      }}
      className="log-issues-input"
      placeholder="—"
      style={{ width: 72 }}
    />
    {score !== "" && <span className="log-pct-pill">{score}/100</span>}
  </div>
</div>

      <div className="log-field">
        <div className="log-label">Review</div>
        <textarea
          className="log-textarea"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={6}
        />
      </div>

      <label className="log-spoiler-row">
        <input
          type="checkbox"
          checked={spoilers}
          onChange={(e) => setSpoilers(e.target.checked)}
        />
        <span className="log-spoiler-label">Contains spoilers</span>
      </label>

      {error && <p className="log-error">{error}</p>}

      <div className="log-submit-row">
        <button className="log-btn-save" onClick={handleSave} disabled={saving} type="button">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button className="log-btn-cancel" onClick={() => router.back()} type="button">
          Cancel
        </button>
      </div>

      <div style={{ marginTop: 24, paddingTop: 24, borderTop: "0.5px solid rgba(45,90,39,0.3)" }}>
        <div style={{ fontSize: 11, color: "#e88e7d", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>
          Danger zone
        </div>
        {deleting && (
          <p style={{ fontSize: 12, color: "#e88e7d", marginBottom: 8 }}>
            Are you sure? This cannot be undone. Click again to confirm.
          </p>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="settings-danger-btn"
            onClick={handleDelete}
            type="button"
            style={{ fontSize: 12 }}
          >
            {deleting ? "Yes, delete review" : "Delete review"}
          </button>
          {deleting && (
            <button
              className="log-btn-cancel"
              onClick={() => setDeleting(false)}
              type="button"
              style={{ fontSize: 12 }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

    </div>
  );
}