'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function SettingsPanel({ profile, onClose }) {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Favourite runs state
  const [favRuns, setFavRuns] = useState(
    Array(4).fill(null).map((_, i) => profile?.favourite_run_data?.[i] ?? null)
  );
  const [activeSlot, setActiveSlot] = useState(null);
  const [favSearch, setFavSearch] = useState("");
  const [favResults, setFavResults] = useState([]);
  const [favSearching, setFavSearching] = useState(false);
  const [favSaving, setFavSaving] = useState(false);
  const [favMsg, setFavMsg] = useState(null);

  async function searchFavRuns(q) {
    setFavSearch(q);
    if (q.trim().length < 2) { setFavResults([]); return; }
    setFavSearching(true);
    const { data } = await supabase
      .from("runs")
      .select("id, title, cover_url, creative_team")
      .ilike("title", `%${q}%`)
      .limit(8);
    setFavResults(data ?? []);
    setFavSearching(false);
  }

  function pickFavRun(run) {
    const updated = [...favRuns];
    updated[activeSlot] = run;
    setFavRuns(updated);
    setActiveSlot(null);
    setFavSearch("");
    setFavResults([]);
  }

  function removeFavRun(index) {
    const updated = [...favRuns];
    updated[index] = null;
    setFavRuns(updated);
  }

  async function saveFavourites() {
    setFavSaving(true);
    setFavMsg(null);
    const ids = favRuns.filter(Boolean).map((r) => r.id);
    const res = await fetch("/api/profile/favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favourite_runs: ids }),
    });
    setFavMsg(res.ok ? { success: "Favourites saved." } : { error: "Failed to save." });
    setFavSaving(false);
    if (res.ok) router.refresh();
  }

  async function saveProfile() {
    setProfileSaving(true);
    setProfileMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, username, bio })
      .eq("id", profile.id);
    setProfileMsg(error ? { error: error.message } : { success: "Profile saved." });
    setProfileSaving(false);
    if (!error) router.refresh();
  }

  async function changeEmail() {
    setEmailSaving(true);
    setEmailMsg(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: emailPassword,
    });
    if (signInError) {
      setEmailMsg({ error: "Incorrect password." });
      setEmailSaving(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailMsg(error
      ? { error: error.message }
      : { success: "Check your new email for a confirmation link." }
    );
    setEmailSaving(false);
  }

  async function changePassword() {
    setPasswordSaving(true);
    setPasswordMsg(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });
    if (signInError) {
      setPasswordMsg({ error: "Current password is incorrect." });
      setPasswordSaving(false);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ error: "New password must be at least 6 characters." });
      setPasswordSaving(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordMsg(error
      ? { error: error.message }
      : { success: "Password changed successfully." }
    );
    setPasswordSaving(false);
    if (!error) { setCurrentPassword(""); setNewPassword(""); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push("/");
    } else {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>

        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-close" onClick={onClose} type="button">✕</button>
        </div>

        {/* Favourite runs */}
        <div className="settings-sec">
          <div className="settings-sec-label">Favourite runs</div>
          <div className="fav-edit-grid">
            {favRuns.map((run, i) => (
              <div
                key={i}
                className={`fav-slot ${run ? "filled" : ""}`}
                onClick={() => { if (!run) { setActiveSlot(i); setFavSearch(""); setFavResults([]); } }}
              >
                {run ? (
                  <>
                    {run.cover_url ? (
                      <img src={run.cover_url} alt={run.title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#1a2e1a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgba(245,242,235,0.3)", padding: 4, textAlign: "center" }}>
                        {run.title}
                      </div>
                    )}
                    <button
                      className="fav-slot-remove"
                      onClick={(e) => { e.stopPropagation(); removeFavRun(i); }}
                      type="button"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 20 }}>+</span>
                    <span>Add favourite</span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Search panel for active slot */}
          {activeSlot !== null && (
            <div className="settings-sub-panel" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "rgba(245,242,235,0.4)", marginBottom: 8 }}>
                Picking for slot {activeSlot + 1}
              </div>
              <input
                className="auth-input"
                placeholder="Search runs…"
                value={favSearch}
                onChange={(e) => searchFavRuns(e.target.value)}
                autoFocus
              />
              {favSearching && <p style={{ fontSize: 12, color: "rgba(245,242,235,0.35)" }}>Searching…</p>}
              {favResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {favResults.map((run) => (
                    <button
                      key={run.id}
                      type="button"
                      onClick={() => pickFavRun(run)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "rgba(255,255,255,0.03)",
                        border: "0.5px solid rgba(45,90,39,0.3)",
                        borderRadius: 6,
                        padding: "8px 10px",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {run.cover_url ? (
                        <img src={run.cover_url} alt={run.title} style={{ width: 28, aspectRatio: "2/3", objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 28, aspectRatio: "2/3", background: "#1a2e1a", borderRadius: 3, flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#f5f2eb" }}>{run.title}</div>
                        <div style={{ fontSize: 11, color: "rgba(245,242,235,0.35)" }}>
                          {run.creative_team?.writers?.join(", ")}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <button
                className="log-btn-cancel"
                onClick={() => { setActiveSlot(null); setFavSearch(""); setFavResults([]); }}
                type="button"
                style={{ marginTop: 8, fontSize: 12 }}
              >
                Cancel
              </button>
            </div>
          )}

          {favMsg && (
            <p className={favMsg.error ? "log-error" : "auth-success"} style={{ margin: "8px 0 0" }}>
              {favMsg.error ?? favMsg.success}
            </p>
          )}
          <button className="log-btn-save" onClick={saveFavourites} disabled={favSaving} type="button" style={{ marginTop: 12 }}>
            {favSaving ? "Saving…" : "Save favourites"}
          </button>
        </div>

        <hr className="settings-divider" />

        {/* Profile */}
        <div className="settings-sec">
          <div className="settings-sec-label">Profile</div>
          <div className="log-field">
            <div className="log-label">Display name</div>
            <input className="auth-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="log-field">
            <div className="log-label">Username</div>
            <input className="auth-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </div>
          <div className="log-field">
            <div className="log-label">Bio</div>
            <input className="auth-input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself" />
          </div>
          {profileMsg && (
            <p className={profileMsg.error ? "log-error" : "auth-success"} style={{ margin: "4px 0" }}>
              {profileMsg.error ?? profileMsg.success}
            </p>
          )}
          <button className="log-btn-save" onClick={saveProfile} disabled={profileSaving} type="button" style={{ marginTop: 4 }}>
            {profileSaving ? "Saving…" : "Save profile"}
          </button>
        </div>

        <hr className="settings-divider" />

        {/* Email */}
        <div className="settings-sec">
          <div className="settings-sec-label">Account</div>
          <button
            className="settings-expand-btn"
            onClick={() => { setEmailOpen((v) => !v); setEmailMsg(null); }}
            type="button"
          >
            Change email {emailOpen ? "▲" : "▼"}
          </button>
          {emailOpen && (
            <div className="settings-sub-panel">
              <div className="log-field">
                <div className="log-label">New email</div>
                <input className="auth-input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="newemail@example.com" />
              </div>
              <div className="log-field">
                <div className="log-label">Current password to verify</div>
                <input className="auth-input" type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {emailMsg && (
                <p className={emailMsg.error ? "log-error" : "auth-success"} style={{ margin: "4px 0" }}>
                  {emailMsg.error ?? emailMsg.success}
                </p>
              )}
              <button className="log-btn-save" onClick={changeEmail} disabled={emailSaving} type="button">
                {emailSaving ? "Saving…" : "Update email"}
              </button>
            </div>
          )}

          <button
            className="settings-expand-btn"
            onClick={() => { setPasswordOpen((v) => !v); setPasswordMsg(null); }}
            type="button"
            style={{ marginTop: 10 }}
          >
            Change password {passwordOpen ? "▲" : "▼"}
          </button>
          {passwordOpen && (
            <div className="settings-sub-panel">
              <div className="log-field">
                <div className="log-label">Current password</div>
                <input className="auth-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="log-field">
                <div className="log-label">New password</div>
                <div className="auth-password-wrap">
                  <input
                    className="auth-input"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
              {passwordMsg && (
                <p className={passwordMsg.error ? "log-error" : "auth-success"} style={{ margin: "4px 0" }}>
                  {passwordMsg.error ?? passwordMsg.success}
                </p>
              )}
              <button className="log-btn-save" onClick={changePassword} disabled={passwordSaving} type="button">
                {passwordSaving ? "Saving…" : "Update password"}
              </button>
            </div>
          )}
        </div>

        <hr className="settings-divider" />

        {/* Sign out */}
        <div className="settings-sec">
          <button className="settings-signout-btn" onClick={handleSignOut} type="button">
            Sign out
          </button>
        </div>

        {/* Delete account */}
        <div className="settings-sec">
          <div className="settings-sec-label" style={{ color: "#e88e7d" }}>Danger zone</div>
          {deleteConfirm && (
            <p style={{ fontSize: 12, color: "#e88e7d", marginBottom: 8 }}>
              Are you sure? This cannot be undone. Click again to confirm.
            </p>
          )}
          <button
            className="settings-danger-btn"
            onClick={handleDeleteAccount}
            disabled={deleting}
            type="button"
          >
            {deleting ? "Deleting…" : deleteConfirm ? "Yes, delete my account" : "Delete account"}
          </button>
          {deleteConfirm && (
            <button
              className="log-btn-cancel"
              onClick={() => setDeleteConfirm(false)}
              type="button"
              style={{ marginLeft: 8, fontSize: 12 }}
            >
              Cancel
            </button>
          )}
        </div>

      </div>
    </div>
  );
}