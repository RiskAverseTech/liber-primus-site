import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, IBM_Plex_Sans, IBM_Plex_Mono, Noto_Sans_Runic } from "next/font/google";
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

export const metadata: Metadata = {
  title: { default: "Liber Primus", template: "%s · Liber Primus" },
  description: "Cicada 3301's Liber Primus: the solved pages as text and as runes, the unsolved pages as transcribed, and the standing of the research.",
  robots: { index: true, follow: true },
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
      </body>
    </html>
  );
}
