import type { Metadata } from "next";
import Link from "next/link";

import { AdminFind } from "@/components/admin/admin-find";
import { ModerationNewMenu } from "@/components/admin/moderation-new-menu";
import {
  CreativeSubmissionCard,
  EventSubmissionCard,
} from "@/components/admin/submission-cards";
import { FilterChip } from "@/components/ui/filter-chip";
import {
  ChipRow,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/ui/page";
import { requireAdmin } from "@/lib/admin";
import { isProfileReadyForPublic } from "@/lib/profile-visibility";
import { countPendingSubmissions, getSubmissions } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { submissionStatuses } from "@/lib/validations";

export const metadata: Metadata = {
  title: "Moderation",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  status?: string;
  type?: string;
}>;

const queues = [
  { status: "pending", label: "Needs review" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
] as const;

type QueueStatus = (typeof queues)[number]["status"];

const typeFilters = [
  { type: "all", label: "All" },
  { type: "creatives", label: "Creatives" },
  { type: "events", label: "Events" },
] as const;

type TypeFilter = (typeof typeFilters)[number]["type"];

function isQueueStatus(value: string | undefined): value is QueueStatus {
  return !!value && queues.some((queue) => queue.status === value);
}

function isTypeFilter(value: string | undefined): value is TypeFilter {
  return !!value && typeFilters.some((filter) => filter.type === value);
}

function queueHref(status: QueueStatus, type: TypeFilter = "all") {
  const params = new URLSearchParams();
  if (status !== "pending") params.set("status", status);
  if (status === "approved" && type !== "all") params.set("type", type);
  const qs = params.toString();
  return qs ? `/admin/submissions?${qs}` : "/admin/submissions";
}

const emptyCopy: Record<QueueStatus, string> = {
  pending: "Nothing waiting.",
  approved: "Nothing approved yet.",
  rejected: "Nothing rejected.",
};

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;
  const status: QueueStatus = isQueueStatus(params.status)
    ? params.status
    : "pending";
  const type: TypeFilter =
    status === "approved" && isTypeFilter(params.type) ? params.type : "all";

  const [{ events, creatives }, pendingCount] = await Promise.all([
    getSubmissions({
      status: status as (typeof submissionStatuses)[number],
      type,
    }),
    countPendingSubmissions(),
  ]);

  const items = [
    ...events.map((row) => ({
      kind: "event" as const,
      createdAt: row.event.createdAt,
      ...row,
    })),
    ...creatives.map((creative) => ({
      kind: "creative" as const,
      createdAt: creative.createdAt,
      creative,
    })),
  ].sort((a, b) => {
    if (status === "approved") {
      const aIncomplete =
        a.kind === "creative" && !isProfileReadyForPublic(a.creative);
      const bIncomplete =
        b.kind === "creative" && !isProfileReadyForPublic(b.creative);
      if (aIncomplete !== bIncomplete) return aIncomplete ? -1 : 1;
    }

    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  const incompleteApprovedCount =
    status === "approved"
      ? creatives.filter((creative) => !isProfileReadyForPublic(creative))
          .length
      : 0;

  return (
    <Page width="narrow">
      <PageHeader
        className="mb-6"
        title="Moderation"
        description="Decide what goes on the site."
        actions={<ModerationNewMenu />}
      />

      <AdminFind>
        <nav
          aria-label="Queue"
          className="mb-6 flex gap-6 overflow-x-auto border-b border-border"
        >
          {queues.map((queue) => {
            const active = status === queue.status;

            return (
              <Link
                key={queue.status}
                href={queueHref(queue.status)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px shrink-0 whitespace-nowrap border-b-2 pb-2.5 text-sm transition-colors",
                  active
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {queue.label}
                {queue.status === "pending" ? (
                  <span className="ml-1.5 tabular-nums text-xs text-muted-foreground">
                    {pendingCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {status === "approved" ? (
          <div className="mb-8 space-y-3">
            <ChipRow aria-label="Type">
              {typeFilters.map((filter) => (
                <FilterChip
                  key={filter.type}
                  href={queueHref("approved", filter.type)}
                  active={type === filter.type}
                  size="sm"
                  tone="subtle"
                >
                  {filter.label}
                </FilterChip>
              ))}
            </ChipRow>
            {incompleteApprovedCount > 0 && type !== "events" ? (
              <p className="text-sm text-muted-foreground">
                {incompleteApprovedCount} creative
                {incompleteApprovedCount === 1 ? "" : "s"} still missing
                directory essentials, shown first.
              </p>
            ) : null}
          </div>
        ) : null}

        {items.length === 0 ? (
          <EmptyState>
            {status === "approved" && type !== "all"
              ? type === "creatives"
                ? "No approved creatives yet."
                : "No approved events yet."
              : emptyCopy[status]}
          </EmptyState>
        ) : (
          <div className="grid gap-4">
            {items.map((item) =>
              item.kind === "event" ? (
                <EventSubmissionCard
                  key={item.event.id}
                  event={item.event}
                  organisers={item.organisers}
                />
              ) : (
                <CreativeSubmissionCard
                  key={item.creative.id}
                  creative={item.creative}
                />
              )
            )}
          </div>
        )}
      </AdminFind>
    </Page>
  );
}
