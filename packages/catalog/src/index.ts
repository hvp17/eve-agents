import agents from "./agents.json";

export type EveAgent = {
  id: string;
  name: string;
  owner: string;
  repo: string;
  description: string;
  channels: string[];
  connections: string[];
  tags: string[];
  installs: number;
  featured: boolean;
};

export const agentCatalog = agents as EveAgent[];

export function getAgent(owner: string, repo: string): EveAgent | undefined {
  return agentCatalog.find((a) => a.owner === owner && a.repo === repo);
}

export function searchAgents(query: string): EveAgent[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...agentCatalog].sort((a, b) => b.installs - a.installs);

  return agentCatalog
    .filter((agent) => {
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
    .sort((a, b) => b.installs - a.installs);
}

export function installCommand(owner: string, repo: string): string {
  return `npx eve-agents add ${owner}/${repo}`;
}
