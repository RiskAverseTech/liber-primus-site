"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AnalysisData, Rule } from "@/lib/analysis";

/* ---------- playhead: runs only in view, pauses on hover or focus, respects reduced motion ---------- */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Progress 0..1 over `duration` ms, looping with a hold at the end; frozen while hovered, focused, off screen, or under reduced motion. */
function usePlayhead(duration: number, hold = 1600) {
  const ref = useRef<HTMLElement>(null);
  const [t, setT] = useState(0);
  const [visible, setVisible] = useState(false);
  const [held, setHeld] = useState(false);
  const reduced = useReducedMotion();
  const elapsed = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) { setT(1); return; }
    if (!visible || held) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      elapsed.current += now - last;
      last = now;
      const cycle = duration + hold;
      const e = elapsed.current % cycle;
      setT(Math.min(1, e / duration));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible, held, reduced, duration, hold]);

  const bind = {
    onPointerEnter: () => setHeld(true),
    onPointerLeave: () => setHeld(false),
    onFocus: () => setHeld(true),
    onBlur: () => setHeld(false),
  };
  return { ref, t, held: held || reduced, bind };
}

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
/** Progress of slot k of n within t. */
const slot = (t: number, k: number, n: number, overlap = 1) => clamp((t * n - k) / overlap);
const fmt = (n: number) => n.toLocaleString("en");

function Panel({ title, caption, link, children, ph, index }: { title: string; caption: ReactNode; link: { href: string; label: string }; children: ReactNode; ph: ReturnType<typeof usePlayhead>; index: number }) {
  return (
    <section className={`panel${ph.held ? " held" : ""}`} ref={ph.ref as React.RefObject<HTMLElement>} tabIndex={0} aria-label={title} {...ph.bind}>
      <div className="panel-head">
        <span className="n">{index}</span>
        <h2>{title}</h2>
        <span className="state" aria-live="off">{ph.held ? "holding" : ""}</span>
      </div>
      <div className="viz">{children}</div>
      <p className="caption">{caption} <a href={link.href} rel="noopener">{link.label}</a></p>
    </section>
  );
}

/* ---------- 1. the repeat deficit ---------- */

function Deficit({ d, index, href }: { d: AnalysisData["stream"]; index: number; href: string }) {
  const ph = usePlayhead(6500, 2200);
  const N = d.runes.length;
  const pos = Math.min(N - 1, Math.floor(ph.t * N)); // index of the newest rune in view
  const W = 38; // runes visible
  const start = Math.max(0, pos - W + 1);
  const view = [...d.runes.slice(start, pos + 1)];
  // repeats seen so far, and which runes in view belong to one
  let seen = 0;
  for (const i of d.doublets) { if (i <= pos) seen++; else break; }
  const inView = new Set<number>();
  for (const i of d.doublets) if (i >= start && i <= pos) { inView.add(i); inView.add(i - 1); }
  const lastGap = (() => { let g = Infinity; for (const i of d.doublets) if (i <= pos) g = pos - i; return g; })();
  const flash = lastGap < 120;
  const expectedSoFar = pos / 29;
  const page = d.pageStarts.filter((s) => s <= pos).length;
  const cw = 420 / W;
  return (
    <Panel index={index} title="The repeat deficit" ph={ph}
      link={{ href, label: "README §4" }}
      caption={<>The one structure every lab agrees on. A rune almost never follows itself: {fmt(d.doublets.length)} adjacent repeats where a random stream of these {fmt(N)} runes would give about {fmt(d.expected)}. The solved pages&rsquo; ciphertext sits at {d.ratioSolved} of the random rate; the unsolved pages at {d.ratioUnsolved}.</>}>
      <svg viewBox="0 0 420 150" className="svg" role="img" aria-label={`${d.doublets.length} adjacent repeats against ${d.expected} expected`}>
        <g className="counts">
          <text x="10" y="34" className="big ink">{fmt(seen)}</text>
          <text x="10" y="50" className="lbl">adjacent repeats so far</text>
          <text x="210" y="34" className="big ghost">{fmt(Math.round(expectedSoFar))}</text>
          <text x="210" y="50" className="lbl">expected at random (pairs ÷ 29)</text>
          <circle cx="400" cy="28" r="6" className={`flash${flash ? " on" : ""}`} />
        </g>
        <g className="strip" transform="translate(0,92)">
          {view.map((ch, k) => {
            const i = start + k;
            return <text key={i} x={k * cw + cw / 2} y="0" textAnchor="middle" className={`rune${inView.has(i) ? " hit" : ""}`}>{ch}</text>;
          })}
        </g>
        <g transform="translate(10,118)">
          <rect x="0" y="0" width="400" height="3" className="track" />
          <rect x="0" y="0" width={400 * (pos / (N - 1))} height="3" className="fill" />
          <text x="0" y="22" className="lbl">rune {fmt(pos + 1)} of {fmt(N)} · page {page} of {d.pageStarts.length}</text>
          <text x="400" y="22" textAnchor="end" className="lbl">final: {fmt(d.doublets.length)} of {fmt(d.pairs)} pairs, z {d.z}</text>
        </g>
      </svg>
    </Panel>
  );
}

