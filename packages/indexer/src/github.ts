const GITHUB_API = "https://api.github.com";

type GitHubRepo = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
};

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "eve-agents-indexer",
  };
}

export async function listOrgRepos(
  org: string,
  token: string,
): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (page <= 10) {
    const response = await fetch(
      `${GITHUB_API}/orgs/${org}/repos?per_page=100&page=${page}&type=public`,
      { headers: headers(token), cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to list ${org} repos: ${response.status} ${await response.text()}`,
      );
    }

    const batch = (await response.json()) as GitHubRepo[];
    if (batch.length === 0) break;
    repos.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return repos;
}

export async function hasEveAgentStructure(
  owner: string,
  repo: string,
  token: string,
): Promise<boolean> {
  for (const path of ["agent/instructions.md", "agent/instructions.ts"]) {
    const response = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
      { headers: headers(token), cache: "no-store" },
    );
    if (response.ok) return true;
  }
  return false;
}

export async function fetchCatalogFile(
  owner: string,
  repo: string,
  path: string,
  token: string,
  ref = "main",
): Promise<{ content: string; sha: string }> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
    { headers: headers(token), cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch catalog file: ${response.status} ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as {
    content: string;
    sha: string;
    encoding: string;
  };

  const content = Buffer.from(payload.content, "base64").toString("utf8");
  return { content, sha: payload.sha };
}

export async function createCatalogPullRequest(options: {
  token: string;
  catalogOwner: string;
  catalogRepo: string;
  catalogPath: string;
  baseBranch: string;
  updatedCatalogJson: string;
  newAgentCount: number;
  newAgentIds: string[];
}): Promise<string> {
  const {
    token,
    catalogOwner,
    catalogRepo,
    catalogPath,
    baseBranch,
    updatedCatalogJson,
    newAgentCount,
    newAgentIds,
  } = options;

  const refResponse = await fetch(
    `${GITHUB_API}/repos/${catalogOwner}/${catalogRepo}/git/ref/heads/${baseBranch}`,
    { headers: headers(token), cache: "no-store" },
  );

  if (!refResponse.ok) {
    throw new Error(`Failed to read base ref: ${refResponse.status}`);
  }

  const refPayload = (await refResponse.json()) as { object: { sha: string } };
  const baseSha = refPayload.object.sha;
  const branch = `catalog/index-${Date.now()}`;

  const createRefResponse = await fetch(
    `${GITHUB_API}/repos/${catalogOwner}/${catalogRepo}/git/refs`,
    {
      method: "POST",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
    },
  );

  if (!createRefResponse.ok) {
    throw new Error(
      `Failed to create branch: ${createRefResponse.status} ${await createRefResponse.text()}`,
    );
  }

  const { sha: fileSha } = await fetchCatalogFile(
    catalogOwner,
    catalogRepo,
    catalogPath,
    token,
    branch,
  );

  const commitMessage = `chore(catalog): index ${newAgentCount} Eve agent(s) from vercel-labs`;

  const updateResponse = await fetch(
    `${GITHUB_API}/repos/${catalogOwner}/${catalogRepo}/contents/${catalogPath}`,
    {
      method: "PUT",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(updatedCatalogJson).toString("base64"),
        sha: fileSha,
        branch,
      }),
    },
  );

  if (!updateResponse.ok) {
    throw new Error(
      `Failed to update catalog: ${updateResponse.status} ${await updateResponse.text()}`,
    );
  }

  const prBody = [
    "## Auto-indexed Eve agents",
    "",
    `Discovered **${newAgentCount}** new Eve agent repo(s) in \`vercel-labs\`:`,
    "",
    ...newAgentIds.map((id) => `- \`${id}\``),
    "",
    "Each repo contains `agent/instructions.md` or `agent/instructions.ts`.",
    "",
    "Please review metadata (channels, connections, tags) before merging.",
  ].join("\n");

  const prResponse = await fetch(
    `${GITHUB_API}/repos/${catalogOwner}/${catalogRepo}/pulls`,
    {
      method: "POST",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        title: commitMessage,
        head: branch,
        base: baseBranch,
        body: prBody,
      }),
    },
  );

  if (!prResponse.ok) {
    throw new Error(
      `Failed to open PR: ${prResponse.status} ${await prResponse.text()}`,
    );
  }

  const pr = (await prResponse.json()) as { html_url: string };
  return pr.html_url;
}
