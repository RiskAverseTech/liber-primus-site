import { synced } from "./synced";
import { LETTERS, isRune, type Page } from "./runes-shared";
export { ARCHIVE_ITEM, ARCHIVE_ITEM_PAGE, LETTERS, RUNES, isRune, type Page } from "./runes-shared";

// Section titles and methods for the solved chunks, as the research repo's
// as-read page and the iddqd keys file state them.
const SOLVED: Record<number, { title: string; method: string }> = {
  1: { title: "A Warning", method: "Atbash, the rune alphabet reversed" },
  2: { title: "Welcome", method: "Vigenère with the key DIVINITY; a plaintext F is left unencrypted" },
  3: { title: "Welcome (continued), Wisdom", method: "Vigenère with the key DIVINITY; a plaintext F is left unencrypted" },
  4: { title: "Some Wisdom, Know This", method: "none; the runes read directly" },
  5: { title: "A Koan", method: "Atbash, then a shift of 3" },
  6: { title: "A Koan (continued)", method: "Atbash, then a shift of 3" },
  7: { title: "A Koan (continued)", method: "Atbash, then a shift of 3" },
  8: { title: "A Koan (end), An Instruction", method: "Atbash, then a shift of 3" },
  9: { title: "The Loss of Divinity", method: "none; the runes read directly" },
  10: { title: "The Loss of Divinity (continued)", method: "none; the runes read directly" },
  11: { title: "The Loss of Divinity (continued)", method: "none; the runes read directly" },
  12: { title: "The Loss of Divinity (end), Some Wisdom, An Instruction", method: "none; the runes read directly" },
  13: { title: "A Koan", method: "Vigenère with the key FIRFUMFERENFE" },
  14: { title: "A Koan (end)", method: "Vigenère with the key FIRFUMFERENFE" },
  15: { title: "An Instruction, Know This", method: "none; the runes read directly" },
  72: { title: "An End", method: "a stream of totients of the primes, φ(p); a plaintext F left unencrypted" },
  73: { title: "Parable", method: "none; the runes read directly" },
};

type PagesJson = { solved: { name: string; book_pages: number[]; plaintext: number[] }[] };

/** Image number for a transcription chunk: chunk 1 is image 01 (image 02 is the "Intus" title page); from chunk 2 on, image = chunk + 1. */
export function imageOf(chunk: number): number {
  return chunk === 1 ? 1 : chunk + 1;
}

function cleanChunk(raw: string): string {
  // keep runes, delimiters and the two-character code tokens; drop newlines and the
  // segment/chapter markers, which carry no text
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && l !== "$" && l !== "§")
    .join("");
}

export function loadPages(): Page[] {
  const master = synced("data/raw/iddqd__liber-primus__transcription--master.txt");
  const pagesJson = JSON.parse(synced("data/processed/pages.json")) as PagesJson;
  const chunks = master.split("%");
  if (chunks.length < 70) throw new Error("transcription has too few page chunks");

  // plaintext letters per solved chunk, walked from pages.json in reading order
  const readingByChunk = new Map<number, string[]>();
  for (const sec of pagesJson.solved) {
    let k = 0;
    for (const chunk of sec.book_pages) {
      const runes = [...(chunks[chunk] ?? "")].filter(isRune);
      const letters = runes.map(() => {
        const idx = sec.plaintext[k++];
        if (idx === undefined) throw new Error(`pages.json: plaintext for "${sec.name}" is shorter than its runes`);
        return LETTERS[idx];
      });
      readingByChunk.set(chunk, letters);
    }
    if (k !== sec.plaintext.length) {
      throw new Error(`pages.json: plaintext for "${sec.name}" has ${sec.plaintext.length} runes, transcription has ${k}`);
    }
  }

  const pages: Page[] = [];
  for (let chunk = 1; chunk < chunks.length; chunk++) {
    const text = cleanChunk(chunks[chunk]);
    const runeCount = [...text].filter(isRune).length;
    const inSecondPart = chunk >= 16 && chunk <= 73;
    if (runeCount === 0 && !inSecondPart) continue; // the trailing chapter marker
    const image = imageOf(chunk);
    const lp2 = chunk >= 16 && chunk <= 71 ? `LP2-${String(chunk - 16).padStart(2, "0")}` : null;
    const solved = chunk in SOLVED;
    const hasCodes = /[0-9A-Za-z]/.test(text);
    let note: string | null = null;
    if (runeCount === 0) note = "This page carries a grid of two-character codes and no runes; the codes are shown as transcribed.";
    else if (hasCodes) note = "Beside its runes this page carries a grid of two-character codes, shown as transcribed.";
    pages.push({
      chunk,
      image,
      lp2,
      solved,
      title: SOLVED[chunk]?.title ?? null,
      method: SOLVED[chunk]?.method ?? null,
      runeCount,
      text,
      reading: readingByChunk.get(chunk) ?? null,
      archiveFile: image >= 17 ? image - 17 : null,
      note,
    });
  }

  const total = pages.reduce((n, p) => n + p.runeCount, 0);
  const unsolved = pages.filter((p) => !p.solved && p.runeCount > 0);
  if (unsolved.length !== 55) throw new Error(`expected 55 unsolved pages with runes, found ${unsolved.length}`);
  if (pages.filter((p) => p.solved).length !== 17) throw new Error("expected 17 solved pages");
  if (total !== 2977 + 12956) console.warn(`rune total ${total} differs from the README's 2,977 + 12,956`);
  return pages;
}

