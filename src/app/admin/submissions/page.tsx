import type { Metadata } from "next";
import Link from "next/link";

import {
  CreativeSubmissionCard,
  EventSubmissionCard,
} from "@/components/admin/submission-cards";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { ChipRow, EmptyState, Page, PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/admin";
import { getSubmissions } from "@/lib/queries";
import { submissionStatuses } from "@/lib/validations";

export const metadata: Metadata = {
  title: "Moderation",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  status?: string;
  type?: string;
}>;

const statusFilters = ["pending", "approved", "rejected", "all"] as const;
const typeFilters = ["all", "events", "creatives"] as const;

function isStatusFilter(
  value: string | undefined
): value is (typeof statusFilters)[number] {
  return !!value && statusFilters.includes(value as (typeof statusFilters)[number]);
}

function isTypeFilter(
  value: string | undefined
): value is (typeof typeFilters)[number] {
  return !!value && typeFilters.includes(value as (typeof typeFilters)[number]);
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;
  const status = isStatusFilter(params.status) ? params.status : "pending";
  const type = isTypeFilter(params.type) ? params.type : "all";

  const { events, creatives } = await getSubmissions({
    status: status === "all" ? "all" : (status as (typeof submissionStatuses)[number]),
    type,
  });

  const total = events.length + creatives.length;

  return (
    <Page>
      <PageHeader
        title="Moderation"
        description="Review, edit, approve, reject, or delete community submissions."
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/admin/creatives/new" />}
            >
              New profile
            </Button>
            <Button size="sm" render={<Link href="/admin/events/new" />}>
              New event
            </Button>
          </>
        }
      />

      <div className="mb-8 flex flex-col gap-4">
        <ChipRow>
          {statusFilters.map((filter) => (
            <FilterChip
              key={filter}
              href={`/admin/submissions?status=${filter}&type=${type}`}
              active={status === filter}
              className="capitalize"
            >
              {filter}
            </FilterChip>
          ))}
        </ChipRow>
        <ChipRow>
          {typeFilters.map((filter) => (
            <FilterChip
              key={filter}
              href={`/admin/submissions?status=${status}&type=${filter}`}
              active={type === filter}
              tone="subtle"
              className="capitalize"
            >
              {filter}
            </FilterChip>
          ))}
        </ChipRow>
      </div>

      {total === 0 ? (
        <EmptyState align="center">
          No {status === "all" ? "" : `${status} `}submissions
          {type === "all" ? "" : ` in ${type}`} yet.
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {type !== "creatives"
            ? events.map(({ event, organisers }) => (
                <EventSubmissionCard
                  key={event.id}
                  event={event}
                  organisers={organisers}
                />
              ))
            : null}
          {type !== "events"
            ? creatives.map((creative) => (
                <CreativeSubmissionCard key={creative.id} creative={creative} />
              ))
            : null}
        </div>
      )}
    </Page>
  );
}
