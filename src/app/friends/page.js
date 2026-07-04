import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import FriendsClient from "@/components/friends-client";

export const metadata = {
  title: "Friends — Near Mint",
};

export default async function FriendsPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Get people this user follows
  const { data: following } = await supabase
    .from("follows")
    .select("following_id, profiles!follows_following_id_fkey(id, username, display_name)")
    .eq("follower_id", user.id);

  // Get this user's followers
  const { data: followers } = await supabase
    .from("follows")
    .select("follower_id, profiles!follows_follower_id_fkey(id, username, display_name)")
    .eq("following_id", user.id);

  const followingList = (following ?? []).map((f) => f.profiles).filter(Boolean);
  const followerList = (followers ?? []).map((f) => f.profiles).filter(Boolean);
  const followingIds = followingList.map((p) => p.id);

  return (
    <div className="nm-page-body" style={{ maxWidth: 600 }}>
      <div className="auth-header">
        <div className="nm-eyebrow">Near Mint</div>
        <h1 className="auth-title">Friends</h1>
        <p className="auth-sub">Find readers and see what they're logging.</p>
      </div>
      <FriendsClient
        following={followingList}
        followers={followerList}
        followingIds={followingIds}
        currentUserId={user.id}
      />
    </div>
  );
}