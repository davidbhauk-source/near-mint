'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function FriendsClient({ following, followers, followingIds, currentUserId }) {
  const router = useRouter();
  const supabase = createClient();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [followingState, setFollowingState] = useState(new Set(followingIds));
  const [processing, setProcessing] = useState(null);
  const [activeTab, setActiveTab] = useState("following");

  async function handleSearch(q) {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);

    const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setSearching(false);
  }

  async function handleFollow(userId) {
    setProcessing(userId);
    const res = await fetch("/api/friends/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following_id: userId }),
    });
    if (res.ok) {
      setFollowingState((prev) => new Set([...prev, userId]));
      router.refresh();
    }
    setProcessing(null);
  }

  async function handleUnfollow(userId) {
    setProcessing(userId);
    const res = await fetch("/api/friends/unfollow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following_id: userId }),
    });
    if (res.ok) {
      setFollowingState((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      router.refresh();
    }
    setProcessing(null);
  }

  function UserRow({ profile, showFollow = true }) {
    const isFollowing = followingState.has(profile.id);
    const isMe = profile.id === currentUserId;

    return (
      <div className="friends-row">
        <div className="friends-avatar">
          {(profile.username?.[0] ?? "?").toUpperCase()}
        </div>
        <div className="friends-info">
          <Link href={`/profile/${profile.username}`} className="friends-username">
            {profile.display_name || profile.username}
          </Link>
          {profile.display_name && (
            <div className="friends-handle">@{profile.username}</div>
          )}
        </div>
        {showFollow && !isMe && (
          <button
            className={isFollowing ? "log-btn-cancel" : "log-btn-save"}
            onClick={() => isFollowing ? handleUnfollow(profile.id) : handleFollow(profile.id)}
            disabled={processing === profile.id}
            type="button"
            style={{ fontSize: 12, padding: "6px 14px", flexShrink: 0 }}
          >
            {processing === profile.id ? "…" : isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: 28 }}>
        <div className="log-label" style={{ marginBottom: 8 }}>Find people</div>
        <input
          className="search-input"
          placeholder="Search by username, display name, or email…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searching && (
          <p style={{ fontSize: 12, color: "rgba(245,242,235,0.35)", marginTop: 8 }}>Searching…</p>
        )}
        {results.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            {results.map((profile) => (
              <UserRow key={profile.id} profile={profile} />
            ))}
          </div>
        )}
        {query.length >= 2 && !searching && results.length === 0 && (
          <p style={{ fontSize: 12, color: "rgba(245,242,235,0.25)", marginTop: 8 }}>No users found.</p>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab ${activeTab === "following" ? "on" : ""}`}
          onClick={() => setActiveTab("following")}
          type="button"
        >
          Following ({following.length})
        </button>
        <button
          className={`tab ${activeTab === "followers" ? "on" : ""}`}
          onClick={() => setActiveTab("followers")}
          type="button"
        >
          Followers ({followers.length})
        </button>
      </div>

      {activeTab === "following" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {following.length === 0 ? (
            <p className="profile-empty">You're not following anyone yet — search above to find people.</p>
          ) : (
            following.map((profile) => (
              <UserRow key={profile.id} profile={profile} />
            ))
          )}
        </div>
      )}

      {activeTab === "followers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {followers.length === 0 ? (
            <p className="profile-empty">No followers yet.</p>
          ) : (
            followers.map((profile) => (
              <UserRow key={profile.id} profile={profile} />
            ))
          )}
        </div>
      )}
    </div>
  );
}