import {
  buildAgentRecord,
  findNewAgents,
  parseCatalogJson,
  serializeCatalog,
} from "./catalog";
import {
  createCatalogPullRequest,
  fetchCatalogFile,
  hasEveAgentStructure,
  listOrgRepos,
} from "./github";
import type { AgentRecord, IndexerConfig, IndexerResult } from "./types";

export type { AgentRecord, IndexerConfig, IndexerResult };
export { isAutoIndexed, parseCatalogJson } from "./catalog";

export function getIndexerConfigFromEnv(): IndexerConfig {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error("GITHUB_TOKEN is required for indexing");
  }

  return {
    githubToken,
    sourceOrg: process.env.GITHUB_INDEX_ORG ?? "vercel-labs",
    catalogOwner: process.env.GITHUB_CATALOG_OWNER ?? "hvp17",
    catalogRepo: process.env.GITHUB_CATALOG_REPO ?? "eve-agents",
    catalogPath:
      process.env.GITHUB_CATALOG_PATH ?? "packages/catalog/src/agents.json",
    baseBranch: process.env.GITHUB_CATALOG_BRANCH ?? "main",
  };
}

export async function runIndexer(
  config: IndexerConfig,
): Promise<IndexerResult> {
  const { content: catalogRaw } = await fetchCatalogFile(
    config.catalogOwner,
    config.catalogRepo,
    config.catalogPath,
    config.githubToken,
    config.baseBranch,
  );

  const existing = parseCatalogJson(catalogRaw);
  const repos = await listOrgRepos(config.sourceOrg, config.githubToken);

  const discovered: AgentRecord[] = [];
  let eveRepos = 0;

  for (const repo of repos) {
    const isEve = await hasEveAgentStructure(
      config.sourceOrg,
      repo.name,
      config.githubToken,
    );
    if (!isEve) continue;

    eveRepos += 1;
    discovered.push(
      buildAgentRecord(config.sourceOrg, repo.name, repo.description),
    );
  }

  const newAgents = findNewAgents(existing, discovered);

  if (newAgents.length === 0) {
    return {
      scanned: repos.length,
      eveRepos,
      newAgents: [],
      prUrl: null,
      message: "Catalog is up to date — no PR opened.",
    };
  }

  const updated = [...existing, ...newAgents].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  const prUrl = await createCatalogPullRequest({
    token: config.githubToken,
    catalogOwner: config.catalogOwner,
    catalogRepo: config.catalogRepo,
    catalogPath: config.catalogPath,
    baseBranch: config.baseBranch,
    updatedCatalogJson: serializeCatalog(updated),
    newAgentCount: newAgents.length,
    newAgentIds: newAgents.map((agent) => agent.id),
  });

  return {
    scanned: repos.length,
    eveRepos,
    newAgents,
    prUrl,
    message: `Opened PR for ${newAgents.length} new agent(s).`,
  };
}
