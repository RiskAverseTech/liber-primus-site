import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadPages } from "@/lib/runes";

// The share image (1200 x 630) for every page: generated once at build time.
// The three TrueType fonts in src/app/og-fonts/ (SIL OFL) are read from disk,
// so no network is needed; the runes are the opening of the Warning page.
export const dynamic = "force-static";
export const alt = "Liber Primus: the solved pages as text and runes, the unsolved pages as transcribed, and what the measurements show";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_DIR = path.join(process.cwd(), "src", "app", "og-fonts");
function font(file: string): ArrayBuffer {
  const b = readFileSync(path.join(FONT_DIR, file));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

export default async function Image() {
  const display = font("CormorantGaramond-SemiBold.ttf"), body = font("IBMPlexSans-Regular.ttf"), runic = font("NotoSansRunic-Regular.ttf");
  const pages = loadPages();
  const solved = pages.filter((p) => p.solved);
  const unsolved = pages.filter((p) => !p.solved && p.runeCount > 0);
  const unread = unsolved.reduce((n, p) => n + p.runeCount, 0);
  const opening = [...solved[0].text].filter((ch) => (ch.codePointAt(0) ?? 0) >= 0x16a0 && (ch.codePointAt(0) ?? 0) <= 0x16ff).slice(0, 24).join(" ");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f4ec", color: "#1f1b16", padding: "64px 72px 52px", fontFamily: "IBM Plex Sans" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Noto Sans Runic", fontSize: 34, color: "#9b2615", letterSpacing: 2, marginBottom: 26 }}>{opening}</div>
          <div style={{ display: "flex", fontFamily: "Cormorant Garamond", fontSize: 128, lineHeight: 1, letterSpacing: -1 }}>Liber Primus</div>
          <div style={{ display: "flex", fontSize: 34, color: "#5b544a", marginTop: 22, maxWidth: 980, lineHeight: 1.3 }}>
            The solved pages as text and as runes, the unsolved pages as transcribed, and what the measurements show.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderTop: "2px solid #d9d2c3", paddingTop: 22 }}>
          <div style={{ display: "flex", gap: 44 }}>
            {[[solved.length, "pages read"], [unsolved.length, "pages unread"], [unread.toLocaleString("en"), "runes unread"]].map(([n, l]) => (
              <div key={String(l)} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontFamily: "Cormorant Garamond", fontSize: 52, lineHeight: 1 }}>{n}</div>
                <div style={{ display: "flex", fontSize: 20, color: "#5b544a", marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 22, color: "#5b544a", textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div>liber-primus-site.vercel.app</div>
            <div>research: RiskAverseTech/cicada-ioc</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant Garamond", data: display, weight: 600, style: "normal" },
        { name: "IBM Plex Sans", data: body, weight: 400, style: "normal" },
        { name: "Noto Sans Runic", data: runic, weight: 400, style: "normal" },
      ],
    },
  );
}
