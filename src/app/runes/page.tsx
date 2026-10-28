import type { Metadata } from "next";
import RunesViewer from "./RunesViewer";
import { loadPages } from "@/lib/runes";
import { LETTERS, PRIMES, RUNES } from "@/lib/runes-shared";

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
      <details className="gp-key">
        <summary>The key: 29 runes, the letters they stand for, their index and their prime</summary>
        <p>
          The book&rsquo;s alphabet is the Gematria Primus, 29 runes in a fixed order. Each rune stands for a letter
          or letter pair, has an index from 0 to 28, and carries one of the first 29 primes. The solved pages&rsquo;
          methods (Atbash, a shift, Vigen&egrave;re, the totient stream) all work on the index.
        </p>
        <table>
          <thead>
            <tr><th scope="col">Rune</th><th scope="col">Letter</th><th scope="col">Index</th><th scope="col">Prime</th></tr>
          </thead>
          <tbody>
            {RUNES.map((r, i) => (
              <tr key={r}>
                <td className="rune">{r}</td>
                <td>{LETTERS[i]}</td>
                <td>{i}</td>
                <td>{PRIMES[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <RunesViewer pages={pages} />
    </div>
  );
}
