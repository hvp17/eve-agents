import catalog from "./catalog.json" with { type: "json" };
import { getDefaultTelemetryUrl } from "./telemetry.js";

type AgentRecord = {
  id: string;
  owner: string;
  repo: string;
  name: string;
  featured: boolean;
  tags?: string[];
};

const bundledAgents = catalog as AgentRecord[];
const CACHE_MS = 60 * 60 * 1000;

let cache: { agents: AgentRecord[]; fetchedAt: number } | null = null;

function catalogUrl(): string {
  if (process.env.EVE_AGENTS_CATALOG_URL) {
    return process.env.EVE_AGENTS_CATALOG_URL;
  }

  const origin = process.env.EVE_AGENTS_SITE_URL?.replace(/\/$/, "");
  if (origin) return `${origin}/api/catalog`;

  return getDefaultTelemetryUrl().replace(/\/api\/install$/, "/api/catalog");
}

export async function loadCatalogAgents(): Promise<AgentRecord[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache.agents;
  }

  try {
    const response = await fetch(catalogUrl(), {
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Catalog fetch failed (${response.status})`);
    }

    const payload = (await response.json()) as { agents?: AgentRecord[] };
    if (!payload.agents?.length) {
      throw new Error("Catalog response was empty");
    }

    cache = { agents: payload.agents, fetchedAt: Date.now() };
    return payload.agents;
  } catch {
    return bundledAgents;
  }
}

export async function isCatalogAgent(
  owner: string,
  repo: string,
): Promise<boolean> {
  const agents = await loadCatalogAgents();
  const id = `${owner}/${repo}`;
  return agents.some((agent) => agent.id === id);
}

export function getBundledAgents(): AgentRecord[] {
  return bundledAgents;
}