/* ---------- 2. flat everywhere else ---------- */

function Spectrum({ s, index, href }: { s: AnalysisData["spectrum"]; index: number; href: string }) {
  const ph = usePlayhead(3600, 2000);
  const rows = s.rows;
  const n = rows.length;
  const W = 420, H = 190, L = 34, R = 8, T = 14, B = 34;
  const zMin = -18, zMax = 4;
  const y = (z: number) => T + (zMax - z) / (zMax - zMin) * (H - T - B);
  const bw = (W - L - R) / n;
  return (
    <Panel index={index} title="Flat everywhere else" ph={ph} link={{ href, label: "README §37" }}
      caption={<>Repeats at every other spacing sit where chance puts them: over lags 2 to {s.maxLag} the mean z is {s.meanZ} with spread {s.sdZ}, and only lag 1 leaves the band. No period, no key reuse between pages, no restart shows in the repeat spectrum.</>}>
      <svg viewBox={`0 0 ${W} ${H}`} className="svg" role="img" aria-label="Repeat spectrum by lag: z near zero at every lag except lag 1">
        <rect x={L} y={y(3)} width={W - L - R} height={y(-3) - y(3)} className="band" />
        <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} className="axis" />
        {[-15, -10, -5, 0, 3].map((z) => <text key={z} x={L - 4} y={y(z) + 3} textAnchor="end" className="lbl">{z > 0 ? "+" + z : z}</text>)}
        <text x={L - 4} y={T - 2} textAnchor="end" className="lbl">z</text>
        {rows.map((r, k) => {
          const p = easeOut(slot(ph.t, k, n, 3));
          const z = r.z * p;
          const top = Math.min(y(0), y(z)), h = Math.abs(y(z) - y(0));
          return (
            <g key={r.lag}>
              <rect x={L + k * bw + 2} y={top} width={bw - 4} height={Math.max(h, 0.5)} className={`bar${r.lag === 1 ? " red" : ""}`}>
                <title>{`lag ${r.lag}: ${fmt(r.repeats)} repeats in ${fmt(r.pairs)} pairs, ${fmt(r.expected)} expected, z ${r.z}`}</title>
              </rect>
              <text x={L + k * bw + bw / 2} y={H - B + 12} textAnchor="middle" className="lbl small">{r.lag}</text>
            </g>
          );
        })}
        <text x={L + (W - L - R) / 2} y={H - 6} textAnchor="middle" className="lbl">lag (runes apart)</text>
        <text x={W - R} y={y(3) - 3} textAnchor="end" className="lbl">chance band, ±3 sd</text>
        <text x={L + bw + 4} y={y(-9)} className="lbl red" style={{ opacity: slot(ph.t, 0, n, 3) }}>{`lag 1: ${rows[0].repeats} repeats, ${fmt(rows[0].expected)} expected`}</text>
      </svg>
    </Panel>
  );
}

