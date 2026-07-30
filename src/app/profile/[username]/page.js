import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PublicProfileClient from "@/components/public-profile-client";

export default async function PublicProfilePage({ params }) {
  const supabase = await createServerSupabase();
  const resolvedParams = await params;
  const { username } = resolvedParams;

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  // Redirect to own profile if viewing yourself
  if (currentUser?.id === profile.id) {
    const { redirect } = await import("next/navigation");
    redirect("/profile");
  }

  const { data: logs } = await supabase
    .from("readlogs")
    .select("*, runs(*)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, runs(*)")
    .eq("user_id", profile.id)
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

  // Check if current user follows this profile
  let isFollowing = false;
  if (currentUser) {
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profile.id)
      .single();
    isFollowing = !!follow;
  }

  // Follower/following counts
  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  const safeLogs = logs ?? [];
  const safeReviews = reviews ?? [];

  return (
    <PublicProfileClient
      profile={profile}
      logs={safeLogs}
      reviews={safeReviews}
      favouriteRuns={favouriteRuns}
      recentLogs={safeLogs.slice(0, 8)}
      isFollowing={isFollowing}
      followerCount={followerCount ?? 0}
      followingCount={followingCount ?? 0}
      currentUserId={currentUser?.id ?? null}
    />
  );
}