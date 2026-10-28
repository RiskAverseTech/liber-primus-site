import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "content", "synced");

/** Reads a file the sync script fetched; throws a clear error if it is missing. */
export function synced(repoPath: string): string {
  const p = path.join(ROOT, repoPath);
  if (!existsSync(p)) {
    throw new Error(`content/synced/${repoPath} is missing: run \`npm run sync\` first (it fetches from RiskAverseTech/cicada-ioc).`);
  }
  return readFileSync(p, "utf8");
}

export type Manifest = {
  repo: string;
  ref: string;
  fetchedAt: string;
  sha: string | null;
  date: string | null;
  files: { path: string; bytes: number; sha256: string }[];
};

export function manifest(): Manifest {
  return JSON.parse(synced("manifest.json")) as Manifest;
}

export const RESEARCH_REPO_URL = "https://github.com/RiskAverseTech/cicada-ioc";