/* ---------- 3. the word-internal echoes ---------- */

function Word({ runes, i, lag, y, t, label, formula }: { runes: string; i: number; lag: number; y: number; t: number; label: string; formula?: string }) {
  const r = [...runes];
  const cw = 24;
  const x0 = 210 - (r.length * cw) / 2;
  const a = i - lag, b = i;
  const litA = t > 0.15, litB = t > 0.35, arc = clamp((t - 0.35) / 0.3);
  const xa = x0 + a * cw + cw / 2, xb = x0 + b * cw + cw / 2;
  const path = `M ${xa} ${y - 18} Q ${(xa + xb) / 2} ${y - 48} ${xb} ${y - 18}`;
  return (
    <g>
      <text x="10" y={y - 54} className="lbl">{label}{formula ? <>: <tspan className="mono">{formula}</tspan></> : null}</text>
      {r.map((ch, k) => (
        <text key={k} x={x0 + k * cw + cw / 2} y={y} textAnchor="middle" className={`rune word${(k === a && litA) || (k === b && litB) ? " hit" : ""}`}>{ch}</text>
      ))}
      <path d={path} className="arc" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 - arc }} />
      <text x={(xa + xb) / 2} y={y - 36} textAnchor="middle" className={`lbl red${arc > 0.9 ? "" : " hidden"}`}>{lag} back</text>
    </g>
  );
}

function Echoes({ e, index, href }: { e: AnalysisData["echoes"]; index: number; href: string }) {
  const ph = usePlayhead(7000, 2200);
  const tA = clamp(ph.t / 0.38), tB = clamp((ph.t - 0.38) / 0.38), tC = clamp((ph.t - 0.78) / 0.22);
  const cA = Math.round(e.lag5.observed * easeOut(clamp((tA - 0.5) / 0.5)));
  const cB = Math.round(e.lag6.hits * easeOut(clamp((tB - 0.5) / 0.5)));
  const cS = Math.round(e.s.count * easeOut(tC));
  const Counter = ({ x, y, value, ghost, note }: { x: number; y: number; value: number; ghost: string; note: string }) => (
    <g>
      <text x={x} y={y} textAnchor="end" className="mid ink">{value}</text>
      <text x={x} y={y + 13} textAnchor="end" className="lbl">{ghost}</text>
      <text x={x} y={y + 25} textAnchor="end" className="lbl small">{note}</text>
    </g>
  );
  return (
    <Panel index={index} title="Echoes inside words" ph={ph} link={{ href, label: "README §42" }}
      caption={<>Structure confined to the inside of words. Five runes apart a word repeats a rune {e.lag5.observed} times where {e.lag5.mean} are expected; six apart it obeys c = 24 − 2c′ {e.lag6.hits} times against {e.lag6.mean}; and the rune S carries {e.s.count} of the lag-5 pairs where {e.s.expected} would. Found on 2026-10-28 after a word-edge correction, and {e.labs.join(" and ")} report the same counts.</>}>
      <svg viewBox="0 0 420 270" className="svg" role="img" aria-label="Two within-word echoes and the S carrier">
        <Word runes={e.wordA.runes} i={e.wordA.i} lag={5} y={70} t={tA} label={`a real word from the unsolved pages, ${[...e.wordA.runes].length} runes`} />
        <Counter x={410} y={100} value={cA} ghost={`${e.lag5.mean} ± ${e.lag5.sd} expected`} note={`lag-5 equal pairs in ${fmt(e.lag5.pairs)}, z ${e.lag5.z}`} />
        <Word runes={e.wordB.runes} i={e.wordB.i} lag={6} y={170} t={tB} label={e.wordB.runes === e.wordA.runes ? "the same word, six back" : "another word, six back"} formula="c = 24 − 2c′ (mod 29)" />
        <Counter x={410} y={200} value={cB} ghost={`${e.lag6.mean} ± ${e.lag6.sd} expected`} note={`lag-6 hits in ${fmt(e.lag6.pairs)}, z ${e.lag6.z}`} />
        <g transform="translate(10,236)">
          <text x="0" y="0" className="lbl">of the {e.lag5.observed} lag-5 pairs, the rune <tspan className="rune inline">ᛋ</tspan> (S) carries</text>
          <rect x="0" y="8" width={300 * (e.s.expected / e.lag5.observed) * 5} height="8" className="ghostbar" />
          <rect x="0" y="8" width={300 * (cS / e.lag5.observed) * 5} height="8" className="fill red" />
          <text x={300 * (cS / e.lag5.observed) * 5 + 6} y="16" className="lbl red">{cS}</text>
          <text x="410" y="16" textAnchor="end" className="lbl">{e.s.expected} expected, p {e.s.p}</text>
        </g>
      </svg>
    </Panel>
  );
}

