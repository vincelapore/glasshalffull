const API_BASE = "https://api.vercel.com/v1/query/web-analytics";

export type AnalyticsRange = "7d" | "30d" | "90d";

export const analyticsRanges = [
  { id: "7d" as const, label: "7 days", days: 7 },
  { id: "30d" as const, label: "30 days", days: 30 },
  { id: "90d" as const, label: "90 days", days: 90 },
];

export function isAnalyticsRange(value: string | undefined): value is AnalyticsRange {
  return value === "7d" || value === "30d" || value === "90d";
}

type VisitTotals = {
  pageviews: number;
  visitors: number;
};

type DailyRow = VisitTotals & {
  timestamp: string;
};

type DimensionRow = VisitTotals & {
  key: string;
};

type AggregateRawRow = {
  pageviews?: number;
  visitors?: number;
  timestamp?: string;
  route?: string;
  requestPath?: string;
  referrerHostname?: string;
  deviceType?: string;
  browserName?: string;
  osName?: string;
  country?: string;
};

export type SiteAnalytics = {
  range: AnalyticsRange;
  since: string;
  until: string;
  totals: VisitTotals;
  previousTotals: VisitTotals | null;
  daily: DailyRow[];
  pages: DimensionRow[];
  routes: DimensionRow[];
  referrers: DimensionRow[];
  devices: DimensionRow[];
  browsers: DimensionRow[];
  operatingSystems: DimensionRow[];
  countries: DimensionRow[];
};

export type AnalyticsConfigError = {
  kind: "config";
  message: string;
};

export type AnalyticsFetchError = {
  kind: "fetch";
  message: string;
};

function getConfig():
  | { token: string; projectId: string; teamId: string | undefined }
  | AnalyticsConfigError {
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId =
    process.env.VERCEL_PROJECT_ID?.trim() ||
    process.env.VERCEL_ANALYTICS_PROJECT_ID?.trim();
  const teamId =
    process.env.VERCEL_TEAM_ID?.trim() ||
    process.env.VERCEL_ORG_ID?.trim() ||
    process.env.VERCEL_ANALYTICS_TEAM_ID?.trim();

  if (!token) {
    return {
      kind: "config",
      message:
        "Add VERCEL_TOKEN to the environment so admin analytics can read Web Analytics.",
    };
  }
  if (!projectId) {
    return {
      kind: "config",
      message:
        "Add VERCEL_PROJECT_ID (or VERCEL_ANALYTICS_PROJECT_ID) so admin analytics knows which project to query.",
    };
  }

  return { token, projectId, teamId: teamId || undefined };
}

/** Inclusive UTC calendar range → exclusive `until` at next midnight (API-safe). */
function rangeWindow(range: AnalyticsRange, end = new Date()) {
  const days =
    analyticsRanges.find((item) => item.id === range)?.days ?? 30;
  const endDay = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  );
  const since = new Date(endDay);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const until = new Date(endDay);
  until.setUTCDate(until.getUTCDate() + 1);

  return {
    days,
    since: since.toISOString(),
    until: until.toISOString(),
  };
}

function previousWindow(range: AnalyticsRange, currentSince: string) {
  const days =
    analyticsRanges.find((item) => item.id === range)?.days ?? 30;
  const until = new Date(currentSince);
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - days);

  return {
    since: since.toISOString(),
    until: until.toISOString(),
  };
}

async function queryVisits(
  path: "visits/count" | "visits/aggregate",
  params: Record<string, string | number | undefined>,
  token: string
): Promise<unknown> {
  const url = new URL(`${API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Vercel Analytics ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`
    );
  }

  return response.json();
}

function readTotals(payload: unknown): VisitTotals {
  const data = (payload as { data?: VisitTotals } | null)?.data;
  return {
    pageviews: Number(data?.pageviews ?? 0),
    visitors: Number(data?.visitors ?? 0),
  };
}

function readAggregate(payload: unknown): AggregateRawRow[] {
  const data = (payload as { data?: AggregateRawRow[] } | null)?.data;
  return Array.isArray(data) ? data : [];
}

function mapDimension(
  rows: AggregateRawRow[],
  key: keyof AggregateRawRow
): DimensionRow[] {
  return rows
    .map((row) => ({
      key: String(row[key] ?? ""),
      pageviews: Number(row.pageviews ?? 0),
      visitors: Number(row.visitors ?? 0),
    }))
    .filter((row) => row.key !== "Others")
    .sort((a, b) => b.visitors - a.visitors || b.pageviews - a.pageviews);
}

export async function getSiteAnalytics(
  range: AnalyticsRange = "30d"
): Promise<SiteAnalytics | AnalyticsConfigError | AnalyticsFetchError> {
  const config = getConfig();
  if ("kind" in config) return config;

  const { since, until } = rangeWindow(range);
  const previous = previousWindow(range, since);
  const base = {
    projectId: config.projectId,
    teamId: config.teamId,
  };

  try {
    const [
      totalsPayload,
      previousPayload,
      dailyPayload,
      pagesPayload,
      routesPayload,
      referrersPayload,
      devicesPayload,
      browsersPayload,
      osPayload,
      countriesPayload,
    ] = await Promise.all([
      queryVisits(
        "visits/count",
        { ...base, since, until },
        config.token
      ),
      queryVisits(
        "visits/count",
        { ...base, since: previous.since, until: previous.until },
        config.token
      ),
      queryVisits(
        "visits/aggregate",
        { ...base, since, until, by: "day", limit: 100 },
        config.token
      ),
      queryVisits(
        "visits/aggregate",
        { ...base, since, until, by: "requestPath", limit: 10 },
        config.token
      ),
      queryVisits(
        "visits/aggregate",
        { ...base, since, until, by: "route", limit: 10 },
        config.token
      ),
      queryVisits(
        "visits/aggregate",
        { ...base, since, until, by: "referrerHostname", limit: 8 },
        config.token
      ),
      queryVisits(
        "visits/aggregate",
        { ...base, since, until, by: "deviceType", limit: 5 },
        config.token
      ),
      queryVisits(
        "visits/aggregate",
        { ...base, since, until, by: "browserName", limit: 8 },
        config.token
      ),
      queryVisits(
        "visits/aggregate",
        { ...base, since, until, by: "osName", limit: 8 },
        config.token
      ),
      queryVisits(
        "visits/aggregate",
        { ...base, since, until, by: "country", limit: 8 },
        config.token
      ),
    ]);

    const untilMs = Date.parse(until);
    const daily = readAggregate(dailyPayload)
      .filter((row) => row.timestamp && Date.parse(row.timestamp) < untilMs)
      .map((row) => ({
        timestamp: row.timestamp!,
        pageviews: Number(row.pageviews ?? 0),
        visitors: Number(row.visitors ?? 0),
      }));

    return {
      range,
      since,
      until,
      totals: readTotals(totalsPayload),
      previousTotals: readTotals(previousPayload),
      daily,
      pages: mapDimension(readAggregate(pagesPayload), "requestPath"),
      routes: mapDimension(readAggregate(routesPayload), "route"),
      referrers: mapDimension(readAggregate(referrersPayload), "referrerHostname"),
      devices: mapDimension(readAggregate(devicesPayload), "deviceType"),
      browsers: mapDimension(readAggregate(browsersPayload), "browserName"),
      operatingSystems: mapDimension(readAggregate(osPayload), "osName"),
      countries: mapDimension(readAggregate(countriesPayload), "country"),
    };
  } catch (error) {
    return {
      kind: "fetch",
      message:
        error instanceof Error
          ? error.message
          : "Could not load analytics from Vercel.",
    };
  }
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
