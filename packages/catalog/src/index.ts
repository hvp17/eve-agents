import agents from "./agents.json";
import { agentId } from "./install-store";

export type EveAgent = {
  id: string;
  name: string;
  owner: string;
  repo: string;
  description: string;
  channels: string[];
  connections: string[];
  tags: string[];
  featured: boolean;
  installs: number;
};

export type AgentRecord = Omit<EveAgent, "installs">;

export const agentCatalog = agents as AgentRecord[];

export function mergeInstallCounts(
  records: AgentRecord[],
  counts: Record<string, number>,
): EveAgent[] {
  return records.map((agent) => ({
    ...agent,
    installs: counts[agent.id] ?? 0,
  }));
}

export function getAgentFromRecords(
  records: EveAgent[],
  owner: string,
  repo: string,
): EveAgent | undefined {
  return records.find((a) => a.owner === owner && a.repo === repo);
}

export function searchAgentRecords(
  records: EveAgent[],
  query: string,
): EveAgent[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? records.filter((agent) => {
        const haystack = [
          agent.name,
          agent.owner,
          agent.repo,
          agent.description,
          ...agent.channels,
          ...agent.connections,
          ...agent.tags,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
    : records;

  return filtered.sort((a, b) => b.installs - a.installs);
}

export function getFeaturedAgents(): AgentRecord[] {
  return agentCatalog.filter((agent) => agent.featured);
}

export function isCatalogAgent(owner: string, repo: string): boolean {
  const id = agentId(owner, repo);
  return agentCatalog.some((agent) => agent.id === id);
}

export function installCommand(owner: string, repo: string): string {
  return `npx eve-agents add ${owner}/${repo}`;
}
