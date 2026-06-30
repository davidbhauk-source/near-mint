import { createServerSupabase } from "@/lib/supabase-server";
import SearchClient from "@/components/search-client";

export const metadata = {
  title: "Search — Near Mint",
  description: "Search comic book runs by title, writer, artist, or publisher.",
};

export default async function SearchPage() {
  const supabase = await createServerSupabase();

  const { data: runs } = await supabase
    .from("runs")
    .select("*")
    .order("title")
    .range(0, 2000);

  // Fetch average ratings
  const { data: reviews } = await supabase
    .from("reviews")
    .select("run_id, rating");

  // Build average rating per run
  const ratingMap = {};
  (reviews ?? []).forEach(({ run_id, rating }) => {
    if (!ratingMap[run_id]) ratingMap[run_id] = [];
    ratingMap[run_id].push(rating);
  });

  const avgRatings = {};
  Object.entries(ratingMap).forEach(([run_id, ratings]) => {
    avgRatings[run_id] = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  });

  // Attach avg rating to each run
  const runsWithRatings = (runs ?? []).map((run) => ({
    ...run,
    avg_rating: avgRatings[run.id] ?? null,
  }));

  // Top rated for the browse state sidebar
  const topRated = [...runsWithRatings]
    .filter((r) => r.avg_rating)
    .sort((a, b) => b.avg_rating - a.avg_rating)
    .slice(0, 4);

  return <SearchClient runs={runsWithRatings} topRated={topRated} />;
}