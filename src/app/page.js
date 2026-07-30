import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";

export const revalidate = 3600

export const metadata = {
  title: "Near Mint — Track comic book runs",
  description: "Log, rate, and review comic book runs",
}

const CATEGORIES = [
  {
    slug: "ongoing",
    label: "Ongoing runs",
    description: "Still being published",
    filter: (run) => run.end_year?.toLowerCase() === "present",
  },
  {
    slug: "classic",
    label: "Classic runs",
    description: "The ones that defined the medium",
    filter: (run) => run.tags?.includes("classic"),
  },
  {
    slug: "short",
    label: "Short runs",
    description: "Under 20 issues — great starting points",
    filter: (run) => run.tags?.includes("short"),
  },
]

export default async function HomePage() {
  const supabase = await createServerSupabase();

  const { data: runs } = await supabase
    .from("runs")
    .select("*")
    .order("title")
    .range(0, 2000);

  const allRuns = runs ?? [];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: recentLogs } = await supabase
    .from("readlogs")
    .select("run_id")
    .gte("created_at", oneWeekAgo.toISOString());

  const logCounts = {};
  (recentLogs ?? []).forEach(({ run_id }) => {
    logCounts[run_id] = (logCounts[run_id] ?? 0) + 1;
  });

  const { data: allLogs } = await supabase
    .from("readlogs")
    .select("run_id");

  const allTimeLogCounts = {};
  (allLogs ?? []).forEach(({ run_id }) => {
    allTimeLogCounts[run_id] = (allTimeLogCounts[run_id] ?? 0) + 1;
  });

  // Friends activity
const { data: { user } } = await supabase.auth.getUser();
let friendsRuns = [];

if (user) {
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (follows ?? []).map((f) => f.following_id);

  if (followingIds.length > 0) {
    const { data: friendLogs } = await supabase
      .from("readlogs")
      .select("run_id, user_id, created_at, runs(*)")
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: friendProfiles } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", followingIds);

    const profileMap = {};
    (friendProfiles ?? []).forEach((p) => {
      profileMap[p.id] = p;
    });

    const { data: friendReviews } = await supabase
      .from("reviews")
      .select("run_id, user_id, rating")
      .in("user_id", followingIds);

    const ratingMap = {};
    (friendReviews ?? []).forEach((r) => {
      ratingMap[`${r.user_id}-${r.run_id}`] = r.rating;
    });

    // Only take the most recent log per user
    const latestPerUser = {};
    (friendLogs ?? []).forEach((log) => {
      if (!latestPerUser[log.user_id]) {
        latestPerUser[log.user_id] = log;
      }
    });

    friendsRuns = Object.values(latestPerUser)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((log) => ({
        ...log.runs,
        logged_by: profileMap[log.user_id]?.display_name || profileMap[log.user_id]?.username,
        logged_by_rating: ratingMap[`${log.user_id}-${log.run_id}`] ?? null,
      }))
      .filter((r) => r.id)
      .slice(0, 6);
  }
}

  const popularThisWeek = [...allRuns]
    .filter((run) => logCounts[run.id])
    .sort((a, b) => (logCounts[b.id] ?? 0) - (logCounts[a.id] ?? 0))
    .slice(0, 12);

  const popularRow = popularThisWeek.length >= 3
    ? popularThisWeek
    : [...allRuns].slice(0, 12);

  return (
    <div className="nm-page-body">

      <div className="nm-hero">
        <div className="nm-eyebrow">Near Mint</div>
        <h1 className="nm-h1">Track the runs that shape you.</h1>
        <p className="nm-hero-sub">Log, rate, and review comic book runs</p>
      </div>

      <RunRow
        label="Popular this week"
        description="Most logged in the last 7 days"
        slug="popular"
        runs={popularRow.slice(0, 6)}
      />

      {CATEGORIES.map((cat) => {
        const filtered = allRuns
          .filter(cat.filter)
          .sort((a, b) => (allTimeLogCounts[b.id] ?? 0) - (allTimeLogCounts[a.id] ?? 0))
          .slice(0, 6);
        if (filtered.length === 0) return null;
        return (
          <RunRow
            key={cat.slug}
            label={cat.label}
            description={cat.description}
            slug={cat.slug}
            runs={filtered}
          />
        );
      })}

      {/* Friends row */}
      <div className="nm-section" style={{ opacity: friendsRuns.length === 0 ? 0.4 : 1 }}>
        <div className="nm-section-header">
          <div>
            <span className="nm-section-label">From your friends</span>
            <span className="nm-section-desc">
              {friendsRuns.length === 0 ? "Follow people to see their activity" : "Recently logged by people you follow"}
            </span>
          </div>
          <Link href="/friends" className="nm-see-all">
            {friendsRuns.length === 0 ? "Find friends →" : "See all →"}
          </Link>
        </div>
        {friendsRuns.length === 0 ? (
          <div className="nm-coming-soon">
            Follow people to see what they're reading here.
          </div>
        ) : (
          <div className="nm-run-grid">
            {friendsRuns.map((run) => (
              <RunCard key={run.id} run={run} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function RunRow({ label, description, slug, runs }) {
  return (
    <div className="nm-section">
      <div className="nm-section-header">
        <div>
          <span className="nm-section-label">{label}</span>
          {description && <span className="nm-section-desc">{description}</span>}
        </div>
        <Link href={`/browse/${slug}`} className="nm-see-all">
          See all →
        </Link>
      </div>
      <div className="nm-run-grid">
        {runs.map((run) => (
          <RunCard key={run.id} run={run} />
        ))}
      </div>
    </div>
  );
}

function RunCard({ run }) {
  function renderStars(rating) {
    if (!rating) return null;
    const outOfFive = rating / 2;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (outOfFive >= i) stars.push("★");
      else if (outOfFive >= i - 0.5) stars.push("½");
      else stars.push("☆");
    }
    return stars.join("");
  }

  return (
    <Link href={`/runs/${run.id}`} className="nm-run-card">
      {run.cover_url ? (
        <img src={run.cover_url} alt={run.title} className="nm-run-cover" />
      ) : (
        <div className="nm-run-cover nm-run-cover-placeholder">{run.title}</div>
      )}
      <div className="nm-run-meta">
        <div className="nm-run-title">{run.title}</div>
        {run.logged_by ? (
          <div className="nm-run-writer" style={{ color: "rgba(151,196,89,0.7)" }}>
            {run.logged_by}
            {run.logged_by_rating && (
              <span style={{ marginLeft: 4, color: "#97c459" }}>
                · {renderStars(run.logged_by_rating)}
              </span>
            )}
          </div>
        ) : (
          <div className="nm-run-writer">
            {run.creative_team?.writers?.join(", ") ?? ""}
          </div>
        )}
      </div>
    </Link>
  );
}