import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "../catalog/src/agents.json");
const srcTarget = path.join(root, "src/catalog.json");
const distTarget = path.join(root, "dist/catalog.json");

const json = readFileSync(source, "utf8");

mkdirSync(path.dirname(srcTarget), { recursive: true });
writeFileSync(srcTarget, json);

mkdirSync(path.dirname(distTarget), { recursive: true });
copyFileSync(srcTarget, distTarget);

console.log("Bundled catalog to packages/cli/src/catalog.json and dist/catalog.json");
