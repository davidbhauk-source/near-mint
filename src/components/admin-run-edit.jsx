'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminRunEdit({ run }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editData, setEditData] = useState({
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

  function splitNames(str) {
    return str.split(",").map((s) => s.trim()).filter(Boolean);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/edit-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: run.id,
        title: editData.title,
        publisher: editData.publisher,
        start_year: editData.start_year ? parseInt(editData.start_year) : null,
        end_year: editData.end_year || null,
        issue_count: editData.issue_count ? parseInt(editData.issue_count) : null,
        summary: editData.summary,
        creative_team: {
          writers: splitNames(editData.writers),
          pencilers: splitNames(editData.pencilers),
          colorists: splitNames(editData.colorists),
          letterers: splitNames(editData.letterers),
        },
        tags: splitNames(editData.tags),
      }),
    });

    if (!res.ok) {
      setError("Failed to save changes.");
    } else {
      setOpen(false);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        className="rd-btn-secondary"
        onClick={() => setOpen((v) => !v)}
        type="button"
        style={{ fontSize: 11 }}
      >
        {open ? "Cancel edit" : "✎ Admin edit"}
      </button>

      {open && (
        <div style={{
          marginTop: 16,
          background: "#1a2e1a",
          border: "0.5px solid rgba(45,90,39,0.4)",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="log-field">
              <div className="log-label">Title</div>
              <input className="auth-input" value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
            </div>
            <div className="log-field">
              <div className="log-label">Publisher</div>
              <input className="auth-input" value={editData.publisher}
                onChange={(e) => setEditData({ ...editData, publisher: e.target.value })} />
            </div>
            <div className="log-field">
              <div className="log-label">Start year</div>
              <input className="auth-input" type="number" value={editData.start_year}
                onChange={(e) => setEditData({ ...editData, start_year: e.target.value })} />
            </div>
            <div className="log-field">
              <div className="log-label">End year <span className="log-optional">or "present"</span></div>
              <input className="auth-input" placeholder='e.g. 2008 or "present"' value={editData.end_year}
                onChange={(e) => setEditData({ ...editData, end_year: e.target.value })} />
            </div>
            <div className="log-field">
              <div className="log-label">Issue count</div>
              <input className="auth-input" type="number" value={editData.issue_count}
                onChange={(e) => setEditData({ ...editData, issue_count: e.target.value })} />
            </div>
            <div className="log-field">
              <div className="log-label">Tags <span className="log-optional">comma separated</span></div>
              <input className="auth-input" placeholder="e.g. classic, short, horror" value={editData.tags}
                onChange={(e) => setEditData({ ...editData, tags: e.target.value })} />
            </div>
          </div>

          <div className="log-field">
            <div className="log-label">Summary</div>
            <textarea className="log-textarea" rows={3} value={editData.summary}
              onChange={(e) => setEditData({ ...editData, summary: e.target.value })} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="log-field">
              <div className="log-label">Writers <span className="log-optional">comma separated</span></div>
              <input className="auth-input" value={editData.writers}
                onChange={(e) => setEditData({ ...editData, writers: e.target.value })} />
            </div>
            <div className="log-field">
              <div className="log-label">Pencilers</div>
              <input className="auth-input" value={editData.pencilers}
                onChange={(e) => setEditData({ ...editData, pencilers: e.target.value })} />
            </div>
            <div className="log-field">
              <div className="log-label">Colorists</div>
              <input className="auth-input" value={editData.colorists}
                onChange={(e) => setEditData({ ...editData, colorists: e.target.value })} />
            </div>
            <div className="log-field">
              <div className="log-label">Letterers</div>
              <input className="auth-input" value={editData.letterers}
                onChange={(e) => setEditData({ ...editData, letterers: e.target.value })} />
            </div>
          </div>

          {error && <p className="log-error">{error}</p>}

          <button
            className="log-btn-save"
            onClick={handleSave}
            disabled={saving}
            type="button"
            style={{ alignSelf: "flex-start" }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}