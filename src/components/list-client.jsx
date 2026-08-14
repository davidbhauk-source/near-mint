'use client'
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function ListClient({ list, listRuns: initialRuns, isOwner, owner }) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description ?? "");
  const [isPublic, setIsPublic] = useState(list.is_public);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [listRuns, setListRuns] = useState(
    [...initialRuns].sort((a, b) => a.position - b.position)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addError, setAddError] = useState(null);
  const [error, setError] = useState(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [isRanked, setIsRanked] = useState(list.is_ranked);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/lists/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        list_id: list.id,
        title,
        description,
        is_ranked: true,
        is_public: isPublic,
      }),
    });
    if (!res.ok) { setError("Failed to save."); setSaving(false); return; }
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) { setDeleting(true); return; }
    const res = await fetch("/api/lists/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_id: list.id }),
    });
    if (res.ok) router.push("/profile");
    else { setError("Failed to delete."); setDeleting(false); }
  }

  async function handleSearch(q) {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("runs")
      .select("id, title, cover_url, creative_team")
      .ilike("title", `%${q}%`)
      .limit(8);
    setSearchResults(data ?? []);
    setSearching(false);
  }

  async function handleAddRun(run) {
    setAddError(null);
    const position = listRuns.length + 1;
    const res = await fetch("/api/lists/add-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_id: list.id, run_id: run.id, position }),
    });
    if (!res.ok) {
      const data = await res.json();
      setAddError(data.error ?? "Failed to add.");
      return;
    }
    setListRuns((prev) => [...prev, { run_id: run.id, position, runs: run }]);
    setSearchQuery("");
    setSearchResults([]);
  }

  async function handleRemoveRun(run_id) {
    const res = await fetch("/api/lists/remove-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_id: list.id, run_id }),
    });
    if (res.ok) {
      const updated = listRuns
        .filter((r) => r.run_id !== run_id)
        .map((r, i) => ({ ...r, position: i + 1 }));
      setListRuns(updated);
      // Save new positions
      updated.forEach((r) => {
        fetch("/api/lists/update-position", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ list_id: list.id, run_id: r.run_id, position: r.position }),
        });
      });
    }
  }

  function handleDragStart(index) {
    dragItem.current = index;
  }

  function handleDragEnter(index) {
    dragOverItem.current = index;
    const copy = [...listRuns];
    const dragged = copy.splice(dragItem.current, 1)[0];
    copy.splice(index, 0, dragged);
    dragItem.current = index;
    setListRuns(copy);
  }

  async function handleDragEnd() {
    const updated = listRuns.map((r, i) => ({ ...r, position: i + 1 }));
    setListRuns(updated);
    // Save all positions
    await Promise.all(updated.map((r) =>
      fetch("/api/lists/update-position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list_id: list.id, run_id: r.run_id, position: r.position }),
      })
    ));
  }

  return (
    <div>
      {/* Header */}
      {editing ? (
        <div className="log-form" style={{ marginBottom: 24 }}>
          <div className="log-field">
            <div className="log-label">Title</div>
            <input className="auth-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="log-field">
            <div className="log-label">Description <span className="log-optional">optional</span></div>
            <textarea className="log-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
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

          {/* Add runs search */}
          <div className="log-field">
            <div className="log-label">Add a run</div>
            <input
              className="search-input"
              placeholder="Search runs…"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            {searching && <p style={{ fontSize: 12, color: "rgba(245,242,235,0.35)" }}>Searching…</p>}
            {addError && <p className="log-error">{addError}</p>}
            {searchResults.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {searchResults.map((run) => (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => handleAddRun(run)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "rgba(255,255,255,0.03)",
                      border: "0.5px solid rgba(45,90,39,0.3)",
                      borderRadius: 6, padding: "8px 10px",
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    {run.cover_url ? (
                      <img src={run.cover_url} alt={run.title} style={{ width: 28, aspectRatio: "2/3", objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 28, aspectRatio: "2/3", background: "#1a2e1a", borderRadius: 3, flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#f5f2eb" }}>{run.title}</div>
                      <div style={{ fontSize: 11, color: "rgba(245,242,235,0.35)" }}>{run.creative_team?.writers?.join(", ")}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="log-error">{error}</p>}
          <div className="log-submit-row">
            <button className="log-btn-save" onClick={handleSave} disabled={saving} type="button">
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="log-btn-cancel" onClick={() => setEditing(false)} type="button">Cancel</button>
          </div>

          {/* Danger zone */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "0.5px solid rgba(45,90,39,0.3)" }}>
            <div style={{ fontSize: 11, color: "#e88e7d", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>
              Danger zone
            </div>
            {deleting && (
              <p style={{ fontSize: 12, color: "#e88e7d", marginBottom: 8 }}>Are you sure? This cannot be undone.</p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="settings-danger-btn" onClick={handleDelete} type="button" style={{ fontSize: 12 }}>
                {deleting ? "Yes, delete list" : "Delete list"}
              </button>
              {deleting && (
                <button className="log-btn-cancel" onClick={() => setDeleting(false)} type="button" style={{ fontSize: 12 }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h1 style={{ fontSize: 24, fontWeight: 500, color: "#f5f2eb", margin: 0 }}>{list.title}</h1>
                {!list.is_public && (
                  <span style={{ fontSize: 11, background: "rgba(245,242,235,0.08)", color: "rgba(245,242,235,0.4)", padding: "2px 8px", borderRadius: 4 }}>Private</span>
                )}
              </div>
              {list.description && (
                <p style={{ fontSize: 13, color: "rgba(245,242,235,0.5)", margin: "0 0 6px" }}>{list.description}</p>
              )}
              <p style={{ fontSize: 12, color: "rgba(245,242,235,0.3)", margin: 0 }}>
                By{" "}
                <Link href={`/profile/${owner?.username}`} style={{ color: "rgba(245,242,235,0.5)", textDecoration: "none" }}>
                  {owner?.display_name || owner?.username}
                </Link>
                {" · "}{listRuns.length} {listRuns.length === 1 ? "run" : "runs"}
              </p>
            </div>
            {isOwner && (
              <button className="rd-btn-secondary" onClick={() => setEditing(true)} type="button" style={{ fontSize: 12 }}>
                Edit list
              </button>
            )}
          </div>
        </div>
      )}

      {/* Run list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {listRuns.length === 0 ? (
          <p className="profile-empty">No runs in this list yet{isOwner ? " — click Edit list to add some." : "."}</p>
        ) : (
          listRuns.map((item, index) => {
            const run = item.runs;
            if (!run) return null;
            return (
              <div
                key={item.run_id}
                draggable={editing && isOwner}
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#1a2e1a",
                  border: "0.5px solid rgba(45,90,39,0.3)",
                  borderRadius: 8,
                  padding: 10,
                  cursor: editing ? "grab" : "default",
                  userSelect: "none",
                }}
              >
                {/* Position number */}
                <span style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: "rgba(245,242,235,0.25)",
                  width: 24,
                  textAlign: "center",
                  flexShrink: 0,
                }}>
                  {index + 1}
                </span>

                {/* Drag handle — only in edit mode */}
                {editing && isOwner && (
                  <span style={{
                    color: "rgba(245,242,235,0.25)",
                    fontSize: 16,
                    flexShrink: 0,
                    cursor: "grab",
                    lineHeight: 1,
                  }}>
                    ⠿
                  </span>
                )}

                <Link href={`/runs/${run.id}`} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, textDecoration: "none" }}>
                  {run.cover_url ? (
                    <img src={run.cover_url} alt={run.title} style={{ width: 36, aspectRatio: "2/3", objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, aspectRatio: "2/3", background: "#111c11", borderRadius: 3, flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#f5f2eb", marginBottom: 2 }}>{run.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(245,242,235,0.35)" }}>
                      {run.creative_team?.writers?.join(", ")}
                    </div>
                  </div>
                </Link>

                {editing && isOwner && (
                  <button
                    onClick={() => handleRemoveRun(item.run_id)}
                    type="button"
                    style={{ background: "none", border: "none", color: "#e88e7d", cursor: "pointer", fontSize: 14, flexShrink: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}