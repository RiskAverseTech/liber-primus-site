// Types and constants shared by the build-time loader and the client-side viewer.
// No Node imports here: this file is bundled for the browser.

/** Gematria Primus: rune index 0..28 and the letter(s) each stands for. */
export const LETTERS = ["F","U","TH","O","R","C","G","W","H","N","I","J","EO","P","X","S","T","B","E","M","L","NG","OE","D","A","AE","Y","IA","EA"];
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

export const ARCHIVE_ITEM_PAGE = "https://archive.org/details/ky2khlqdf7qdznac.onion";
