/** Production directory site. Override with EVE_AGENTS_SITE_URL at runtime. */
export const DEFAULT_TELEMETRY_ORIGIN = "https://eve-agents.vercel.app";

export function getDefaultTelemetryUrl(): string {
  const origin =
    process.env.EVE_AGENTS_SITE_URL?.replace(/\/$/, "") ?? DEFAULT_TELEMETRY_ORIGIN;
  return `${origin}/api/install`;
}

/**
 * Public client token shipped in the CLI for install telemetry.
 * Set the same value as TELEMETRY_CLIENT_TOKEN on Vercel.
 */
export const TELEMETRY_CLIENT_TOKEN = "ea_pub_8c4f2e1a9b6d3f7e";
