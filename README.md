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
- **Production:** Upstash Redis / Vercel KV via `KV_REST_API_URL` and `KV_REST_API_TOKEN`

The CLI reports installs automatically after each catalog `add` (skills.sh-style). No env vars required for end users.

### Vercel env vars

| Variable | Required | Value |
|----------|----------|-------|
| `KV_REST_API_URL` | Yes | From Upstash integration |
| `KV_REST_API_TOKEN` | Yes | From Upstash integration |
| `TELEMETRY_CLIENT_TOKEN` | Yes | `ea_pub_8c4f2e1a9b6d3f7e` (matches embedded CLI token) |
| `INSTALL_API_SECRET` | Optional | Admin override for manual API calls |

Disable telemetry locally: `EVE_AGENTS_TELEMETRY=0`

Override endpoint (staging): `EVE_AGENTS_TELEMETRY_URL=https://your-preview.vercel.app/api/install`

Update `packages/cli/src/telemetry.ts` (`DEFAULT_TELEMETRY_ORIGIN`) or set `EVE_AGENTS_SITE_URL` if your production URL differs.

### Test install telemetry locally

```bash
# terminal 1
npm run dev

# terminal 2
EVE_AGENTS_TELEMETRY_URL=http://localhost:3000/api/install \
  node packages/cli/dist/index.js add vercel-labs/eve-slack-agent-template \
  --dir test-slack --skip-install
```

You should see `Install recorded (1 total on directory)` and `data/install-counts.json` will update.

## Deploy on Vercel

1. Import the GitHub repo and set **Root Directory** to `apps/web`.
2. Enable **Include source files outside of the Root Directory** (needed for the `@eve-agents/catalog` workspace package).
3. Add Upstash Redis and env vars from [Install telemetry](#install-telemetry) above.
4. `apps/web/vercel.json` installs dependencies from the monorepo root, then runs `next build`.

## Related

- [Eve framework](https://eve.dev/docs)
- [Vercel Eve templates](https://vercel.com/kb/eve)
- [skills.sh](https://www.skills.sh)
