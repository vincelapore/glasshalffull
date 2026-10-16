"use client";

import { useId, useMemo, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/ui/page";
import { percentChange, type SiteAnalytics } from "@/lib/vercel-analytics";
import { cn } from "@/lib/utils";

type MetricKey = "visitors" | "pageviews";

type RankRow = {
  key: string;
  visitors: number;
  pageviews: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-AU").format(value);
}

function formatChange(current: number, previous: number | undefined) {
  if (previous === undefined) return null;
  const change = percentChange(current, previous);
  if (change === null) return "new";
  if (change === 0) return "0%";
  const abs = Math.abs(change);
  const rounded = abs >= 1000
    ? `${Math.round(change / 100) / 10}K%`
    : abs >= 10
      ? `${Math.round(change)}%`
      : `${Number(change.toFixed(1))}%`;
  return `${change > 0 ? "+" : ""}${rounded}`;
}

function formatDayLabel(iso: string) {
  return new Intl.DateTimeFormat("en-AU", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function formatDayLong(iso: string) {
  return new Intl.DateTimeFormat("en-AU", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function referrerLabel(host: string) {
  if (!host) return "Direct / unknown";
  if (host.includes("instagram")) return host.startsWith("l.") ? "Instagram" : "instagram.com";
  if (host.includes("facebook") || host === "m.facebook.com") return "Facebook";
  if (host.includes("google")) return "Google";
  return host.replace(/^www\./, "");
}

function deviceLabel(value: string) {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function countryLabel(code: string) {
  if (!code) return "Unknown";
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ??
      code
    );
  } catch {
    return code;
  }
}

function countryFlag(code: string) {
  if (!/^[a-z]{2}$/i.test(code)) return null;
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...[...upper].map((char) => 127397 + char.charCodeAt(0))
  );
}

function MetricButton({
  label,
  value,
  previous,
  active,
  onClick,
}: {
  label: string;
  value: number;
  previous?: number;
  active: boolean;
  onClick: () => void;
}) {
  const change = formatChange(value, previous);
  const delta =
    previous === undefined ? null : percentChange(value, previous);
  const up = delta !== null && delta > 0;
  const down = delta !== null && delta < 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex-1 px-4 py-4 text-left transition-colors sm:px-5",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <p className="text-sm">{label}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-2">
        <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {formatNumber(value)}
        </span>
        {change ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[11px] tabular-nums",
              up && "bg-liquid/15 text-liquid",
              down && "bg-destructive/10 text-destructive",
              !up && !down && "bg-muted text-muted-foreground"
            )}
          >
            {change}
          </span>
        ) : null}
      </div>
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-foreground transition-opacity",
          active ? "opacity-100" : "opacity-0"
        )}
      />
    </button>
  );
}

