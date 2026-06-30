'use client'
import { useState } from "react";

export default function AdminClient({ pending }) {
  const [items, setItems] = useState(pending);
  const [processing, setProcessing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState(null);

  function handleEditOpen(run) {
  setEditing(run.id);
  setEditData({
    title: run.title ?? "",
    publisher: run.publisher ?? "",
    start_year: run.start_year ?? "",
    end_year: run.end_year ?? "",
    issue_count: run.issue_count ?? "",
    summary: run.summary ?? "",
    writers: run.creative_team?.writers?.join(", ") ?? "",
    pencilers: run.creative_team?.pencilers?.join(", ") ?? "",
    colorists: run.creative_team?.colorists?.join(", ") ?? "",
    letterers: run.creative_team?.letterers?.join(", ") ?? "",
    tags: run.tags?.join(", ") ?? "",
  });
}
  function splitNames(str) {
    return str.split(",").map((s) => s.trim()).filter(Boolean);
  }

  async function handleApprove(run) {
    setProcessing(run.id);
    setError(null);

    const isEdited = editing === run.id;

    const finalRun = isEdited ? {
     ...run,
     title: editData.title,
     publisher: editData.publisher,
     start_year: editData.start_year ? parseInt(editData.start_year) : null,
     end_year: editData.end_year || null,
     issue_count: editData.issue_count ? parseInt(editData.issue_count) : null,
     summary: editData.summary,
     tags: splitNames(editData.tags),  // ← moved out of creative_team
     creative_team: {
       writers: splitNames(editData.writers),
       pencilers: splitNames(editData.pencilers),
       colorists: splitNames(editData.colorists),
       letterers: splitNames(editData.letterers),
     },
    } : run;

    const res = await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ run: finalRun }),
    });

    if (!res.ok) {
      setError("Failed to approve run.");
    } else {
      setItems((prev) => prev.filter((r) => r.id !== run.id));
      setEditing(null);
    }
    setProcessing(null);
  }

  async function handleReject(run) {
    setProcessing(run.id);
    setError(null);

    const res = await fetch("/api/admin/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: run.id }),
    });

    if (!res.ok) {
      setError("Failed to reject run.");
    } else {
      setItems((prev) => prev.filter((r) => r.id !== run.id));
      setEditing(null);
    }
    setProcessing(null);
  }

  if (items.length === 0) {
    return <p className="profile-empty">No pending runs — you're all caught up.</p>;
  }

  return (
    <div>
      {error && <p className="log-error" style={{ marginBottom: 16 }}>{error}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((run) => (
          <div key={run.id} style={{ background: "#1a2e1a", border: "0.5px solid rgba(45,90,39,0.3)", borderRadius: 8, overflow: "hidden" }}>

            {/* Run row */}
            <div className="suggest-result" style={{ background: "transparent", border: "none", borderRadius: 0 }}>
              {run.cover_url ? (
                <img src={run.cover_url} alt={run.title} className="suggest-thumb" />
              ) : (
                <div className="suggest-thumb suggest-thumb-ph" />
              )}
              <div className="suggest-info">
                <div className="suggest-title">{run.title}</div>
                <div className="suggest-meta">
                  {[run.publisher, run.start_year, run.issue_count ? `${run.issue_count} issues` : null]
                    .filter(Boolean).join(" · ")}
                </div>
                {run.summary && (
                  <div className="suggest-desc">{run.summary.slice(0, 100)}…</div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <button
                  className="log-btn-save"
                  onClick={() => editing === run.id ? handleApprove(run) : handleEditOpen(run)}
                  disabled={processing === run.id}
                  type="button"
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  {processing === run.id ? "…" : editing === run.id ? "Approve" : "Edit & Approve"}
                </button>
                <button
                  className="log-btn-cancel"
                  onClick={() => editing === run.id ? setEditing(null) : handleReject(run)}
                  disabled={processing === run.id}
                  type="button"
                  style={{ fontSize: 12, padding: "6px 14px" }}
                >
                  {editing === run.id ? "Cancel" : "Reject"}
                </button>
              </div>
            </div>

            {/* Edit form */}
            {editing === run.id && (
              <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12, borderTop: "0.5px solid rgba(45,90,39,0.3)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                  <div className="log-field">
                    <div className="log-label">Title</div>
                    <input className="auth-input" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
                  </div>
                  <div className="log-field">
                    <div className="log-label">Publisher</div>
                    <input className="auth-input" value={editData.publisher} onChange={(e) => setEditData({ ...editData, publisher: e.target.value })} />
                  </div>
                  <div className="log-field">
                    <div className="log-label">Start year</div>
                    <input className="auth-input" type="number" value={editData.start_year} onChange={(e) => setEditData({ ...editData, start_year: e.target.value })} />
                  </div>
                  <div className="log-field">
                    <div className="log-label">End year <span className="log-optional">or "ongoing"</span></div>
                    <input className="auth-input" placeholder='e.g. 2008 or "present"' value={editData.end_year} onChange={(e) => setEditData({ ...editData, end_year: e.target.value })} />
                  </div>
                  <div className="log-field">
                    <div className="log-label">Issue count</div>
                    <input className="auth-input" type="number" value={editData.issue_count} onChange={(e) => setEditData({ ...editData, issue_count: e.target.value })} />
                  </div>
                </div>
                <div className="log-field">
                <div className="log-label">Tags <span className="log-optional">comma separated</span></div>
                <input
                 className="auth-input"
                 placeholder="e.g. classic, short, horror"
                 value={editData.tags}
                 onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
              />
             </div>    
                <div className="log-field">
                  <div className="log-label">Summary</div>
                  <textarea className="log-textarea" rows={3} value={editData.summary} onChange={(e) => setEditData({ ...editData, summary: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="log-field">
                    <div className="log-label">Writers <span className="log-optional">comma separated</span></div>
                    <input className="auth-input" placeholder="e.g. Grant Morrison, Mark Millar" value={editData.writers} onChange={(e) => setEditData({ ...editData, writers: e.target.value })} />
                  </div>
                  <div className="log-field">
                    <div className="log-label">Pencilers <span className="log-optional">comma separated</span></div>
                    <input className="auth-input" placeholder="e.g. Frank Quitely" value={editData.pencilers} onChange={(e) => setEditData({ ...editData, pencilers: e.target.value })} />
                  </div>
                  <div className="log-field">
                    <div className="log-label">Colorists <span className="log-optional">comma separated</span></div>
                    <input className="auth-input" value={editData.colorists} onChange={(e) => setEditData({ ...editData, colorists: e.target.value })} />
                  </div>
                  <div className="log-field">
                    <div className="log-label">Letterers <span className="log-optional">comma separated</span></div>
                    <input className="auth-input" value={editData.letterers} onChange={(e) => setEditData({ ...editData, letterers: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}