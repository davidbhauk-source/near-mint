import { createServerSupabase } from "@/lib/supabase-server";
import Link from "next/link";
import BrowseCategoryClient from "@/components/browse-category-client";

const CATEGORY_CONFIG = {
  popular: {
    label: "Popular this week",
    description: "Most logged in the last 7 days",
  },
  ongoing: {
    label: "Ongoing runs",
    description: "Still being published",
    filter: (run) => run.end_year?.toLowerCase() === "present"
  },
  classic: {
  label: "Classic runs",
  description: "The ones that defined the medium",
  filter: (run) => run.tags?.includes("classic"),
},
short: {
  label: "Short runs",
  description: "Under 20 issues — great starting points",
  filter: (run) => run.tags?.includes("short"),
},
  decade: {
    label: "Browse by decade",
    description: "Runs by era",
  },
  length: {
    label: "Browse by length",
    description: "Runs by issue count",
  },
}

export default async function CategoryPage({ params, searchParams }) {
  const supabase = await createServerSupabase();
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const { category } = resolvedParams;

  const config = CATEGORY_CONFIG[category];
  if (!config) {
    return (
      <div className="nm-page-body">
        <p style={{ color: "rgba(245,242,235,0.4)" }}>Category not found.</p>
      </div>
    );
  }

  if (category === "decade") {
    config.label = `Runs from the ${resolvedSearch.decade ?? "2000"}s`;
    config.description = `All runs that started in the ${resolvedSearch.decade ?? "2000"}s`;
  }
  if (category === "length") {
    const labels = {
      short: "Short runs (1–20 issues)",
      medium: "Medium runs (21–50 issues)",
      long: "Long runs (51–100 issues)",
      epic: "Epic runs (100+ issues)"
    };
    config.label = labels[resolvedSearch.len ?? "short"];
    config.description = "";
  }

  const { data: allRuns } = await supabase
    .from("runs")
    .select("*")
    .range(0, 5000);


  const { data: allLogs } = await supabase
    .from("readlogs")
    .select("run_id");

  const logCounts = {};
  (allLogs ?? []).forEach(({ run_id }) => {
    logCounts[run_id] = (logCounts[run_id] ?? 0) + 1;
  });

  const runsWithLogCounts = (allRuns ?? []).map((run) => ({
    ...run,
    log_count: logCounts[run.id] ?? 0,
  }));

  let runs = runsWithLogCounts;

  if (category === "popular") {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const { data: recentLogs } = await supabase
      .from("readlogs")
      .select("run_id")
      .gte("created_at", oneWeekAgo.toISOString());

    const weekLogCounts = {};
    (recentLogs ?? []).forEach(({ run_id }) => {
      weekLogCounts[run_id] = (weekLogCounts[run_id] ?? 0) + 1;
    });

    const popular = runs
      .filter((run) => weekLogCounts[run.id])
      .sort((a, b) => (weekLogCounts[b.id] ?? 0) - (weekLogCounts[a.id] ?? 0));

    runs = popular.length >= 3 ? popular : runs.sort((a, b) => a.title.localeCompare(b.title));
  } else if (config.filter) {
    runs = runs.filter(config.filter);
  } else if (category === "decade") {
    const decade = parseInt(resolvedSearch.decade ?? "2000");
    runs = runs.filter((r) => r.start_year >= decade && r.start_year < decade + 10);
  } else if (category === "length") {
    const len = resolvedSearch.len ?? "short";
    const ranges = {
      short:  { min: 1,   max: 20 },
      medium: { min: 21,  max: 50 },
      long:   { min: 51,  max: 100 },
      epic:   { min: 101, max: Infinity },
    };
    const range = ranges[len] ?? ranges.short;
    runs = runs.filter((r) =>
      r.issue_count !== null &&
      r.issue_count >= range.min &&
      (range.max === Infinity || r.issue_count <= range.max)
    );
  }

  return (
    <div className="nm-page-body">
      <Link href="/" className="back-link">← Home</Link>

      <div className="cat-header">
        <h1 className="cat-title">{config.label}</h1>
        <p className="cat-desc">{config.description} · {runs.length} runs</p>
      </div>

      <BrowseCategoryClient runs={runs} />
    </div>
  );
}