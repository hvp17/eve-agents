import { NextResponse } from "next/server";
import {
  getIndexerConfigFromEnv,
  runIndexer,
} from "@eve-agents/indexer";

export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = getIndexerConfigFromEnv();
    const result = await runIndexer(config);

    return NextResponse.json({
      ok: true,
      scanned: result.scanned,
      eveRepos: result.eveRepos,
      newAgents: result.newAgents.map((agent) => agent.id),
      prUrl: result.prUrl,
      message: result.message,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Indexer failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
