# eve-agents

A directory for [Eve](https://vercel.com/eve) agents — like [skills.sh](https://www.skills.sh), but for full agent templates.

Browse agents on the web. Install them with one command.

## Quick start

```bash
# Install dependencies
npm install

# Run the directory site
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Install an agent

```bash
npx eve-agents add vercel-labs/eve-content-agent-template
npx eve-agents add vercel-labs/personal-agent-template --dir my-agent
npx eve-agents list
```

## Project layout

```text
eve-agents/
├── apps/web/                  # Next.js directory site
├── packages/catalog/          # Shared agent catalog data
└── packages/cli/              # eve-agents CLI
```

## Add an agent to the directory

Edit `packages/catalog/src/agents.json` and open a PR with:

- `owner` / `repo` (GitHub)
- name, description, channels, connections, tags
- initial `installs` count (starts at 0 for new entries)

## Telemetry (optional)

Set `EVE_AGENTS_TELEMETRY_URL` when using the CLI to POST install events:

```bash
export EVE_AGENTS_TELEMETRY_URL=http://localhost:3000/api/install
```

## Related

- [Eve framework](https://eve.dev/docs)
- [Vercel Eve templates](https://vercel.com/kb/eve)
- [skills.sh](https://www.skills.sh) — inspiration for this project
