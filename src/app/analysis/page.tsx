import type { Metadata } from "next";
import AnalysisPanels from "./AnalysisPanels";
import { loadAnalysis } from "@/lib/analysis";
import { manifest } from "@/lib/synced";

export const metadata: Metadata = { title: "Analysis" };

export default function AnalysisPage() {
  const data = loadAnalysis();
  const m = manifest();
  return (
    <div className="wrap wide analysis">
      <h1 className="page-title">What the measurements show</h1>
      <p className="lede">
        Six results from the research, each drawn from the real numbers in the repository&rsquo;s result files at
        build time. Every panel animates while it is on screen and holds still, with its figures readable, while the
        pointer rests on it.
      </p>
      <AnalysisPanels data={data} />
      <p className="src-line">
        Figures read from <code>results/</code>, <code>ledger.json</code> and <code>STATUS.md</code>
        {m.sha ? <> at commit <code>{m.sha.slice(0, 7)}</code></> : null} on {m.fetchedAt.slice(0, 10)}; the rune stream is the
        transcription itself. A file that goes missing or changes shape stops the build rather than showing an old figure.
      </p>
    </div>
  );
}
