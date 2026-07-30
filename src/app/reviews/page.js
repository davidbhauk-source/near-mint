import { createServerSupabase } from "@/lib/supabase-server";
import ReviewsClient from "@/components/reviews-client";

export const metadata = {
  title: "Reviews — Near Mint",
};

export const revalidate = 0;

export default async function ReviewsPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, runs(id, title, cover_url)")
    .order("created_at", { ascending: false })
    .range(0, 200);

  const safeReviews = reviews ?? [];

  // Fetch profiles separately
  const reviewerIds = [...new Set(safeReviews.map(r => r.user_id))];
  let profileMap = {};
  if (reviewerIds.length > 0) {
    const { data: reviewProfiles } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", reviewerIds);
    (reviewProfiles ?? []).forEach(p => {
      profileMap[p.id] = p;
    });
  }

  // Fetch likes
  const { data: likes } = await supabase
    .from("review_likes")
    .select("review_id, user_id");

  const likeCounts = {};
  const userLikes = new Set();
  (likes ?? []).forEach(({ review_id, user_id }) => {
    likeCounts[review_id] = (likeCounts[review_id] ?? 0) + 1;
    if (user_id === user?.id) userLikes.add(review_id);
  });

  const reviewsWithData = safeReviews.map(r => ({
    ...r,
    profiles: profileMap[r.user_id] ?? null,
    like_count: likeCounts[r.id] ?? 0,
    user_liked: userLikes.has(r.id),
    reviewer_score: r.score,
  }));

  return (
    <div className="nm-page-body">
      <div className="auth-header">
        <div className="nm-eyebrow">Near Mint</div>
        <h1 className="auth-title">Reviews</h1>
        <p className="auth-sub">What the community is reading and thinking.</p>
      </div>
      <ReviewsClient
        reviews={reviewsWithData}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}