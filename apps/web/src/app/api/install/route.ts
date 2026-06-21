import { NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type InstallBody = {
  owner?: string;
  repo?: string;
  source?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as InstallBody;
  const { owner, repo } = body;

  if (!owner || !repo) {
    return NextResponse.json({ error: "owner and repo required" }, { status: 400 });
  }

  const catalogPath = path.join(
    process.cwd(),
    "../../packages/catalog/src/agents.json",
  );

  try {
    const raw = await readFile(catalogPath, "utf8");
    const agents = JSON.parse(raw) as Array<{
      owner: string;
      repo: string;
      installs: number;
    }>;

    const agent = agents.find((item) => item.owner === owner && item.repo === repo);
    if (agent) {
      agent.installs += 1;
      await writeFile(catalogPath, `${JSON.stringify(agents, null, 2)}\n`);
    }
  } catch {
    // Best-effort for local MVP; production would use a database.
  }

  return NextResponse.json({ ok: true });
}
