import type { Metadata } from "next";
import { asReadHtml } from "@/lib/status";
import { ARCHIVE_ITEM_PAGE } from "@/lib/runes-shared";

export const metadata: Metadata = { title: "Liber Primus, as read" };

const ELSEWHERE: { name: string; url: string; what: string }[] = [
  { name: "CicadaSolvers, Liber Primus", url: "https://www.cicadasolvers.com/wiki/liber-primus/", what: "Every page image of both parts, each with a page of its own." },
  { name: "Boxentriq, Liber Primus guide", url: "https://boxentriq.com/guides/cicada-3301-liber-primus", what: "How four of the solved pages were read, step by step, with cipher tools that accept the rune alphabet." },
  { name: "Uncovering Cicada wiki", url: "https://uncovering-cicada.fandom.com/wiki/Liber_Primus", what: "The solver community's record of the puzzles since 2012." },
  { name: "Cipher Museum, Cicada 3301", url: "https://ciphermuseum.com/ciphers/cicada-3301.html", what: "A walkthrough of the 2012 puzzle's stages, for the background to the book." },
  { name: "rtkd/iddqd", url: "https://github.com/rtkd/iddqd", what: "The transcription of the runes that this site and the research use." },
  { name: "archive.org", url: ARCHIVE_ITEM_PAGE, what: "The second-part page images, byte-identical to the 2014 release." },
];

/**
 * The research repo's reading page (docs/liber-primus-as-read.html), fetched at
 * build time; its markup is injected as designed and its styles live in
 * globals.css under .asread. A short orientation sits above it and a list of
 * other sites below, since the injected page assumes the reader knows the book.
 */
export default function ReadPage() {
  return (
    <>
      <aside className="wrap orient" aria-label="What this is">
        <p>
          <b>Liber Primus</b> is a book of page images written in a 29-rune alphabet, published in 2014 as the last
          stage of the Cicada 3301 puzzles. Nobody has claimed to have written it. Seventeen of its pages were read by
          the solver community; the 12,956 runes on the rest have not been. This site shows the book as it stands,
          the pages that have been read, and what the research has measured about the part that has not. It does not
          claim a decoding.
        </p>
      </aside>
      <div className="wrap asread" dangerouslySetInnerHTML={{ __html: asReadHtml() }} />
      <section className="wrap elsewhere" aria-labelledby="elsewhere-h">
        <h2 id="elsewhere-h">Elsewhere</h2>
        <p>Other sites on the book, each doing something this one does not.</p>
        <ul>
          {ELSEWHERE.map((e) => (
            <li key={e.url}>
              <a href={e.url} target="_blank" rel="noopener">{e.name}</a>
              <span>{e.what}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
