import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/profile-client";

export async function generateMetadata() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { title: "Profile — Near Mint" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return {
    title: profile?.username ? `${profile.username} — Near Mint` : "Profile — Near Mint",
  };
}

export default async function ProfilePage() {
  const supabase = await createServerSupabase();

  // Get the real logged in user
  const { data: { user } } = await supabase.auth.getUser();

  // If not signed in, send to auth page
  if (!user) {
    redirect("/auth");
  }

  const userId = user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: logs } = await supabase
    .from("readlogs")
    .select("*, runs(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, runs(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const favouriteRunIds = profile?.favourite_runs ?? [];
  let favouriteRuns = [];
  if (favouriteRunIds.length > 0) {
    const { data: favRuns } = await supabase
      .from("runs")
      .select("*")
      .in("id", favouriteRunIds);
    favouriteRuns = favouriteRunIds
      .map((id) => favRuns?.find((r) => r.id === id))
      .filter(Boolean);
  }

  const safeLogs = logs ?? [];
  const safeReviews = reviews ?? [];

  const totalIssuesRead = safeLogs.reduce((sum, log) => sum + (log.issues_read ?? 0), 0);
  const reviewCount = safeReviews.length;
  const logCount = safeLogs.length;
  const readingCount = safeLogs.filter((l) => l.status === "Reading").length;

  const publisherCounts = {};
  safeLogs.forEach((log) => {
    const pub = log.runs?.publisher;
    if (pub) publisherCounts[pub] = (publisherCounts[pub] ?? 0) + 1;
  });
  const topPublisher = Object.entries(publisherCounts).sort((a, b) => b[1] - a[1])[0];

  const writerCounts = {};
  safeLogs.forEach((log) => {
    log.runs?.creative_team?.writers?.forEach((w) => {
      writerCounts[w] = (writerCounts[w] ?? 0) + 1;
    });
  });
  const topWriter = Object.entries(writerCounts).sort((a, b) => b[1] - a[1])[0];

  const artistCounts = {};
  safeLogs.forEach((log) => {
    log.runs?.creative_team?.pencilers?.forEach((a) => {
      artistCounts[a] = (artistCounts[a] ?? 0) + 1;
    });
  });
  const topArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0];

  const stats = {
    logCount,
    totalIssuesRead,
    reviewCount,
    reviewPct: logCount > 0 ? Math.round((reviewCount / logCount) * 100) : 0,
    topPublisher: topPublisher ? { name: topPublisher[0], count: topPublisher[1] } : null,
    topWriter: topWriter ? { name: topWriter[0], count: topWriter[1] } : null,
    topArtist: topArtist ? { name: topArtist[0], count: topArtist[1] } : null,
  };

  return (
    <ProfileClient
      profile={profile}
      logs={safeLogs}
      reviews={safeReviews}
      favouriteRuns={favouriteRuns}
      recentLogs={safeLogs.slice(0, 8)}
      stats={stats}
      readingCount={readingCount}
    />
  );
}