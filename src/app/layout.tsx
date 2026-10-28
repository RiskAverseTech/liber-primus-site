import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, IBM_Plex_Sans, IBM_Plex_Mono, Noto_Sans_Runic } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { themeInitScript } from "@/components/ThemeToggle";
import { manifest } from "@/lib/synced";
import "./globals.css";

// Fonts are fetched at build time and served from this site, so a visit makes
// no request to a font service. Noto Sans Runic carries the Anglo-Saxon futhorc
// block (U+16A0–U+16FF); the stack in globals.css names system fallbacks.
const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-mono", display: "swap" });
const runic = Noto_Sans_Runic({ subsets: ["runic"], weight: ["400"], variable: "--font-runic", display: "swap" });

const SITE_URL = "https://liber-primus-site.vercel.app";
const DESCRIPTION =
  "Cicada 3301's Liber Primus: the 17 solved pages as text and as runes, the 55 unsolved pages as transcribed, and a measured account of what has been tested and what has not been found.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Liber Primus", template: "%s · Liber Primus" },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  // Share cards: the image comes from src/app/opengraph-image.tsx, generated at build time.
  openGraph: { type: "website", siteName: "Liber Primus", url: SITE_URL, title: "Liber Primus", description: DESCRIPTION, locale: "en" },
  twitter: { card: "summary_large_image", title: "Liber Primus", description: DESCRIPTION },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const m = manifest();
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} ${runic.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer sha={m.sha} date={m.date} />
        {/* Vercel Web Analytics: page views and referrers, no cookies, no cross-site identifier. */}
        <Analytics />
      </body>
    </html>
  );
}
