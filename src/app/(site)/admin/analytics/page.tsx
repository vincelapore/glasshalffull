import type { Metadata } from "next";

import { AnalyticsPanels } from "@/components/admin/analytics-panels";
import { EmptyState, Page, PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/admin";
import { getSiteAnalytics } from "@/lib/vercel-analytics";

export const metadata: Metadata = {
  title: "Analytics",
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const result = await getSiteAnalytics("7d");

  return (
    <Page width="wide">
      <PageHeader title="Analytics" />

      {"kind" in result ? (
        <EmptyState>
          {result.message}
          {result.kind === "config" ? (
            <>
              {" "}
              Create a Vercel access token, then set{" "}
              <code className="font-mono text-xs">VERCEL_TOKEN</code>,{" "}
              <code className="font-mono text-xs">VERCEL_PROJECT_ID</code>, and{" "}
              <code className="font-mono text-xs">VERCEL_TEAM_ID</code>.
            </>
          ) : null}
        </EmptyState>
      ) : (
        <AnalyticsPanels data={result} />
      )}
    </Page>
  );
}
