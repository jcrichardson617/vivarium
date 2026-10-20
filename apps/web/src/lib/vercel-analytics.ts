// Reads page views from Vercel Web Analytics for Admin → Traffic.
// The project and team ids are not secrets; the token is (Vercel → Account
// Settings → Tokens, scoped to the "vivarium" team), stored as
// VERCEL_ANALYTICS_TOKEN in the Vercel project's environment variables.
const PROJECT_ID = "prj_RyHfy0Rdt5D3kiX5xSLhH3eGre2q";
const TEAM_ID = "team_nYMU0Qq4dsmKNMGKzZ72F5AK";
const ENDPOINT = "https://api.vercel.com/v1/query/web-analytics/visits/aggregate";

export type Dimension = "day" | "requestPath" | "referrerHostname" | "country" | "deviceType";

export type TrafficRow = { key: string; pageviews: number; visitors: number };

export function analyticsConfigured() {
  return !!process.env.VERCEL_ANALYTICS_TOKEN;
}

export async function trafficBy(by: Dimension, since: Date, until: Date, limit = 10): Promise<TrafficRow[]> {
  const params = new URLSearchParams({
    projectId: PROJECT_ID,
    teamId: TEAM_ID,
    by,
    since: since.toISOString(),
    until: until.toISOString(),
    limit: String(limit),
  });
  const res = await fetch(`${ENDPOINT}?${params}`, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_ANALYTICS_TOKEN}` },
    // Vercel's numbers lag by a few minutes anyway.
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Vercel Analytics ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { data: Record<string, unknown>[] };
  const keyField = by === "day" ? "timestamp" : by;
  return json.data.map((r) => ({
    key: String(r[keyField] ?? ""),
    pageviews: Number(r.pageviews ?? 0),
    visitors: Number(r.visitors ?? 0),
  }));
}
