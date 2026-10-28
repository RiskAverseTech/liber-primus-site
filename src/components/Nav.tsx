"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  ["/", "Read"],
  ["/runes", "Runes"],
  ["/status", "Status"],
  ["/analysis", "Analysis"],
  ["/media", "Media"],
] as const;

export default function Nav() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="bar">
        <Link href="/" className="brand">Liber Primus</Link>
        <nav aria-label="Site">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</Link>
          ))}
          <a href="https://github.com/RiskAverseTech/cicada-ioc" target="_blank" rel="noopener">Research</a>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
