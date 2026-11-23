import { ImageResponse } from "next/og";

export const alt = "Near Mint";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#1a2e1a";      // --nm-dark
const TEXT = "#f5f2eb";    // --nm-cream
const ACCENT = "#97c459";  // --nm-accent

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: BG,
          color: TEXT,
        }}
      >
        <div style={{ display: "flex", fontSize: 110, fontWeight: 800 }}>
          Near Mint
        </div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 24, color: ACCENT }}>
          Track comic book runs, not just issues.
        </div>
      </div>
    ),
    { ...size }
  );
}