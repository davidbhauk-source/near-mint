import { ImageResponse } from "next/og";
import { createServerSupabase } from "@/lib/supabase-server";

export const alt = "Near Mint list";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#1a2e1a";      // --nm-dark
const TEXT = "#f5f2eb";    // --nm-cream
const ACCENT = "#97c459";  // --nm-accent
const MUTED = "#b9c4ae";   // softer cream-green for secondary text
const FAINT = "#7f9376";   // footer text

export default async function Image({ params }) {
  const supabase = await createServerSupabase();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();

  const { data: list } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .single();

  const visible = list && (list.is_public || list.user_id === user?.id);

  let title = "Near Mint";
  let byline = "Track comic book runs, not just issues.";
  let covers = [];

  if (visible) {
    const { data: owner } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", list.user_id)
      .single();

    const { data: listRuns } = await supabase
      .from("list_runs")
      .select("position, runs(cover_url)")
      .eq("list_id", id)
      .order("position", { ascending: true });

    const ownerName = owner?.display_name || owner?.username || "a reader";
    const total = listRuns?.length ?? 0;

    title = list.title || "Comic list";
    byline = `A list by ${ownerName} · ${total} run${total === 1 ? "" : "s"}`;
    covers = (listRuns ?? [])
      .map((lr) => lr.runs?.cover_url)
      .filter(Boolean)
      .slice(0, 4);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: BG,
          color: TEXT,
          padding: 70,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            paddingRight: covers.length ? 40 : 0,
          }}
        >
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: ACCENT }}>
            Near Mint
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>
              {title}
            </div>
            <div style={{ display: "flex", fontSize: 34, marginTop: 24, color: MUTED }}>
              {byline}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 28, color: FAINT }}>
            nearmint.site
          </div>
        </div>

        {covers.length > 0 && (
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            {covers.map((src, i) => (
              <img
                key={i}
                src={src}
                width={150}
                height={225}
                style={{
                  objectFit: "cover",
                  borderRadius: 8,
                  marginLeft: i === 0 ? 0 : -50,
                  border: `3px solid ${BG}`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}