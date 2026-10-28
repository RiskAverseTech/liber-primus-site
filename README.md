# Liber Primus, the site

Companion site for the research repository [RiskAverseTech/cicada-ioc](https://github.com/RiskAverseTech/cicada-ioc):
Cicada 3301's Liber Primus, the solved pages as text and as runes, the unsolved pages as transcribed, and the research's status box.

**Production:** https://liber-primus-site.vercel.app

## Pages

- **Read** (`/`): the solved part of the book as readable text. This is the research repo's `docs/liber-primus-as-read.html`, fetched at build time and set in the site's layout with its own typography.
- **Runes** (`/runes`): every page of the book in the rune alphabet, from the rtkd/iddqd master transcription (word gap `-`, clause `.`, line `/`, paragraph `&`; a line that ends inside a word continues with no gap). On the 17 solved pages the decrypted plaintext sits under each rune in the book's own spelling, aligned rune for rune from `data/processed/pages.json`. A checkbox adds the 56 unsolved pages (55 with runes; LP2-50 carries only a grid of two-character codes). Previous/next buttons, a dropdown and the left/right arrow keys switch pages; `#image-NN` in the URL opens a page directly. Each second-part page links to its authentic image in the archive.org item `ky2khlqdf7qdznac.onion` (file number = image number − 17, byte-identical to the 2014 release per the repo's `data/images/PROVENANCE.md`); the first-part images are not in that dump, so those pages carry no link.
- **Status** (`/status`): the research repo's `STATUS.md`, rendered, with every `§N` linked to that section of the README (anchors follow GitHub's slug rule, as in the repo's `src/toc.py`).
- **Analysis** (`/analysis`): six animated panels, one negative result each, built from the real numbers: the repeat deficit (the rune stream itself scrolls past and the 86 repeats flash), the flat lag spectrum, the two within-word echoes with the S carrier, the 14-rule mechanism bake-off grid, detection power by page length with the nine short pages, and the sweep counter. Inline SVG driven by `requestAnimationFrame`, no chart library; each panel runs only while on screen, holds still with its figures readable while the pointer rests on it, and shows its final state under `prefers-reduced-motion`. The numbers are parsed at build time from `STATUS.md`, `ledger.json` and `results/{doublet_audit,closure_bundle,kfixed_echo,mechanism,power,lag_spectrum}.md`; the counts the page animates (86, 102, 77, 11) are recomputed from the transcription and must equal the files' figures or the build fails.
- **Media** (`/media`): a list read from `content/media.json`. Empty for now.

Page numbering: the site shows image numbers of the complete 75-page set (00–74). Transcription chunk 1 is image 01 (image 02 is the "Intus" title page); from chunk 2 on, image = chunk + 1. Unsolved page LP2-k is image 17 + k.

## How content gets here

Nothing from the research repo is committed here. `scripts/sync-content.mjs` runs before every build and fetches these files from the `main` branch of `RiskAverseTech/cicada-ioc` through raw.githubusercontent.com into `content/synced/` (gitignored):

```
STATUS.md
README.md
docs/liber-primus-as-read.html
data/processed/solved_plaintext_latin.txt
data/processed/pages.json
data/raw/iddqd__liber-primus__transcription--master.txt
data/images/PROVENANCE.md
ledger.json
results/doublet_audit.md
results/closure_bundle.md
results/kfixed_echo.md
results/mechanism.md
results/power.md
results/lag_spectrum.md
```

Each file is checked for a marker it must contain; a missing, empty or wrong-looking file stops the build with a message naming it. The sync also records the source commit in `content/synced/manifest.json`, which the footer shows. A rebuild is therefore all it takes to refresh the site; the two git histories never touch.

- `CICADA_IOC_REF=<branch or sha>` builds from another ref.
- `CICADA_IOC_DIR=/path/to/cicada-ioc` copies from a local checkout instead of the network.

## Keeping the site current: the deploy hook (two steps, once)

The workflow `.github/workflows/redeploy.yml` calls a Vercel deploy hook every day at 06:17 UTC and whenever it is run by hand (Actions → Redeploy site → Run workflow). It needs one secret.

1. In the Vercel project `ratc/liber-primus-site`: Settings → Git → Deploy Hooks → create a hook for branch `main`, copy the URL. (Deploy hooks appear once the project is connected to this GitHub repository: `vercel git connect` from this folder, or Settings → Git → Connect.)
2. Store the URL as a repository secret; it is never printed or committed:

```bash
gh secret set VERCEL_DEPLOY_HOOK_URL --repo RiskAverseTech/liber-primus-site
```

Pushing to `main` also deploys, once the Git connection exists.

## Working locally

```bash
npm install
npm run build      # runs the sync, then a static export into out/
npm run dev        # after a first `npm run sync`
```

Node 20 or later. `npm run lint` type-checks.

## Adding media

Edit `content/media.json`; each item has `title`, `date` (YYYY-MM-DD), `url`, `kind` (`video`, `audio`, `image` or `link`) and an optional `note`. Newest first on the page. Commit and push, or run the workflow.

## Audio

`public/audio/` holds readings of the solved text as mp3, one file per section
(`warning`, `welcome`, `wisdom`, `loss-of-divinity` and its five subsections as
`lod-*`, `end`, `parable`). The two koans were recorded as two voices, narrator
and master, one file per voice with a pause wherever the other voice speaks;
those files were cut at the pauses into one clip per line (`koan1-n1` …,
`koan1-m1` …, `koan2-*`), so each line on the Read page has its own play button
and the heading's button plays the dialogue in order.

`src/lib/audio.ts` maps headings and koan lines to clips and injects the
buttons into the synced reading page at build time. It matches the headings in
order and stops the build if the page's shape changes or a clip is missing.
`src/components/AudioPlayer.tsx` is the one audio element on the page.

## Design notes

- Light and dark themes follow the system setting; the toggle in the header stores a choice in `localStorage` only. No cookies. Page views and referrers are counted by Vercel Web Analytics (`@vercel/analytics`, cookieless; enable Web Analytics on the Vercel project for the data to appear). The only other third-party request is the archive.org thumbnail on the Runes page.
- Fonts (Cormorant Garamond, IBM Plex Sans and Mono, Noto Sans Runic for U+16A0–U+16FF) are fetched at build time by `next/font` and served from the site; system runic fonts are the fallback.
- Text of the solved pages is Cicada 3301's, reproduced as transcribed by the community. Research: [RiskAverseTech/cicada-ioc](https://github.com/RiskAverseTech/cicada-ioc).

MIT licence.
