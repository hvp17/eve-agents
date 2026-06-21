#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import catalog from "./catalog.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type AgentRecord = {
  id: string;
  owner: string;
  repo: string;
  name: string;
  featured: boolean;
};

const agents = catalog as AgentRecord[];

function parseRepoArg(arg: string): { owner: string; repo: string } {
  const cleaned = arg
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");

  const segments = cleaned.split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new Error(`Invalid repo: ${arg}. Use owner/repo format.`);
  }

  const [owner, repo] = segments;
  if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
    throw new Error(`Invalid owner or repo in: ${arg}`);
  }

  return { owner, repo };
}

function isCatalogAgent(owner: string, repo: string): boolean {
  const id = `${owner}/${repo}`;
  return agents.some((agent) => agent.id === id);
}

function resolveTargetDir(targetDir: string): string {
  const cwd = process.cwd();
  const resolved = path.resolve(cwd, targetDir);
  const relative = path.relative(cwd, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`--dir must stay inside the current directory: ${targetDir}`);
  }

  return resolved;
}

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", (error) => {
      reject(new Error(`${command} failed: ${error.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function recordInstall(owner: string, repo: string): Promise<void> {
  const endpoint = process.env.EVE_AGENTS_TELEMETRY_URL;
  if (!endpoint) return;

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  const secret = process.env.INSTALL_API_SECRET;
  if (secret) {
    headers.authorization = `Bearer ${secret}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ owner, repo, source: "cli" }),
    });

    if (!response.ok) {
      console.warn(`Telemetry failed (${response.status}): install not recorded`);
    }
  } catch {
    console.warn("Telemetry unreachable: install not recorded");
  }
}

async function assertEveAgent(destination: string): Promise<void> {
  const instructionsMd = path.join(destination, "agent", "instructions.md");
  const instructionsTs = path.join(destination, "agent", "instructions.ts");

  if (!existsSync(instructionsMd) && !existsSync(instructionsTs)) {
    throw new Error(
      "Cloned repo does not look like an Eve agent (missing agent/instructions.md or agent/instructions.ts)",
    );
  }
}

async function addAgent(
  source: string,
  options: { targetDir?: string; force: boolean; skipInstall: boolean },
): Promise<void> {
  const { owner, repo } = parseRepoArg(source);

  if (!options.force && !isCatalogAgent(owner, repo)) {
    throw new Error(
      `${owner}/${repo} is not in the eve-agents catalog. Use --force to install anyway.`,
    );
  }

  const dir = options.targetDir ?? repo;
  const destination = resolveTargetDir(dir);

  if (existsSync(destination)) {
    throw new Error(`Directory already exists: ${destination}`);
  }

  const gitUrl = `https://github.com/${owner}/${repo}.git`;
  console.log(`Cloning ${owner}/${repo} into ${dir}...`);
  await run("git", ["clone", "--depth", "1", gitUrl, dir], process.cwd());

  await assertEveAgent(destination);

  const pkgPath = path.join(destination, "package.json");
  if (!options.skipInstall && existsSync(pkgPath)) {
    console.log("Installing dependencies...");
    await run("npm", ["install"], destination);
  }

  if (isCatalogAgent(owner, repo)) {
    await recordInstall(owner, repo);
  }

  console.log(`\nDone! Agent installed at ./${dir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${dir}`);
  if (existsSync(pkgPath)) {
    console.log(`  npm run dev`);
  }
}

async function listAgents(featuredOnly: boolean): Promise<void> {
  const list = featuredOnly
    ? agents.filter((agent) => agent.featured)
    : agents;

  console.log(featuredOnly ? "Featured Eve agents:\n" : "Catalog Eve agents:\n");

  for (const agent of list) {
    console.log(`  ${agent.owner}/${agent.repo}`);
    console.log(`    ${agent.name}`);
    console.log(`    npx eve-agents add ${agent.owner}/${agent.repo}\n`);
  }
}

function printHelp(): void {
  console.log(`eve-agents — discover and install Eve agent templates

Usage:
  npx eve-agents add <owner>/<repo> [options]   Clone and install an agent
  npx eve-agents list [--all]                     List catalog agents

Options:
  --dir <name>        Install into a subdirectory (must stay inside cwd)
  --force             Install repos not in the catalog
  --skip-install      Clone only; do not run npm install

Examples:
  npx eve-agents add vercel-labs/eve-content-agent-template
  npx eve-agents add vercel-labs/personal-agent-template --dir my-agent
  npx eve-agents list --all
`);
}

function parseAddOptions(args: string[]): {
  source?: string;
  targetDir?: string;
  force: boolean;
  skipInstall: boolean;
} {
  const force = args.includes("--force");
  const skipInstall = args.includes("--skip-install");
  const dirIndex = args.indexOf("--dir");
  const targetDir = dirIndex >= 0 ? args[dirIndex + 1] : undefined;
  const source = args.find((arg) => !arg.startsWith("--") && arg !== targetDir);

  return { source, targetDir, force, skipInstall };
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "list") {
    await listAgents(!rest.includes("--all"));
    return;
  }

  if (command === "add") {
    const { source, targetDir, force, skipInstall } = parseAddOptions(rest);
    if (!source) {
      throw new Error("Missing repo. Usage: eve-agents add <owner>/<repo>");
    }
    await addAgent(source, { targetDir, force, skipInstall });
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
