"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ARCHIVE_ITEM, ARCHIVE_ITEM_PAGE, isRune, type Page } from "@/lib/runes-shared";

type Tok =
  | { t: "rune"; ch: string; lat: string | null }
  | { t: "sep" }
  | { t: "clause" }
  | { t: "code"; s: string };
type Line = { toks: Tok[]; para: boolean };

/** Splits a transcribed chunk into lines of tokens; '/' is a line break, '&' a paragraph break. */
function tokenize(page: Page): Line[] {
  const lines: Line[] = [];
  let cur: Tok[] = [];
  let para = false;
  let k = 0;
  let code = "";
  const flushCode = () => { if (code) { cur.push({ t: "code", s: code }); code = ""; } };
  const endLine = () => { flushCode(); if (cur.length) lines.push({ toks: cur, para }); cur = []; para = false; };
  for (const ch of page.text) {
    if (isRune(ch)) { flushCode(); cur.push({ t: "rune", ch, lat: page.reading ? page.reading[k++] ?? null : null }); }
    else if (ch === "-") { flushCode(); cur.push({ t: "sep" }); }
    else if (ch === ".") { flushCode(); cur.push({ t: "clause" }); }
    else if (ch === "/") endLine();
    else if (ch === "&") { endLine(); para = true; }
    else if (/[0-9A-Za-z]/.test(ch)) code += ch;
  }
  endLine();
  return lines;
}

function label(p: Page): string {
  const img = String(p.image).padStart(2, "0");
  if (p.solved) return `Image ${img} · ${p.title}`;
  return `Image ${img} · ${p.lp2} · unsolved${p.runeCount === 0 ? ", codes only" : ""}`;
}

function imageFromHash(): number | null {
  const m = /^#image-(\d+)$/.exec(window.location.hash);
  return m ? Number(m[1]) : null;
}

export default function RunesViewer({ pages }: { pages: Page[] }) {
  const [includeUnsolved, setIncludeUnsolved] = useState(false);
  const [image, setImage] = useState(pages[0].image);

  const visible = useMemo(() => (includeUnsolved ? pages : pages.filter((p) => p.solved)), [pages, includeUnsolved]);
  const idx = Math.max(0, visible.findIndex((p) => p.image === image));
  const page = visible[idx] ?? visible[0];

  // the hash carries the page, so a link to one page works and the browser's back button steps through them
  useEffect(() => {
    const h = imageFromHash();
    if (h !== null) {
      const p = pages.find((x) => x.image === h);
      if (p) { if (!p.solved) setIncludeUnsolved(true); setImage(p.image); }
    }
    const onHash = () => {
      const n = imageFromHash();
      const p = n === null ? undefined : pages.find((x) => x.image === n);
      if (p) { if (!p.solved) setIncludeUnsolved(true); setImage(p.image); }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [pages]);

  const go = useCallback((p: Page) => {
    setImage(p.image);
    history.replaceState(null, "", `#image-${p.image}`);
    window.scrollTo({ top: 0 });
  }, []);
  const prev = idx > 0 ? visible[idx - 1] : null;
  const next = idx < visible.length - 1 ? visible[idx + 1] : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft" && prev) { e.preventDefault(); go(prev); }
      if (e.key === "ArrowRight" && next) { e.preventDefault(); go(next); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, go]);

  const lines = useMemo(() => tokenize(page), [page]);
  const img = String(page.image).padStart(2, "0");

  return (
    <>
      <div className="runes-controls">
        <div className="nav">
          <button type="button" onClick={() => prev && go(prev)} disabled={!prev} aria-label="Previous page">← Prev</button>
          <button type="button" onClick={() => next && go(next)} disabled={!next} aria-label="Next page">Next →</button>
        </div>
        <select aria-label="Page" value={page.image} onChange={(e) => { const p = pages.find((x) => x.image === Number(e.target.value)); if (p) go(p); }}>
          {visible.map((p) => <option key={p.image} value={p.image}>{label(p)}</option>)}
        </select>
        <label className="toggle">
          <input type="checkbox" checked={includeUnsolved} onChange={(e) => { setIncludeUnsolved(e.target.checked); if (!e.target.checked && !page.solved) go(pages[0]); }} />
          Include the 56 unsolved pages
        </label>
        <span className="hint">Page {idx + 1} of {visible.length}. The left and right arrow keys switch pages.</span>
      </div>

      <div className="page-head">
        <div>
          <h2>
            {page.solved ? <span className="red">{page.title}</span> : <>{page.lp2}, unsolved</>}
          </h2>
          <div className="meta">
            <span>Image {img} of 75</span>
            <span>Transcription chunk {page.chunk}</span>
            <span>{page.runeCount.toLocaleString("en")} runes</span>
            {page.method ? <span>Method: <code>{page.method}</code></span> : <span>No key is known</span>}
          </div>
        </div>
        <div className="thumb-wrap">
          {page.archiveFile !== null ? (
            <>
              <a className="thumb" href={`${ARCHIVE_ITEM}/${page.archiveFile}.jpg`} rel="noopener" title={`The page image as archived (file ${page.archiveFile}.jpg, byte-identical to the 2014 release)`}>
                <img src={`${ARCHIVE_ITEM}/${page.archiveFile}_thumb.jpg`} alt={`Thumbnail of page image ${img}`} loading="lazy" referrerPolicy="no-referrer" width={72} height={108} />
              </a>
              <p className="thumb-cap">archive.org, file {page.archiveFile}.jpg</p>
            </>
          ) : (
            <p className="no-image">First-part image; not in the <a href={ARCHIVE_ITEM_PAGE} rel="noopener">archived 2014 dump</a>.</p>
          )}
        </div>
      </div>

      {page.note ? <p className="page-note">{page.note}</p> : null}

      <div className={`folio${page.solved ? "" : " plain"}`} lang={page.solved ? "en" : undefined}>
        {lines.map((line, i) => (
          <div className={`line${line.para ? " para-start" : ""}`} key={i}>
            {line.toks.map((tok, j) => {
              if (tok.t === "rune") return (
                <span className="cell" key={j}>
                  <span className="rune">{tok.ch}</span>
                  {page.solved ? <span className="lat">{tok.lat ?? ""}</span> : null}
                </span>
              );
              if (tok.t === "sep") return <span className="sep" key={j} aria-hidden="true">·</span>;
              if (tok.t === "clause") return <span className="sep clause" key={j} aria-label="clause mark">.</span>;
              return <span className="code" key={j}>{tok.s}</span>;
            })}
          </div>
        ))}
      </div>

      <div className="folio-end">
        <span>
          {page.solved ? "Reading: the decrypted plaintext, rune for rune, in the book's spelling." : "Unsolved: shown as transcribed, no reading."}
        </span>
        <span>
          Transcription: rtkd/iddqd master file, <a href="https://github.com/RiskAverseTech/cicada-ioc/blob/main/data/raw/iddqd__liber-primus__transcription--master.txt" rel="noopener">pinned copy</a>
        </span>
      </div>
    </>
  );
}
