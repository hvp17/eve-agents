import {
  agentId,
  type InstallCounts,
  incrementInstallCountInFile,
  readInstallCountsFromFile,
} from "@eve-agents/catalog/install-store";
import { isCatalogAgent } from "@eve-agents/catalog";

const KV_KEY = "install-counts";

async function readKvCounts(): Promise<InstallCounts | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }

  const { kv } = await import("@vercel/kv");
  const counts = await kv.get<InstallCounts>(KV_KEY);
  return counts ?? {};
}

async function writeKvCounts(counts: InstallCounts): Promise<void> {
  const { kv } = await import("@vercel/kv");
  await kv.set(KV_KEY, counts);
}

export async function getInstallCounts(): Promise<InstallCounts> {
  const kvCounts = await readKvCounts();
  if (kvCounts !== null) return kvCounts;
  return readInstallCountsFromFile();
}

export async function incrementInstallCount(
  owner: string,
  repo: string,
): Promise<number> {
  if (!isCatalogAgent(owner, repo)) {
    throw new Error("Agent is not in the catalog");
  }

  const kvCounts = await readKvCounts();
  if (kvCounts !== null) {
    const id = agentId(owner, repo);
    const next = (kvCounts[id] ?? 0) + 1;
    kvCounts[id] = next;
    await writeKvCounts(kvCounts);
    return next;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Install telemetry requires KV_REST_API_URL and KV_REST_API_TOKEN on Vercel",
    );
  }

  return incrementInstallCountInFile(owner, repo);
}
