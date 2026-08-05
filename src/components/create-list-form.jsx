'use client'
import { useState } from "react";

export default function CreateListForm({ onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRanked, setIsRanked] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate() {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError(null);

    const res = await fetch("/api/lists/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, is_ranked: isRanked, is_public: isPublic }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to create."); setSaving(false); return; }
    onCreated(data.list);
  }

  return (
    <div className="log-form" style={{
      background: "#1a2e1a",
      border: "0.5px solid rgba(45,90,39,0.3)",
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    }}>
      <div className="log-field">
        <div className="log-label">Title</div>
        <input className="auth-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Best runs of the decade" />
      </div>
      <div className="log-field">
        <div className="log-label">Description <span className="log-optional">optional</span></div>
        <textarea className="log-textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this list about?" />
      </div>
      <div className="log-field">
        <div style={{ display: "flex", gap: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(245,242,235,0.6)", cursor: "pointer" }}>
            <input type="checkbox" checked={isRanked} onChange={(e) => setIsRanked(e.target.checked)} style={{ accentColor: "#97c459" }} />
            Ranked
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(245,242,235,0.6)", cursor: "pointer" }}>
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} style={{ accentColor: "#97c459" }} />
            Public
          </label>
        </div>
      </div>
      {error && <p className="log-error">{error}</p>}
      <div className="log-submit-row">
        <button className="log-btn-save" onClick={handleCreate} disabled={saving} type="button">
          {saving ? "Creating…" : "Create list"}
        </button>
        <button className="log-btn-cancel" onClick={onCancel} type="button">Cancel</button>
      </div>
    </div>
  );
}