"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export function AgentSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/");
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full sm:w-72">
      <label htmlFor="agent-search" className="sr-only">
        Search agents
      </label>
      <input
        id="agent-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search agents..."
        className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none ring-accent/40 placeholder:text-muted focus:ring-2"
      />
    </form>
  );
}
