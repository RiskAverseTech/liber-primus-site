// Numbers for the Analysis page, read from the research repo's result files at
// build time. Every parser throws when its line is missing, so a changed file
// fails the build instead of showing a stale or invented figure.
import { synced, RESEARCH_REPO_URL } from "./synced";
import { sectionAnchors } from "./slug";
import { RUNES, isRune } from "./runes-shared";

export type SpectrumRow = { lag: number; pairs: number; repeats: number; expected: number; z: number };
export type Cell = { mean: number; sd: number | null; z: number };
export type Rule = { name: string; cells: Cell[]; fails: string[] };
export type Lane = { lane: string; section: string; verdict: string; tests: number | null; closedNull: boolean };

export type AnalysisData = {
  stream: {
    runes: string; doublets: number[]; pageStarts: number[]; pairs: number; expected: number; z: number;
    ratioSolved: number; ratioUnsolved: number; solvedRepeats: number; solvedPairs: number;
  };
  spectrum: { rows: SpectrumRow[]; meanZ: number; sdZ: number; maxLag: number };
  echoes: {
    lag5: { observed: number; pairs: number; mean: number; sd: number; z: number; p: number };
    lag6: { hits: number; pairs: number; mean: number; sd: number; z: number };
    s: { count: number; expected: number; p: number };
    labs: string[];
    wordA: { runes: string; i: number }; wordB: { runes: string; i: number };
  };
  bakeoff: { stats: string[]; lp2: Record<string, number>; rules: Rule[]; threshold: number };
  power: { lengths: number[]; laneA: number[]; laneB: number[]; thresholdA: number; thresholdB: number; shortPages: { name: string; length: number }[] };
  sweep: { tests: number; testsLabel: string; lanesClosed: number; lanesTotal: number; breakthroughs: number; definition: string; lanes: Lane[]; asOf: string };
  links: Record<"deficit" | "spectrum" | "echoes" | "bakeoff" | "power" | "status", string>;
};

const num = (s: string) => Number(s.replace(/,/g, ""));
function must<T>(v: T | null | undefined, what: string): T {
  if (v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))) throw new Error(`analysis: could not read ${what}`);
  return v;
}
function match(text: string, re: RegExp, what: string): RegExpMatchArray {
  return must(text.match(re), what);
}

/** The 55 unsolved pages' runes in order, their within-page adjacent repeats, and the words. */
function streamFromTranscription() {
  const chunks = synced("data/raw/iddqd__liber-primus__transcription--master.txt").split("%");
  let runes = "";
  const doublets: number[] = [];
  const pageStarts: number[] = [];
  const words: string[] = [];
  for (let c = 16; c <= 71; c++) {
    const page = [...chunks[c]].filter(isRune).join("");
    if (!page) continue;
    pageStarts.push(runes.length);
    for (let i = 1; i < page.length; i++) if (page[i] === page[i - 1]) doublets.push(runes.length + i);
    runes += page;
    const text = [...chunks[c]].filter((ch) => ch !== "/" && ch !== "\n").join("");
    for (const w of text.split(/[-.&$§]+/)) {
      const r = [...w].filter(isRune).join("");
      if (r) words.push(r);
    }
  }
  return { runes, doublets, pageStarts, words };
}

