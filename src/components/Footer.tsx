export default function Footer({ sha, date }: { sha: string | null; date: string | null }) {
  const when = date ? date.slice(0, 10) : null;
  return (
    <footer className="site-footer">
      <div className="bar">
        <span>
          Research: <a href="https://github.com/RiskAverseTech/cicada-ioc" rel="noopener">RiskAverseTech/cicada-ioc</a> · text of the solved pages is Cicada 3301&rsquo;s, reproduced as transcribed
        </span>
        <span>
          Built from the research repository&rsquo;s main branch{sha ? <> at <code>{sha.slice(0, 7)}</code></> : null}{when ? ` (${when})` : null}. No analytics, no cookies.
        </span>
      </div>
    </footer>
  );
}
