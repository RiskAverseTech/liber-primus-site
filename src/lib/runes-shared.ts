// Types and constants shared by the build-time loader and the client-side viewer.
// No Node imports here: this file is bundled for the browser.

/** Gematria Primus: rune index 0..28 and the letter(s) each stands for. */
export const LETTERS = ["F","U","TH","O","R","C","G","W","H","N","I","J","EO","P","X","S","T","B","E","M","L","NG","OE","D","A","AE","Y","IA","EA"];
/** The prime each rune carries in the Gematria Primus: the first 29 primes, in rune order. */
export const PRIMES = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109];
export const RUNES = ["ᚠ","ᚢ","ᚦ","ᚩ","ᚱ","ᚳ","ᚷ","ᚹ","ᚻ","ᚾ","ᛁ","ᛄ","ᛇ","ᛈ","ᛉ","ᛋ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛝ","ᛟ","ᛞ","ᚪ","ᚫ","ᚣ","ᛡ","ᛠ"];

export const isRune = (ch: string) => {
  const c = ch.codePointAt(0) ?? 0;
  return c >= 0x16a0 && c <= 0x16ff;
};

/** One page of the book as the site shows it. */
export type Page = {
  /** Index of the chunk in the iddqd master transcription (1-based; the file's "book page"). */
  chunk: number;
  /** Image number in the complete 75-page set (00..74). */
  image: number;
  /** LP2-k label for the second part, else null. */
  lp2: string | null;
  solved: boolean;
  /** Section title(s) on the page and the method that opened it (solved pages only). */
  title: string | null;
  method: string | null;
  runeCount: number;
  /** The chunk text as transcribed: runes, '-' word, '.' clause, '/' line, '&' paragraph; other tokens are the two-character codes. */
  text: string;
  /** For solved pages: the plaintext letter(s) for each rune, in reading order. */
  reading: string[] | null;
  /** File number in the archive.org item ky2khlqdf7qdznac.onion, else null (first-part images are not in that dump). */
  archiveFile: number | null;
  note: string | null;
};

export const ARCHIVE_ITEM = "https://archive.org/download/ky2khlqdf7qdznac.onion";

/** CicadaSolvers' page for each first-part image (index = image number 00..16); their numbering matches this site's. */
export const SOLVERS_LP1 = "https://www.cicadasolvers.com/wiki/liber-primus/lp1";
export const SOLVERS_LP1_SLUGS = [
  "liber-primus-page", "a-warning", "intus", "welcome-pilgrim", "welcome-pilgrim-2", "the-primes-are-sacred",
  "a-koan", "a-koan-2", "a-koan-3", "a-koan-4", "the-loss-of-divinity", "the-loss-of-divinity-2",
  "the-loss-of-divinity-3", "the-loss-of-divinity-4", "107-jpg", "167-jpg", "229-jpg",
];

export const ARCHIVE_ITEM_PAGE = "https://archive.org/details/ky2khlqdf7qdznac.onion";
