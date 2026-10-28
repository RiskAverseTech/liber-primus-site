import type { Metadata } from "next";
import RunesViewer from "./RunesViewer";
import { loadPages } from "@/lib/runes";

export const metadata: Metadata = { title: "Runes" };

export default function RunesPage() {
  const pages = loadPages();
  return (
    <div className="wrap wide">
      <h1 className="page-title">The pages, as runes</h1>
      <p className="lede">
        Each page of the book in the rune alphabet it was printed in, from the community transcription. On the
        solved pages the reading sits under each rune, in the book&rsquo;s own spelling. Word gaps and clause marks
        follow the transcription; a line that ends inside a word continues on the next line with no gap.
      </p>
      <RunesViewer pages={pages} />
    </div>
  );
}