export function loadAnalysis(): AnalysisData {
  const status = synced("STATUS.md");
  const audit = synced("results/doublet_audit.md");
  const closure = synced("results/closure_bundle.md");
  const kfixed = synced("results/kfixed_echo.md");
  const mech = synced("results/mechanism.md");
  const power = synced("results/power.md");
  const spec = synced("results/lag_spectrum.md");
  const ledger = JSON.parse(synced("ledger.json")) as { head: string; breakthroughs: number; breakthrough_definition: string; lanes: { section: string; lane: string; tests: number | null; verdict: string }[] };
  const anchors = sectionAnchors(synced("README.md"));
  const link = (n: string) => `${RESEARCH_REPO_URL}#${must(anchors[n], `README anchor for section ${n}`)}`;

  // 1. the repeat deficit
  const a = match(audit, /\| unsolved ciphertext \| (\d+) \| (\d+) \| (\d+) \| [\d.]+ \| (-?[\d.]+) \|/, "doublet_audit unsolved row");
  const pooled = match(closure, /Polyalphabetic solved pages pooled: (\d+) repeats in ([\d,]+) pairs .*?ratio ([\d.]+)\. Unsolved section: (\d+) in ([\d,]+) pairs, expected ([\d.]+), ratio ([\d.]+)\./, "closure_bundle pooled ratios");
  const st = streamFromTranscription();
  if (st.runes.length !== num(a[1])) throw new Error(`analysis: transcription has ${st.runes.length} unsolved runes, doublet_audit says ${a[1]}`);
  if (st.doublets.length !== num(a[3]) || num(pooled[4]) !== num(a[3])) throw new Error(`analysis: ${st.doublets.length} repeats counted, doublet_audit says ${a[3]}`);
  const stream = {
    runes: st.runes, doublets: st.doublets, pageStarts: st.pageStarts, pairs: num(a[2]),
    expected: Math.round(num(pooled[6])), z: num(a[4]),
    solvedRepeats: num(pooled[1]), solvedPairs: num(pooled[2]), ratioSolved: num(pooled[3]), ratioUnsolved: num(pooled[7]),
  };

  // 2. the lag spectrum
  const rows: SpectrumRow[] = [];
  for (const m of spec.matchAll(/^\| (\d+) \| ([\d,]+) \| (\d+) \| (\d+) \| ([+-]?[\d.]+) \|/gm)) {
    rows.push({ lag: num(m[1]), pairs: num(m[2]), repeats: num(m[3]), expected: num(m[4]), z: num(m[5]) });
  }
  if (rows.length < 10 || rows[0].lag !== 1) throw new Error("analysis: lag_spectrum table not found");
  const sm = match(spec, /Lags 2–(\d+): mean z (-?[\d.]+), sd ([\d.]+)/, "lag_spectrum summary");
  const spectrum = { rows, maxLag: num(sm[1]), meanZ: num(sm[2]), sdZ: num(sm[3]) };

  // 3. the within-word echoes
  const k5 = match(kfixed, /^\| 5 \| (\d+) \| ([\d.]+) ± ([\d.]+) \| ([+-][\d.]+) \| ([\d.]+) \|/m, "kfixed_echo lag-5 row");
  const e6 = match(closure, /^\| 6 \| ([\d,]+) \| ([\d.]+) ± ([\d.]+) \| (\d+) \(z ([+-][\d.]+)\)/m, "closure_bundle lag-6 row");
  const pairs5 = match(closure, /^\| 5 \| ([\d,]+) \|/m, "closure_bundle lag-5 pairs");
  const sS = match(status, /(\d+) of the pairs S \(([\d.]+) expected, p ([\d.]+)\)/, "STATUS S-carrier figures");
  const R = RUNES;
  const idx = (ch: string) => R.indexOf(ch);
  let n5 = 0, n6 = 0, nS = 0;
  const both: { runes: string; i5: number; i6: number }[] = [];
  let bestA: { runes: string; i: number } | null = null, bestB: { runes: string; i: number } | null = null;
  for (const w of st.words) {
    const r = [...w];
    let i5 = -1, i6 = -1;
    for (let i = 5; i < r.length; i++) if (r[i] === r[i - 5]) { n5++; if (r[i] === "ᛋ") nS++; if (i5 < 0) i5 = i; }
    for (let i = 6; i < r.length; i++) if (idx(r[i]) === (((24 - 2 * idx(r[i - 6])) % 29) + 29) % 29) { n6++; if (i6 < 0) i6 = i; }
    if (i5 >= 0 && (!bestA || r.length > [...bestA.runes].length)) bestA = { runes: w, i: i5 };
    if (i6 >= 0 && (!bestB || r.length > [...bestB.runes].length)) bestB = { runes: w, i: i6 };
    if (i5 >= 0 && i6 >= 0) both.push({ runes: w, i5, i6 });
  }
  if (n5 !== num(k5[1])) throw new Error(`analysis: counted ${n5} lag-5 equal pairs, kfixed_echo says ${k5[1]}`);
  if (n6 !== num(e6[4])) throw new Error(`analysis: counted ${n6} lag-6 hits, closure_bundle says ${e6[4]}`);
  if (nS !== num(sS[1])) throw new Error(`analysis: counted ${nS} S-carried pairs, STATUS says ${sS[1]}`);
  const twin = both.sort((x, y) => [...y.runes].length - [...x.runes].length)[0];
  const echoes = {
    lag5: { observed: num(k5[1]), pairs: num(pairs5[1]), mean: num(k5[2]), sd: num(k5[3]), z: num(k5[4]), p: num(k5[5]) },
    lag6: { hits: num(e6[4]), pairs: num(e6[1]), mean: num(e6[2]), sd: num(e6[3]), z: num(e6[5]) },
    s: { count: num(sS[1]), expected: num(sS[2]), p: num(sS[3]) },
    labs: ["ZzNible", "pnotisdev"],
    wordA: twin ? { runes: twin.runes, i: twin.i5 } : must(bestA, "a word with a lag-5 pair"),
    wordB: twin ? { runes: twin.runes, i: twin.i6 } : must(bestB, "a word with a lag-6 hit"),
  };

  // 4. the mechanism bake-off
  const header = match(mech, /^\| rule \| (.*?) \| verdict \|$/m, "mechanism table header");
  const stats = header[1].split(" | ").map((s) => s.trim());
  const lp2Line = match(mech, /LP2's own values: (.*?)\./, "mechanism LP2 values")[1];
  const lp2: Record<string, number> = {};
  for (const m of lp2Line.matchAll(/([A-Za-z0-9_]+) ([\d.]+)/g)) lp2[m[1]] = num(m[2]);
  const rules: Rule[] = [];
  const threshold = 3;
  for (const line of mech.split("\n")) {
    const m = /^\| ([^|]+?) \| (.*) \| fails: (.*) \|$/.exec(line);
    if (!m || m[1] === "rule") continue;
    const cells = m[2].split(" | ").map((c) => {
      const cm = must(/^([\d.]+)(?:±([\d.]+))? \(z ([+-]?[\d.]+)\)$/.exec(c.trim()), `mechanism cell "${c}"`);
      return { mean: num(cm[1]), sd: cm[2] ? num(cm[2]) : null, z: num(cm[3]) };
    });
    if (cells.length !== stats.length) throw new Error(`analysis: rule ${m[1]} has ${cells.length} cells for ${stats.length} statistics`);
    const fails = m[3].split(",").map((s) => s.trim());
    const red = stats.filter((_, i) => Math.abs(cells[i].z) > threshold);
    if (red.join() !== fails.join()) throw new Error(`analysis: rule ${m[1]}: |z| > ${threshold} gives ${red.join(", ")} but the file says fails: ${fails.join(", ")}`);
    rules.push({ name: m[1].trim(), cells, fails });
  }
  if (rules.length < 10) throw new Error("analysis: mechanism table has too few rules");
  const bakeoff = { stats, lp2, rules, threshold };

  // 5. detection power by page length
  const lane = (title: string) => {
    const sec = must(power.split(`## ${title}`)[1], `power.md ${title}`).split("\n## ")[0];
    const out: { length: number; all: number }[] = [];
    for (const m of sec.matchAll(/^\| (\d+) \|.*\*\*([\d.]+)\*\* \|$/gm)) out.push({ length: num(m[1]), all: num(m[2]) });
    if (out.length < 5) throw new Error(`analysis: power table for ${title} not found`);
    return out;
  };
  const A = lane("Lane A"), B = lane("Lane B");
  if (A.map((r) => r.length).join() !== B.map((r) => r.length).join()) throw new Error("analysis: power lanes list different lengths");
  const thA = match(power, /Lane A: the weakest family reaches 80 % power at (\d+) runes/, "power.md lane A threshold");
  const thB = match(power, /Lane B: the weakest family reaches 80 % power at (\d+) runes; (\d+) of 55 pages are shorter: (.*)$/m, "power.md lane B short pages");
  const shortPages = [...thB[3].matchAll(/(LP2-\d+) \((\d+)\)/g)].map((m) => ({ name: m[1], length: num(m[2]) }));
  if (shortPages.length !== num(thB[2])) throw new Error("analysis: short-page list does not match its count");
  const powerData = { lengths: A.map((r) => r.length), laneA: A.map((r) => r.all), laneB: B.map((r) => r.all), thresholdA: num(thA[1]), thresholdB: num(thB[1]), shortPages };

  // 6. the sweep
  const tests = ledger.lanes.reduce((n, l) => n + (l.tests ?? 0), 0);
  const testsLabel = match(status, /\| Decoder tests run \| ([^|]+?),/, "STATUS tests row")[1].trim();
  const lanesRow = match(status, /\| Lanes closed null \| (\d+) of (\d+)/, "STATUS lanes row");
  const lanes: Lane[] = ledger.lanes.map((l) => ({ lane: l.lane, section: l.section, verdict: l.verdict, tests: l.tests, closedNull: l.verdict.startsWith("null") }));
  if (lanes.filter((l) => l.closedNull).length !== num(lanesRow[1]) || lanes.length !== num(lanesRow[2])) {
    throw new Error(`analysis: ledger has ${lanes.filter((l) => l.closedNull).length} null lanes of ${lanes.length}, STATUS says ${lanesRow[1]} of ${lanesRow[2]}`);
  }
  if (Math.round(tests / 1e6) !== num(testsLabel.replace(/ million/, ""))) throw new Error(`analysis: ledger tests sum ${tests} does not round to STATUS's "${testsLabel}"`);
  const sweep = { tests, testsLabel, lanesClosed: num(lanesRow[1]), lanesTotal: num(lanesRow[2]), breakthroughs: ledger.breakthroughs, definition: ledger.breakthrough_definition, lanes, asOf: ledger.head };

  return {
    stream, spectrum, echoes, bakeoff, power: powerData, sweep,
    links: { deficit: link("4"), spectrum: link("37"), echoes: link("42"), bakeoff: link("47"), power: link("23"), status: `${RESEARCH_REPO_URL}/blob/main/STATUS.md` },
  };
}
