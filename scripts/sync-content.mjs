// Fetches the content files this site is built from out of the research
// repository's main branch and writes them under content/synced/.
//
// Runs before every build (see package.json "build"). Fails with a non-zero
// exit and a plain message if any file cannot be fetched, is empty, or does
// not look like the file it should be, so a broken deploy never goes out with
// stale or missing content.
//
// Set CICADA_IOC_DIR to a local checkout to copy from disk instead of the
// network (useful offline); CICADA_IOC_REF picks a branch or commit (default main).

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "RiskAverseTech/cicada-ioc";
const REF = process.env.CICADA_IOC_REF || "main";
const LOCAL = process.env.CICADA_IOC_DIR || "";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "content", "synced");

// path in the research repo -> a check that the fetched text is the right file
const FILES = [
  ["STATUS.md", (t) => t.includes("# Status box")],
  ["README.md", (t) => /^## \d+\. /m.test(t)],
  ["docs/liber-primus-as-read.html", (t) => t.includes('<div class="wrap">')],
  ["data/processed/solved_plaintext_latin.txt", (t) => t.includes("book pages")],
  ["data/processed/pages.json", (t) => t.trimStart().startsWith("{") && t.includes('"solved"')],
  ["data/raw/iddqd__liber-primus__transcription--master.txt", (t) => t.split("%").length > 70],
  ["data/images/PROVENANCE.md", (t) => t.includes("ky2khlqdf7qdznac.onion")],
  // the Analysis page's numbers
  ["ledger.json", (t) => t.trimStart().startsWith("{") && t.includes('"lanes"')],
  ["results/doublet_audit.md", (t) => t.includes("| unsolved ciphertext |")],
  ["results/closure_bundle.md", (t) => t.includes("Polyalphabetic solved pages pooled")],
  ["results/kfixed_echo.md", (t) => t.includes("K-fixed null")],
  ["results/mechanism.md", (t) => t.includes("LP2's own values")],
  ["results/power.md", (t) => t.includes("## Lane B")],
  ["results/lag_spectrum.md", (t) => t.includes("| lag | pairs | repeats |")],
];

async function fetchText(repoPath) {
  if (LOCAL) {
    return readFile(path.join(LOCAL, repoPath), "utf8");
  }
  const url = `https://raw.githubusercontent.com/${REPO}/${REF}/${repoPath}`;
  const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function commitInfo() {
  if (LOCAL) return { sha: null, date: null, note: `copied from ${LOCAL}` };
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/commits/${REF}`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "liber-primus-site sync" },
    });
    if (!res.ok) return { sha: null, date: null, note: `commit lookup answered HTTP ${res.status}` };
    const j = await res.json();
    return { sha: j.sha ?? null, date: j.commit?.committer?.date ?? null, note: null };
  } catch (e) {
    return { sha: null, date: null, note: `commit lookup failed: ${e.message}` };
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const manifest = { repo: REPO, ref: REF, fetchedAt: new Date().toISOString(), files: [] };
  const failures = [];

  for (const [repoPath, looksRight] of FILES) {
    try {
      const text = await fetchText(repoPath);
      if (!text || !text.trim()) throw new Error("empty file");
      if (!looksRight(text)) throw new Error("content does not look like the expected file");
      const dest = path.join(OUT, repoPath);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, text, "utf8");
      const sha256 = createHash("sha256").update(text).digest("hex");
      manifest.files.push({ path: repoPath, bytes: Buffer.byteLength(text), sha256 });
      console.log(`synced ${repoPath} (${Buffer.byteLength(text)} bytes)`);
    } catch (e) {
      failures.push(`${repoPath}: ${e.message}`);
    }
  }

  if (failures.length) {
    console.error("\nsync-content failed; the build cannot continue:");
    for (const f of failures) console.error("  - " + f);
    process.exit(1);
  }

  Object.assign(manifest, await commitInfo());
  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`manifest written; source commit ${manifest.sha ?? "unknown"}${manifest.note ? " (" + manifest.note + ")" : ""}`);
}

main().catch((e) => {
  console.error("sync-content failed:", e.message);
  process.exit(1);
});
