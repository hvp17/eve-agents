import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type InstallCounts = Record<string, number>;

function findRepoRoot(start = process.cwd()): string {
  let dir = start;
  while (dir !== path.dirname(dir)) {
    const pkgPath = path.join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
          workspaces?: unknown;
        };
        if (pkg.workspaces) return dir;
      } catch {
        // keep walking
      }
    }
    dir = path.dirname(dir);
  }
  return start;
}

export function installCountsFilePath(): string {
  const override = process.env.EVE_AGENTS_DATA_DIR;
  const root = override ?? findRepoRoot();
  return path.join(root, "data", "install-counts.json");
}

export function agentId(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

export async function readInstallCountsFromFile(): Promise<InstallCounts> {
  const filePath = installCountsFilePath();
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as InstallCounts;
  } catch {
    return {};
  }
}

export async function writeInstallCountsToFile(
  counts: InstallCounts,
): Promise<void> {
  const filePath = installCountsFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(counts, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

export async function incrementInstallCountInFile(
  owner: string,
  repo: string,
): Promise<number> {
  const id = agentId(owner, repo);
  const counts = await readInstallCountsFromFile();
  const next = (counts[id] ?? 0) + 1;
  counts[id] = next;
  await writeInstallCountsToFile(counts);
  return next;
}
