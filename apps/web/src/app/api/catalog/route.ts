import { NextResponse } from "next/server";
import { getAgentCatalogWithInstalls } from "@/lib/catalog-source";

export const revalidate = 3600;

export async function GET() {
  const agents = await getAgentCatalogWithInstalls();

  return NextResponse.json({
    agents: agents.map(({ installs, ...record }) => ({
      ...record,
      installs,
    })),
    count: agents.length,
    updatedAt: new Date().toISOString(),
  });
}
