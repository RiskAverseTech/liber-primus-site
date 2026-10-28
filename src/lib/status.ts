import { marked } from "marked";
import { sectionAnchors } from "./slug";
import { synced, RESEARCH_REPO_URL } from "./synced";

const README_URL = `${RESEARCH_REPO_URL}#readme`;

/** STATUS.md rendered to HTML, with every "§N" turned into a link to that README section. */
export function statusHtml(): { html: string; readmeUrl: string; statusUrl: string } {
  const md = synced("STATUS.md").replace(/^# Status box\s*/m, "");
  const anchors = sectionAnchors(synced("README.md"));
  let html = marked.parse(md, { gfm: true, async: false }) as string;
  html = html.replace(/§(\d+)/g, (m, n: string) => {
    const a = anchors[n];
    return a ? `<a href="${RESEARCH_REPO_URL}#${a}" class="sec" title="README section ${n}">§${n}</a>` : m;
  });
  return { html, readmeUrl: README_URL, statusUrl: `${RESEARCH_REPO_URL}/blob/main/STATUS.md` };
}

/** The inner HTML of the research repo's designed reading page (docs/liber-primus-as-read.html). */
export function asReadHtml(): string {
  const page = synced("docs/liber-primus-as-read.html");
  const start = page.indexOf('<div class="wrap">');
  const end = page.lastIndexOf("</div>");
  if (start < 0 || end < start) throw new Error("liber-primus-as-read.html: could not find the .wrap block");
  return page.slice(start + '<div class="wrap">'.length, end);
}
