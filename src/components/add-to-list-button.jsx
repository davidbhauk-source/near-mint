'use client'
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AddToListButton({ runId }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);
  const [added, setAdded] = useState(new Set());
  const [error, setError] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sign in to add to lists."); setLoading(false); return; }

    const { data: userLists } = await supabase
      .from("lists")
      .select("id, title, is_ranked")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Check which lists already contain this run
    const { data: existingEntries } = await supabase
      .from("list_runs")
      .select("list_id")
      .eq("run_id", runId);

    const addedSet = new Set((existingEntries ?? []).map(e => e.list_id));
    setAdded(addedSet);
    setLists(userLists ?? []);
    setLoading(false);
  }

  async function handleAddToList(list) {
    setAdding(list.id);
    setError(null);

    const position = list.is_ranked ? 999 : 0;
    const res = await fetch("/api/lists/add-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_id: list.id, run_id: runId, position }),
    });

    if (res.ok) {
      setAdded((prev) => new Set([...prev, list.id]));
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to add.");
    }
    setAdding(null);
  }

  async function handleRemoveFromList(listId) {
    setAdding(listId);
    const res = await fetch("/api/lists/remove-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_id: listId, run_id: runId }),
    });
    if (res.ok) {
      setAdded((prev) => {
        const next = new Set(prev);
        next.delete(listId);
        return next;
      });
    }
    setAdding(null);
  }

  async function handleCreateAndAdd() {
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);

    const res = await fetch("/api/lists/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), is_ranked: false, is_public: true }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to create."); setCreating(false); return; }

    const newList = data.list;
    setLists((prev) => [newList, ...prev]);

    // Add run to the new list
    await fetch("/api/lists/add-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_id: newList.id, run_id: runId, position: 0 }),
    });

    setAdded((prev) => new Set([...prev, newList.id]));
    setNewTitle("");
    setCreatingNew(false);
    setCreating(false);
  }

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        className="rd-btn-secondary"
        onClick={handleOpen}
        type="button"
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        +
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          left: 0,
          background: "#1a2e1a",
          border: "0.5px solid rgba(45,90,39,0.4)",
          borderRadius: 8,
          padding: 12,
          minWidth: 220,
          zIndex: 50,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.6px", textTransform: "uppercase", color: "rgba(245,242,235,0.3)", marginBottom: 10 }}>
            Add to list
          </div>

          {loading && <p style={{ fontSize: 12, color: "rgba(245,242,235,0.35)", margin: 0 }}>Loading…</p>}
          {error && <p className="log-error" style={{ margin: "0 0 8px" }}>{error}</p>}

          {!loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {lists.length === 0 && !creatingNew && (
                <p style={{ fontSize: 12, color: "rgba(245,242,235,0.35)", margin: "0 0 6px" }}>No lists yet.</p>
              )}
              {lists.map((list) => {
                const isAdded = added.has(list.id);
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => isAdded ? handleRemoveFromList(list.id) : handleAddToList(list)}
                    disabled={adding === list.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: isAdded ? "rgba(151,196,89,0.1)" : "transparent",
                      border: `0.5px solid ${isAdded ? "rgba(151,196,89,0.3)" : "rgba(45,90,39,0.3)"}`,
                      borderRadius: 6, padding: "7px 10px",
                      cursor: "pointer", textAlign: "left",
                      color: isAdded ? "#97c459" : "rgba(245,242,235,0.7)",
                      fontSize: 13,
                    }}
                  >
                    <span>{list.title}</span>
                    <span style={{ fontSize: 14, marginLeft: 8 }}>
                      {adding === list.id ? "…" : isAdded ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* New list form */}
          {creatingNew ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                className="auth-input"
                placeholder="List name…"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
                autoFocus
                style={{ fontSize: 12, padding: "6px 10px" }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="log-btn-save"
                  onClick={handleCreateAndAdd}
                  disabled={creating}
                  type="button"
                  style={{ fontSize: 12, padding: "5px 12px", flex: 1 }}
                >
                  {creating ? "Creating…" : "Create & add"}
                </button>
                <button
                  className="log-btn-cancel"
                  onClick={() => setCreatingNew(false)}
                  type="button"
                  style={{ fontSize: 12, padding: "5px 10px" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreatingNew(true)}
              style={{
                width: "100%", background: "none",
                border: "0.5px dashed rgba(45,90,39,0.4)",
                borderRadius: 6, padding: "7px 10px",
                cursor: "pointer", fontSize: 12,
                color: "rgba(245,242,235,0.4)", textAlign: "left",
              }}
            >
              + New list
            </button>
          )}
        </div>
      )}
    </div>
  );
}