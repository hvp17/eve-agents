import Link from "next/link";
import { notFound } from "next/navigation";
import { agentCatalog, getAgent, installCommand } from "@/lib/catalog";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ owner: string; repo: string }>;
};

export function generateStaticParams() {
  return agentCatalog.map((agent) => ({
    owner: agent.owner,
    repo: agent.repo,
  }));
}

export default async function AgentPage({ params }: PageProps) {
  const { owner, repo } = await params;
  const agent = await getAgent(owner, repo);

  if (!agent) {
    notFound();
  }

  const command = installCommand(owner, repo);
  const githubUrl = `https://github.com/${owner}/${repo}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-muted transition hover:text-foreground">
        ← Back to directory
      </Link>

      <header className="mt-6 mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {owner}/{repo}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{agent.name}</h1>
        <p className="mt-4 text-base leading-7 text-muted">{agent.description}</p>
      </header>

      <section className="mb-8 rounded-xl border border-border bg-card p-5">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
          Install
        </p>
        <code className="block overflow-x-auto font-mono text-sm text-accent">
          $ {command}
        </code>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-xl border border-border p-5">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
            Channels
          </h2>
          <ul className="space-y-2 text-sm">
            {agent.channels.length ? (
              agent.channels.map((channel) => (
                <li key={channel} className="font-mono text-foreground">
                  {channel}
                </li>
              ))
            ) : (
              <li className="text-muted">None listed</li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-border p-5">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
            Connections
          </h2>
          <ul className="space-y-2 text-sm">
            {agent.connections.length ? (
              agent.connections.map((connection) => (
                <li key={connection} className="font-mono text-foreground">
                  {connection}
                </li>
              ))
            ) : (
              <li className="text-muted">None listed</li>
            )}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border p-5">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
          Tags
        </h2>
        <div className="flex flex-wrap gap-2">
          {agent.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <a
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-border px-4 py-2 transition hover:border-accent hover:text-accent"
        >
          View on GitHub
        </a>
        <span className="self-center font-mono text-muted">
          {agent.installs.toLocaleString()} installs
        </span>
      </div>
    </main>
  );
}
