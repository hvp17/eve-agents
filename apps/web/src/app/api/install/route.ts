import { NextResponse } from "next/server";
import { isCatalogAgent } from "@/lib/catalog";
import { incrementInstallCount } from "@/lib/install-store";

type InstallBody = {
  owner?: string;
  repo?: string;
  source?: string;
};

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.INSTALL_API_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: InstallBody;
  try {
    body = (await request.json()) as InstallBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { owner, repo } = body;
  if (!owner || !repo) {
    return NextResponse.json({ error: "owner and repo required" }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
    return NextResponse.json({ error: "Invalid owner or repo" }, { status: 400 });
  }

  if (!isCatalogAgent(owner, repo)) {
    return NextResponse.json({ error: "Agent not in catalog" }, { status: 404 });
  }

  try {
    const installs = await incrementInstallCount(owner, repo);
    return NextResponse.json({ ok: true, installs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record install";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
