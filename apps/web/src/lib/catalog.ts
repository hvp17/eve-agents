import {
  agentCatalog,
  getAgentFromRecords,
  installCommand,
  searchAgentRecords,
  type EveAgent,
} from "@eve-agents/catalog";
import { getAgentCatalogWithInstalls } from "./catalog-source";

export type { EveAgent };

export { isAutoIndexed } from "@eve-agents/indexer";

export async function getAgentCatalog(): Promise<EveAgent[]> {
  return getAgentCatalogWithInstalls();
}

export async function getAgent(
  owner: string,
  repo: string,
): Promise<EveAgent | undefined> {
  const catalog = await getAgentCatalog();
  return getAgentFromRecords(catalog, owner, repo);
}

export async function searchAgents(query: string): Promise<EveAgent[]> {
  const catalog = await getAgentCatalog();
  return searchAgentRecords(catalog, query);
}

export async function isCatalogAgent(
  owner: string,
  repo: string,
): Promise<boolean> {
  const { isAgentInCatalog } = await import("./catalog-source");
  return isAgentInCatalog(owner, repo);
}

export { agentCatalog, installCommand };
