import {
  agentCatalog,
  mergeInstallCounts,
  type AgentRecord,
} from "@eve-agents/catalog";
import { parseCatalogJson } from "@eve-agents/indexer";
import { unstable_cache } from "next/cache";

const CACHE_TAG = "catalog-records";

async function fetchCatalogFromGitHub(): Promise<AgentRecord[] | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  const owner = process.env.GITHUB_CATALOG_OWNER ?? "hvp17";
  const repo = process.env.GITHUB_CATALOG_REPO ?? "eve-agents";
  const path =
    process.env.GITHUB_CATALOG_PATH ?? "packages/catalog/src/agents.json";

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as { content: string };
  const raw = Buffer.from(payload.content, "base64").toString("utf8");
  return parseCatalogJson(raw);
}

const getCachedGithubCatalog = unstable_cache(
  async () => fetchCatalogFromGitHub(),
  ["github-catalog"],
  { revalidate: 3600, tags: [CACHE_TAG] },
);

export async function getCatalogRecords(): Promise<AgentRecord[]> {
  const remote = await getCachedGithubCatalog();
  return remote ?? agentCatalog;
}

export async function isAgentInCatalog(
  owner: string,
  repo: string,
): Promise<boolean> {
  const records = await getCatalogRecords();
  const id = `${owner}/${repo}`;
  return records.some((agent) => agent.id === id);
}

export async function getAgentCatalogWithInstalls() {
  const records = await getCatalogRecords();
  const { getInstallCounts } = await import("./install-store");
  const counts = await getInstallCounts();
  return mergeInstallCounts(records, counts);
}
