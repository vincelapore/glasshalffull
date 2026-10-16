import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState, Page, PageHeader, TextLink } from "@/components/ui/page";
import { requireAdmin } from "@/lib/admin";
import { cityShortLabels } from "@/lib/labels";
import { getOverflowEpisodes } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Overflow",
};

export const dynamic = "force-dynamic";

export default async function AdminOverflowPage() {
  await requireAdmin();
  const episodes = await getOverflowEpisodes("all");

  return (
    <Page width="narrow">
      <PageHeader
        title="Overflow"
        description="Episodes on the home banner. Saving publishes straight away."
        actions={
          <Button size="sm" render={<Link href="/admin/overflow/new" />}>
            New episode
          </Button>
        }
      />

      {episodes.length === 0 ? (
        <EmptyState>No episodes yet.</EmptyState>
      ) : (
        <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
          {episodes.map((episode) => (
            <li key={episode.id}>
              <TextLink
                href={`/admin/overflow/${episode.id}/edit`}
                variant="hover"
                className="flex items-baseline justify-between gap-4 px-4 py-3"
              >
                <span>
                  <span className="text-muted-foreground">
                    #{episode.number}{" "}
                  </span>
                  {episode.title}
                </span>
                <span className="text-sm text-muted-foreground">
                  {cityShortLabels[episode.city]}
                </span>
              </TextLink>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
