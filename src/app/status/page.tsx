import type { Metadata } from "next";
import { statusHtml } from "@/lib/status";
import { manifest } from "@/lib/synced";

export const metadata: Metadata = { title: "Status" };

export default function StatusPage() {
  const { html, readmeUrl, statusUrl } = statusHtml();
  const m = manifest();
  return (
    <div className="wrap wide status">
      <h1 className="page-title">Status</h1>
      <p className="lede">
        The research repository&rsquo;s one-page status box, as it stands on its main branch. Every section mark
        links to that section of the README.
      </p>
      <div className="status-links">
        <a href={readmeUrl} rel="noopener">README, all sections</a>
        <a href={statusUrl} rel="noopener">STATUS.md on GitHub</a>
      </div>
      <div className="scroll" dangerouslySetInnerHTML={{ __html: html }} />
      <p className="src-line">
        Fetched from <code>STATUS.md</code>{m.sha ? <> at commit <code>{m.sha.slice(0, 7)}</code></> : null} on {m.fetchedAt.slice(0, 10)}.
      </p>
    </div>
  );
}