/* ---------- 4. the mechanism bake-off ---------- */

function Bakeoff({ b, index, href }: { b: AnalysisData["bakeoff"]; index: number; href: string }) {
  const ph = usePlayhead(5000, 2600);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const rows = b.rules, cols = b.stats;
  const total = rows.length * cols.length;
  const L = 86, T = 22, cw = (420 - L - 4) / cols.length, rh = 15;
  const H = T + rows.length * rh + 30;
  const sIdx = cols.indexOf("L5S");
  const sRed = rows.filter((r) => Math.abs(r.cells[sIdx].z) > b.threshold).length;
  const sPass = rows.filter((r) => Math.abs(r.cells[sIdx].z) < b.threshold);
  const worst = (r: Rule): { stat: string; z: number } => {
    let best = { stat: cols[0], z: r.cells[0].z };
    r.cells.forEach((c, i) => { if (Math.abs(c.z) > Math.abs(best.z)) best = { stat: cols[i], z: c.z }; });
    return best;
  };
  const h = hover ? { rule: rows[hover.r], cell: rows[hover.r].cells[hover.c], stat: cols[hover.c] } : null;
  return (
    <Panel index={index} title="The mechanism bake-off" ph={ph} link={{ href, label: "README §47" }}
      caption={<>{rows.length} written rules, each simulated 200 times, against {cols.length} statistics of the real pages; a cell is red when the pages sit more than {b.threshold} standard deviations from the rule. Every rule ends with at least one red cell. {sRed} of {rows.length} miss the S count{sPass.length ? <>; the {sPass.length === 1 ? "one that reaches it" : `${sPass.length} that reach it`} ({sPass.map((r) => r.name).join(", ")}) {sPass.length === 1 ? "breaks" : "break"} {sPass.map((r) => worst(r).stat).join(", ")} by {sPass.map((r) => Math.abs(worst(r).z)).join(", ")} standard deviations instead</> : null}. No written rule produces the S weighting.</>}>
      <svg viewBox={`0 0 420 ${H}`} className="svg grid" role="img" aria-label="Grid of rules against statistics; red cells mark failures">
        {cols.map((c, j) => <text key={c} x={L + j * cw + cw / 2} y={T - 7} textAnchor="middle" className={`lbl small${j === sIdx ? " red" : ""}`}>{c}</text>)}
        {rows.map((r, i) => (
          <g key={r.name}>
            <text x={L - 6} y={T + i * rh + 11} textAnchor="end" className="lbl small mono">{r.name}</text>
            {r.cells.map((c, j) => {
              const k = i * cols.length + j;
              const p = slot(ph.t, k, total, 6);
              const red = Math.abs(c.z) > b.threshold;
              return (
                <rect key={j} x={L + j * cw + 1} y={T + i * rh + 1} width={cw - 2} height={rh - 2}
                  className={`cell${p > 0 ? (red ? " red" : " green") : ""}${hover && hover.r === i && hover.c === j ? " sel" : ""}`}
                  style={{ opacity: p > 0 ? 0.35 + 0.65 * easeOut(p) : 1 }}
                  onPointerEnter={() => setHover({ r: i, c: j })} onPointerLeave={() => setHover(null)}>
                  <title>{`${r.name} · ${cols[j]}: ${c.mean}${c.sd !== null ? " ± " + c.sd : ""} vs LP2 ${b.lp2[cols[j]] ?? "?"}, z ${c.z}`}</title>
                </rect>
              );
            })}
          </g>
        ))}
        <text x={L} y={H - 8} className="lbl">
          {h ? `${h.rule.name} · ${h.stat}: rule ${h.cell.mean}${h.cell.sd !== null ? " ± " + h.cell.sd : ""}, pages ${b.lp2[h.stat] ?? "?"}, z ${h.cell.z}` : "rest the pointer on a cell for its numbers"}
        </text>
      </svg>
    </Panel>
  );
}

