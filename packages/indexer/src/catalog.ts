import type { AgentRecord } from "./types";

export function parseCatalogJson(raw: string): AgentRecord[] {
  const parsed = JSON.parse(raw) as AgentRecord[];
  if (!Array.isArray(parsed)) {
    throw new Error("Catalog must be a JSON array");
  }
  return parsed;
}

export function formatAgentName(repo: string): string {
  const stripped = repo
    .replace(/^eve-/, "")
    .replace(/-template$/, "")
    .replace(/-/g, " ");
  return stripped
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function buildAgentRecord(
  owner: string,
  repo: string,
  description: string | null,
): AgentRecord {
  return {
    id: `${owner}/${repo}`,
    name: formatAgentName(repo),
    owner,
    repo,
    description: description?.trim() || `Eve agent template from ${owner}/${repo}.`,
    channels: [],
    connections: [],
    tags: ["vercel-labs", "auto-indexed"],
    featured: false,
  };
}

export function findNewAgents(
  existing: AgentRecord[],
  discovered: AgentRecord[],
): AgentRecord[] {
  const known = new Set(existing.map((agent) => agent.id));
  return discovered.filter((agent) => !known.has(agent.id));
}

export function serializeCatalog(agents: AgentRecord[]): string {
  return `${JSON.stringify(agents, null, 2)}\n`;
}

export function isAutoIndexed(agent: AgentRecord): boolean {
  return agent.tags.includes("auto-indexed");
}
