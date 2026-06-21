#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type EveAgent = {
  owner: string;
  repo: string;
  name: string;
};

function parseRepoArg(arg: string): { owner: string; repo: string } {
  const cleaned = arg
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");

  const [owner, repo] = cleaned.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repo: ${arg}. Use owner/repo format.`);
  }

  return { owner, repo };
}

async function loadCatalog(): Promise<EveAgent[]> {
  const catalogPath = path.resolve(__dirname, "../../catalog/src/agents.json");
  const raw = await readFile(catalogPath, "utf8");
  return JSON.parse(raw) as EveAgent[];
}

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function recordInstall(owner: string, repo: string): Promise<void> {
  const endpoint = process.env.EVE_AGENTS_TELEMETRY_URL;
  if (!endpoint) return;

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ owner, repo, source: "cli" }),
    });
  } catch {
    // Telemetry is best-effort for MVP.
  }
}

async function addAgent(source: string, targetDir?: string): Promise<void> {
  const { owner, repo } = parseRepoArg(source);
  const dir = targetDir ?? repo;
  const destination = path.resolve(process.cwd(), dir);

  if (existsSync(destination)) {
    throw new Error(`Directory already exists: ${destination}`);
  }

  const gitUrl = `https://github.com/${owner}/${repo}.git`;
  console.log(`Cloning ${owner}/${repo} into ${dir}...`);
  await run("git", ["clone", "--depth", "1", gitUrl, dir], process.cwd());

  const pkgPath = path.join(destination, "package.json");
  if (existsSync(pkgPath)) {
    console.log("Installing dependencies...");
    await run("npm", ["install"], destination);
  }

  await recordInstall(owner, repo);

  console.log(`\nDone! Agent installed at ./${dir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${dir}`);
  console.log(`  npm run dev`);
}

async function listAgents(): Promise<void> {
  const agents = await loadCatalog();
  console.log("Featured Eve agents:\n");
  for (const agent of agents) {
    console.log(`  ${agent.owner}/${agent.repo}`);
    console.log(`    ${agent.name}`);
    console.log(`    npx eve-agents add ${agent.owner}/${agent.repo}\n`);
  }
}

function printHelp(): void {
  console.log(`eve-agents — discover and install Eve agent templates

Usage:
  npx eve-agents add <owner>/<repo> [--dir <name>]   Clone and install an agent
  npx eve-agents list                               List featured agents

Examples:
  npx eve-agents add vercel-labs/eve-content-agent-template
  npx eve-agents add vercel-labs/personal-agent-template --dir my-agent
`);
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "list") {
    await listAgents();
    return;
  }

  if (command === "add") {
    const source = rest[0];
    if (!source) {
      throw new Error("Missing repo. Usage: eve-agents add <owner>/<repo>");
    }

    const dirIndex = rest.indexOf("--dir");
    const targetDir = dirIndex >= 0 ? rest[dirIndex + 1] : undefined;
    await addAgent(source, targetDir);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
