# eve-agents

A directory for [Eve](https://vercel.com/eve) agents — like [skills.sh](https://www.skills.sh), but for full agent templates.

Browse agents on the web. Install catalog agents with one command.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Install an agent

```bash
# From the monorepo after building the CLI
npm run build:cli
node packages/cli/dist/index.js add vercel-labs/eve-content-agent-template

# Once published to npm
npx eve-agents add vercel-labs/eve-content-agent-template
npx eve-agents add vercel-labs/personal-agent-template --dir my-agent
npx eve-agents list
npx eve-agents list --all
```

### CLI flags

| Flag | Description |
|------|-------------|
| `--dir <name>` | Install into a subdirectory (must stay inside cwd) |
| `--force` | Install repos not in the catalog |
| `--skip-install` | Clone only; skip `npm install` |

Catalog agents are allowlisted by default. The CLI verifies `agent/instructions.md` (or `.ts`) exists after clone.

## Project layout

```text
eve-agents/
├── apps/web/                  # Next.js directory site
├── packages/catalog/          # Shared agent catalog + file install store
├── packages/cli/              # eve-agents CLI (bundles catalog at build)
└── data/install-counts.json   # Local install counts (dev only)
```

## Add an agent to the directory

Edit `packages/catalog/src/agents.json` and open a PR with owner, repo, description, channels, connections, tags, and `featured`.

Run `npm run build:cli` after changing the catalog so the CLI bundle stays in sync.

## Install telemetry

Install counts are stored separately from catalog metadata:

- **Local dev:** `data/install-counts.json` (atomic writes)
- **Production:** Vercel KV via `KV_REST_API_URL` and `KV_REST_API_TOKEN`

Configure the CLI to report installs:

```bash
export EVE_AGENTS_TELEMETRY_URL=http://localhost:3000/api/install
export INSTALL_API_SECRET=your-secret   # required in production
```

On Vercel, set `INSTALL_API_SECRET` on both the web app and clients that POST to `/api/install`.

## Related

- [Eve framework](https://eve.dev/docs)
- [Vercel Eve templates](https://vercel.com/kb/eve)
- [skills.sh](https://www.skills.sh)
