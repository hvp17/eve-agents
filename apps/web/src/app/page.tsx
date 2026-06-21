import Link from "next/link";
import { Suspense } from "react";
import { searchAgents, installCommand } from "@/lib/catalog";
import { AgentSearch } from "@/components/agent-search";

export const revalidate = 60;

type HomeProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { q } = await searchParams;
  const agents = await searchAgents(q ?? "");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="mb-14">
        <pre className="mb-8 font-mono text-[10px] leading-tight text-accent sm:text-xs">
{`███████╗██╗   ██╗███████╗
██╔════╝██║   ██║██╔════╝
█████╗  ██║   ██║█████╗
██╔══╝  ╚██╗ ██╔╝██╔══╝
███████╗ ╚████╔╝ ███████╗
╚══════╝  ╚═══╝  ╚══════╝`}
        </pre>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          The Eve agent directory
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted">
          Discover durable Eve agents you can clone and deploy. Install a template
          with one command — instructions, tools, channels, and schedules included.
        </p>
      </section>

      <section className="mb-12 rounded-xl border border-border bg-card p-5">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
          Try it now
        </p>
        <code className="block overflow-x-auto font-mono text-sm text-accent">
          $ npx eve-agents add vercel-labs/eve-content-agent-template
        </code>
      </section>

      <section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-medium">Agent leaderboard</h2>
            <p className="mt-1 text-sm text-muted">
              {agents.length} template{agents.length === 1 ? "" : "s"}
              {q ? ` matching “${q}”` : " · sorted by installs"}
            </p>
          </div>
          <Suspense fallback={null}>
            <AgentSearch />
          </Suspense>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-card font-mono text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Channels</th>
                <th className="px-4 py-3 font-medium text-right">Installs</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, index) => (
                <tr
                  key={agent.id}
                  className="border-b border-border/70 transition hover:bg-card/80"
                >
                  <td className="px-4 py-4 font-mono text-muted">{index + 1}</td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/${agent.owner}/${agent.repo}`}
                      className="group block"
                    >
                      <span className="font-medium text-foreground group-hover:text-accent">
                        {agent.name}
                      </span>
                      <span className="mt-1 block font-mono text-xs text-muted">
                        {agent.owner}/{agent.repo}
                      </span>
                      <span className="mt-2 block text-sm text-muted md:hidden">
                        {agent.channels.join(" · ") || "—"}
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-4 md:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {agent.channels.map((channel) => (
                        <span
                          key={channel}
                          className="rounded-full border border-border px-2 py-0.5 font-mono text-xs text-muted"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-muted">
                    {agent.installs.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14 rounded-xl border border-dashed border-border p-6 text-sm text-muted">
        <p>
          Submit your agent by opening a PR to{" "}
          <code className="font-mono text-foreground">packages/catalog/src/agents.json</code>.
          Install counts are recorded when users run{" "}
          <code className="font-mono text-foreground">
            {installCommand("owner", "repo")}
          </code>{" "}
          with telemetry configured.
        </p>
      </section>
    </main>
  );
}
