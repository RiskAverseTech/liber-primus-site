import { ImageResponse } from "next/og";

// Home-screen icon (iOS wants a PNG): the same two runes as icon.svg, lagu (L) and peorth (P).
export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1f1b16" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <g fill="none" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 12v40M18 12l14 16" stroke="#d8513a" />
            <path d="M38 12v40M38 12l12 10v20L38 52" stroke="#f7f4ec" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
