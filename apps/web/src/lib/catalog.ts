import {
  agentCatalog,
  getAgentFromRecords,
  getFeaturedAgents,
  isCatalogAgent,
  mergeInstallCounts,
  searchAgentRecords,
  type EveAgent,
} from "@eve-agents/catalog";
import { getInstallCounts } from "./install-store";

export type { EveAgent };

export async function getAgentCatalog(): Promise<EveAgent[]> {
  const counts = await getInstallCounts();
  return mergeInstallCounts(agentCatalog, counts);
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

export { getFeaturedAgents, isCatalogAgent };

export { agentCatalog, installCommand } from "@eve-agents/catalog";
