/**
 * GitHub's heading anchor rule, matching src/toc.py in the research repo:
 * lower-case; keep letters, digits, combining marks, spaces, hyphens and
 * underscores; drop everything else; spaces become hyphens; repeats get -1, -2.
 */
export function makeSlugger() {
  const seen = new Map<string, number>();
  return (text: string): string => {
    const t = text.trim().toLowerCase();
    let out = "";
    for (const ch of t) {
      if (ch === " ") out += "-";
      else if (ch === "-" || ch === "_" || /[\p{L}\p{N}\p{M}]/u.test(ch)) out += ch;
    }
    const n = seen.get(out) ?? 0;
    seen.set(out, n + 1);
    return n === 0 ? out : `${out}-${n}`;
  };
}

/**
 * Section number -> README anchor, for every "## N. ..." heading outside fenced
 * code. Phase 1 and Phase 2 both number sections 4 and 5; the later heading
 * wins, which is the one STATUS.md's "§4–7" refers to.
 */
export function sectionAnchors(readme: string): Record<string, string> {
  const slug = makeSlugger();
  const anchors: Record<string, string> = {};
  let fence = false;
  for (const line of readme.split("\n")) {
    if (line.startsWith("```")) { fence = !fence; continue; }
    if (fence) continue;
    const m = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const anchor = slug(m[2]);
    const num = /^(\d+)\.\s/.exec(m[2]);
    if (m[1].length === 2 && num) anchors[num[1]] = anchor;
  }
  return anchors;
}
