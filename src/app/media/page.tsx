import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import path from "node:path";

export const metadata: Metadata = { title: "Media" };

type Item = { title: string; date: string; url: string; kind?: string; note?: string };

function items(): Item[] {
  const file = path.join(process.cwd(), "content", "media.json");
  const j = JSON.parse(readFileSync(file, "utf8")) as { items?: Item[] };
  return (j.items ?? []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default function MediaPage() {
  const list = items();
  return (
    <div className="wrap">
      <h1 className="page-title">Media</h1>
      <p className="lede">Short videos and other material about the research, as they are made.</p>
      {list.length === 0 ? (
        <div className="media-empty">
          <b>Nothing here yet.</b>
          This page is a placeholder. Items are added to <code>content/media.json</code> in the site repository and appear here on the next build.
        </div>
      ) : (
        <ul className="media-list">
          {list.map((it) => (
            <li key={it.url}>
              <span className="kind">{it.kind ?? "link"}</span>
              <h2><a href={it.url} target="_blank" rel="noopener">{it.title}</a></h2>
              <time dateTime={it.date}>{it.date}</time>
              {it.note ? <p>{it.note}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