function PanelHeader({
  tabs,
  active,
  onChange,
  metricLabel,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange?: (id: string) => void;
  metricLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-border/70 px-4">
      <div className="flex gap-4">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          const interactive = Boolean(onChange) && tabs.length > 1;

          if (!interactive) {
            return (
              <p
                key={tab.id}
                className="py-3 text-sm font-medium text-foreground"
              >
                {tab.label}
              </p>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange?.(tab.id)}
              className={cn(
                "-mb-px border-b-2 py-3 text-sm transition-colors",
                selected
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <p className="pb-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {metricLabel}
      </p>
    </div>
  );
}

function RankedRows({
  rows,
  empty,
  metric,
  formatKey,
  leading,
}: {
  rows: RankRow[];
  empty: string;
  metric: MetricKey;
  formatKey?: (key: string) => string;
  leading?: (key: string) => ReactNode;
}) {
  const total = rows.reduce((sum, row) => sum + row[metric], 0) || 1;
  const max = Math.max(...rows.map((row) => row[metric]), 1);

  if (rows.length === 0) {
    return <EmptyState className="m-4">{empty}</EmptyState>;
  }

  return (
    <ul className="space-y-1 p-2">
      {rows.map((row) => {
        const value = row[metric];
        const pct = Math.round((value / total) * 100);
        const width = Math.max((value / max) * 100, 3);

        return (
          <li key={row.key || "empty"}>
            <div className="relative overflow-hidden rounded-lg px-3 py-2.5">
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 rounded-lg bg-muted/80"
                style={{ width: `${width}%` }}
              />
              <div className="relative flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 truncate">
                  {leading?.(row.key)}
                  <span className="truncate">
                    {formatKey ? formatKey(row.key) : row.key || "-"}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatNumber(value)}
                  <span className="ml-2 text-xs">{pct}%</span>
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AnalyticsChart({
  daily,
  metric,
}: {
  daily: SiteAnalytics["daily"];
  metric: MetricKey;
}) {
  const gradientId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const width = 640;
  const height = 220;
  const pad = { top: 16, right: 12, bottom: 28, left: 36 };
  const values = daily.map((day) => day[metric]);
  const max = Math.max(...values, 1);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const points = useMemo(
    () =>
      daily.map((day, index) => {
        const x =
          daily.length === 1
            ? pad.left + innerW / 2
            : pad.left + (index / (daily.length - 1)) * innerW;
        const y = pad.top + innerH - (day[metric] / max) * innerH;
        return { x, y, day, value: day[metric] };
      }),
    [daily, innerH, innerW, max, metric, pad.left, pad.top]
  );

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1]!.x} ${pad.top + innerH} L ${points[0]!.x} ${pad.top + innerH} Z`
      : "";

  const yTicks = [0, 0.5, 1].map((ratio) => ({
    ratio,
    value: Math.round(max * ratio),
    y: pad.top + innerH - ratio * innerH,
  }));

  const hover = activeIndex !== null ? points[activeIndex] : null;

  return (
    <div
      className="relative px-2 pb-2 pt-1 sm:px-4"
      onMouseLeave={() => setActiveIndex(null)}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-52 w-full overflow-visible sm:h-56"
        role="img"
        aria-label={`${metric === "visitors" ? "Visitors" : "Page views"} over the last 7 days`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--liquid)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--liquid)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => (
          <g key={tick.ratio}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={tick.y}
              y2={tick.y}
              stroke="currentColor"
              className="text-border"
              strokeWidth="1"
            />
            <text
              x={pad.left - 8}
              y={tick.y + 3}
              textAnchor="end"
              className="fill-muted-foreground font-mono text-[10px]"
            >
              {formatNumber(tick.value)}
            </text>
          </g>
        ))}

        {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="var(--liquid)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {hover ? (
          <>
            <line
              x1={hover.x}
              x2={hover.x}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="currentColor"
              className="text-foreground/40"
              strokeWidth="1"
            />
            <circle
              cx={hover.x}
              cy={hover.y}
              r="4.5"
              fill="var(--background)"
              stroke="var(--liquid)"
              strokeWidth="2"
            />
          </>
        ) : null}

        {points.map((point, index) => (
          <rect
            key={point.day.timestamp}
            x={
              index === 0
                ? pad.left
                : (points[index - 1]!.x + point.x) / 2
            }
            y={pad.top}
            width={
              index === 0
                ? (points[1]?.x ?? point.x) - pad.left
                : index === points.length - 1
                  ? width - pad.right - (points[index - 1]!.x + point.x) / 2
                  : (points[index + 1]!.x - points[index - 1]!.x) / 2
            }
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setActiveIndex(index)}
          />
        ))}

        {daily.map((day, index) => {
          const show =
            daily.length <= 8 ||
            index === 0 ||
            index === daily.length - 1 ||
            index % 2 === 0;
          if (!show) return null;
          const x = points[index]?.x ?? 0;
          return (
            <text
              key={day.timestamp}
              x={x}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted-foreground font-mono text-[10px]"
            >
              {formatDayLabel(day.timestamp)}
            </text>
          );
        })}
      </svg>

      {hover ? (
        <div
          className="pointer-events-none absolute top-3 z-10 min-w-36 rounded-lg border border-border bg-background/95 px-3 py-2 text-sm shadow-sm backdrop-blur"
          style={{
            left: `clamp(0.75rem, ${(hover.x / width) * 100}%, calc(100% - 10rem))`,
          }}
        >
          <p className="flex items-center gap-2 font-medium tabular-nums">
            <span className="size-2 rounded-full bg-liquid" />
            {metric === "visitors" ? "Visitors" : "Page views"}{" "}
            {formatNumber(hover.value)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDayLong(hover.day.timestamp)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function AnalyticsPanels({ data }: { data: SiteAnalytics }) {
  const [metric, setMetric] = useState<MetricKey>("visitors");
  const [pathTab, setPathTab] = useState<"pages" | "routes">("pages");
  const [deviceTab, setDeviceTab] = useState<"devices" | "browsers" | "os">(
    "devices"
  );

  const pathRows = pathTab === "pages" ? data.pages : data.routes;
  const deviceRows =
    deviceTab === "devices"
      ? data.devices
      : deviceTab === "browsers"
        ? data.browsers
        : data.operatingSystems;

  const emptyDaily = data.daily.every(
    (day) => day.visitors === 0 && day.pageviews === 0
  );

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-border/70">
        <div className="flex divide-x divide-border/70 border-b border-border/70">
          <MetricButton
            label="Visitors"
            value={data.totals.visitors}
            previous={data.previousTotals?.visitors}
            active={metric === "visitors"}
            onClick={() => setMetric("visitors")}
          />
          <MetricButton
            label="Page views"
            value={data.totals.pageviews}
            previous={data.previousTotals?.pageviews}
            active={metric === "pageviews"}
            onClick={() => setMetric("pageviews")}
          />
        </div>

        {emptyDaily ? (
          <EmptyState className="m-4">No traffic in this range yet.</EmptyState>
        ) : (
          <AnalyticsChart daily={data.daily} metric={metric} />
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border/70">
        <PanelHeader
          tabs={[
            { id: "pages", label: "Pages" },
            { id: "routes", label: "Routes" },
          ]}
          active={pathTab}
          onChange={(id) => setPathTab(id as "pages" | "routes")}
          metricLabel={metric === "visitors" ? "Visitors" : "Page views"}
        />
        <RankedRows
          rows={pathRows}
          empty="No page data yet."
          metric={metric}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-border/70">
        <PanelHeader
          tabs={[{ id: "referrers", label: "Referrers" }]}
          active="referrers"
          metricLabel={metric === "visitors" ? "Visitors" : "Page views"}
        />
        <RankedRows
          rows={data.referrers}
          empty="No referrer data yet."
          metric={metric}
          formatKey={referrerLabel}
        />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-border/70">
          <PanelHeader
            tabs={[{ id: "countries", label: "Countries" }]}
            active="countries"
            metricLabel={metric === "visitors" ? "Visitors" : "Page views"}
          />
          <RankedRows
            rows={data.countries}
            empty="No country data yet."
            metric={metric}
            formatKey={countryLabel}
            leading={(key) => {
              const flag = countryFlag(key);
              return flag ? (
                <span aria-hidden className="text-base leading-none">
                  {flag}
                </span>
              ) : null;
            }}
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-border/70">
          <PanelHeader
            tabs={[
              { id: "devices", label: "Devices" },
              { id: "browsers", label: "Browsers" },
              { id: "os", label: "OS" },
            ]}
            active={deviceTab}
            onChange={(id) => setDeviceTab(id as "devices" | "browsers" | "os")}
            metricLabel={metric === "visitors" ? "Visitors" : "Page views"}
          />
          <RankedRows
            rows={deviceRows}
            empty="No device data yet."
            metric={metric}
            formatKey={
              deviceTab === "devices"
                ? deviceLabel
                : (key) => key || "Unknown"
            }
          />
        </section>
      </div>
    </div>
  );
}