/* ---------- 5. what a test can see ---------- */

function Power({ p, index, href }: { p: AnalysisData["power"]; index: number; href: string }) {
  const ph = usePlayhead(4200, 2200);
  const W = 420, H = 228, L = 36, R = 10, T = 16, B = 74;
  const xMin = 50, xMax = 290;
  const x = (len: number) => L + (len - xMin) / (xMax - xMin) * (W - L - R);
  const y = (v: number) => T + (1 - v) * (H - T - B);
  const line = (vals: number[]) => p.lengths.map((len, i) => `${i ? "L" : "M"} ${x(len)} ${y(vals[i])}`).join(" ");
  const draw = easeOut(ph.t);
  const marks = clamp((ph.t - 0.6) / 0.4);
  return (
    <Panel index={index} title="What a test can see" ph={ph} link={{ href, label: "README §23" }}
      caption={<>A planted key is only recovered reliably on a page long enough: the base decoder reaches 80 % at {p.thresholdA} runes, the hard-rule decoder at {p.thresholdB}. {p.shortPages.length} of the 55 pages are shorter than that knee, so for them an &ldquo;excluded&rdquo; is an &ldquo;inconclusive&rdquo;, which is why every exclusion in the ledger carries a page-length limit.</>}>
      <svg viewBox={`0 0 ${W} ${H}`} className="svg" role="img" aria-label="Detection power rising with page length; nine short pages marked below the knee">
        {[0, 0.5, 0.8, 1].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className={v === 0.8 ? "thr" : "axis faint"} /><text x={L - 4} y={y(v) + 3} textAnchor="end" className="lbl small">{Math.round(v * 100)}%</text></g>)}
        <path d={line(p.laneA)} className="curve a" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 - draw }} />
        <path d={line(p.laneB)} className="curve b" pathLength={1} style={{ strokeDasharray: 1, strokeDashoffset: 1 - draw }} />
        {p.lengths.map((len, i) => (
          <g key={len} style={{ opacity: draw > i / p.lengths.length ? 1 : 0 }}>
            <circle cx={x(len)} cy={y(p.laneA[i])} r="3" className="dot a"><title>{`${len} runes: base decoder power ${p.laneA[i]}`}</title></circle>
            <circle cx={x(len)} cy={y(p.laneB[i])} r="3" className="dot b"><title>{`${len} runes: hard-rule decoder power ${p.laneB[i]}`}</title></circle>
            <text x={x(len)} y={H - B + 14} textAnchor="middle" className="lbl small">{len}</text>
          </g>
        ))}
        <text x={W - R} y={y(0.8) - 4} textAnchor="end" className="lbl">80 % power</text>
        <text x={x(p.lengths[p.lengths.length - 1]) - 4} y={y(1) - 6} textAnchor="end" className="lbl a">base decoder (soft rule)</text>
        <text x={x(p.lengths[2]) + 6} y={y(p.laneB[2]) + 14} className="lbl b">hard rule, 22 % nulls</text>
        <g style={{ opacity: marks }}>
          {p.shortPages.map((s, i) => (
            <g key={s.name} transform={`translate(${x(s.length)},${H - B + 30})`}>
              <line x1="0" x2="0" y1="0" y2="7" className="tick red" />
              <text x="0" y={17 + (i % 2) * 8} textAnchor="middle" className="lbl tiny red">{s.name.replace("LP2-", "")}</text>
              <title>{`${s.name}: ${s.length} runes, below the hard-rule knee`}</title>
            </g>
          ))}
          <text x={L} y={H - 3} className="lbl small">the {p.shortPages.length} pages shorter than {p.thresholdB} runes (LP2 numbers), inconclusive under the hard rule</text>
        </g>
        <text x={W - R} y={H - B + 26} textAnchor="end" className="lbl small">runes on the page</text>
      </svg>
    </Panel>
  );
}

