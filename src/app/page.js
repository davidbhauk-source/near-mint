import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";

export const revalidate = 3600 // recheck every hour

export const metadata = {
  title: "Near Mint — Track comic book runs",
  description: "Log, rate, and review comic book runs",
}

// Category definitions — add new rows here later by just adding to this array
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

  // Fetch all runs
  const { data: runs } = await supabase
    .from("runs")
    .select("*")
    .order("title")
    .range(0, 2000);

      

  const allRuns = runs ?? [];
 

  // Fetch most logged this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: recentLogs } = await supabase
    .from("readlogs") // change to your actual table name if different
    .select("run_id")
    .gte("created_at", oneWeekAgo.toISOString());

  // Count how many times each run was logged this week
  const logCounts = {};
  (recentLogs ?? []).forEach(({ run_id }) => {
    logCounts[run_id] = (logCounts[run_id] ?? 0) + 1;
  });

  // All-time log counts for sorting categories that aren't "popular this week"
const { data: allLogs } = await supabase
  .from("readlogs")
  .select("run_id");

const allTimeLogCounts = {};
(allLogs ?? []).forEach(({ run_id }) => {
  allTimeLogCounts[run_id] = (allTimeLogCounts[run_id] ?? 0) + 1;
});
  

  // Sort runs by log count, take top 12
  const popularThisWeek = [...allRuns]
    .filter((run) => logCounts[run.id])
    .sort((a, b) => (logCounts[b.id] ?? 0) - (logCounts[a.id] ?? 0))
    .slice(0, 12);

  // Fall back to most recent runs if nobody has logged anything yet
  const popularRow = popularThisWeek.length >= 3
    ? popularThisWeek
    : [...allRuns].slice(0, 12);


  return (
    <div className="nm-page-body">

      {/* Hero */}
      <div className="nm-hero">
        <div className="nm-eyebrow">Near Mint</div>
        <h1 className="nm-h1">Track the runs that shape you.</h1>
        <p className="nm-hero-sub">Log, rate, and review comic book runs</p>
      </div>



      {/* Popular this week row */}
      <RunRow
        label="Popular this week"
        description="Most logged in the last 7 days"
        slug="popular"
        runs={popularRow.slice(0, 6)}
      />

   {/* Category rows */}
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

      {/* Friends row — post-MVP placeholder */}
      <div className="nm-section nm-section-muted">
        <div className="nm-section-header">
          <div>
            <span className="nm-section-label">From your friends</span>
            <span className="nm-section-desc">Coming soon</span>
          </div>
        </div>
        <div className="nm-coming-soon">
          Add friends to see what they're reading
        </div>
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
  return (
    <Link href={`/runs/${run.id}`} className="nm-run-card">
      {run.cover_url ? (
        <img
          src={run.cover_url}
          alt={run.title}
          className="nm-run-cover"
        />
      ) : (
        <div className="nm-run-cover nm-run-cover-placeholder">
          {run.title}
        </div>
      )}
      <div className="nm-run-meta">
        <div className="nm-run-title">{run.title}</div>
        <div className="nm-run-writer">
          {run.creative_team?.writers?.join(", ") ?? ""}
        </div>
      </div>
    </Link>
  );
}

