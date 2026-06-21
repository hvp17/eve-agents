export type AgentRecord = {
  id: string;
  name: string;
  owner: string;
  repo: string;
  description: string;
  channels: string[];
  connections: string[];
  tags: string[];
  featured: boolean;
};

export type IndexerConfig = {
  githubToken: string;
  sourceOrg: string;
  catalogOwner: string;
  catalogRepo: string;
  catalogPath: string;
  baseBranch: string;
};

export type IndexerResult = {
  scanned: number;
  eveRepos: number;
  newAgents: AgentRecord[];
  prUrl: string | null;
  message: string;
};