/* ---------- 6. the sweep counter ---------- */

function Sweep({ s, index, href }: { s: AnalysisData["sweep"]; index: number; href: string }) {
  const ph = usePlayhead(4800, 3000);
  const n = Math.round(s.tests * easeOut(ph.t));
  const lanesShown = Math.floor(clamp(ph.t * 1.15) * s.lanes.length);
  const closed = s.lanes.slice(0, lanesShown).filter((l) => l.closedNull).length;
  const cols = 12, cw = 400 / cols, rh = 22;
  const rowsN = Math.ceil(s.lanes.length / cols);
  return (
    <Panel index={index} title="The sweep so far" ph={ph} link={{ href, label: "STATUS.md" }}
      caption={<>{s.testsLabel} decoder tests, all pre-registered, all with planted controls; {s.lanesClosed} of {s.lanesTotal} lanes closed null; breakthroughs {s.breakthroughs}, where a breakthrough means {s.definition}. The honest wording of the standing result is: no accepted decoding within the tested configurations at the stated detection limits.</>}>
      <svg viewBox={`0 0 420 ${122 + rowsN * rh}`} className="svg" role="img" aria-label={`${s.testsLabel} tests, ${s.lanesClosed} of ${s.lanesTotal} lanes closed null, ${s.breakthroughs} breakthroughs`}>
        <text x="10" y="40" className="huge ink">{fmt(n)}</text>
        <text x="10" y="58" className="lbl">decoder tests run, as of {s.asOf}</text>
        <text x="410" y="40" textAnchor="end" className="big ink">{s.breakthroughs}</text>
        <text x="410" y="58" textAnchor="end" className="lbl">breakthroughs</text>
        <g transform="translate(10,78)">
          {s.lanes.map((l, k) => {
            const on = k < lanesShown;
            return (
              <g key={k} transform={`translate(${(k % cols) * cw},${Math.floor(k / cols) * rh})`}>
                <rect x="1" y="1" width={cw - 4} height={rh - 5} className={`lane${on ? (l.closedNull ? " null" : " other") : ""}`}>
                  <title>{`${l.section} ${l.lane}: ${l.verdict}${l.tests ? ` (${fmt(l.tests)} tests)` : ""}`}</title>
                </rect>
              </g>
            );
          })}
          <text x="0" y={rowsN * rh + 14} className="lbl">{closed} of {lanesShown} lanes closed null (filled)</text>
          <text x="0" y={rowsN * rh + 26} className="lbl small">outlined lanes measured a property or a provenance rather than attempting a decoding</text>
        </g>
      </svg>
    </Panel>
  );
}

export default function AnalysisPanels({ data }: { data: AnalysisData }) {
  return (
    <div className="panels">
      <Deficit d={data.stream} index={1} href={data.links.deficit} />
      <Spectrum s={data.spectrum} index={2} href={data.links.spectrum} />
      <Echoes e={data.echoes} index={3} href={data.links.echoes} />
      <Bakeoff b={data.bakeoff} index={4} href={data.links.bakeoff} />
      <Power p={data.power} index={5} href={data.links.power} />
      <Sweep s={data.sweep} index={6} href={data.links.status} />
    </div>
  );
}
