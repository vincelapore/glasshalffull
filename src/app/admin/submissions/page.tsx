import type { Metadata } from "next";
import Link from "next/link";

import { AdminFind } from "@/components/admin/admin-find";
import { ModerationNewMenu } from "@/components/admin/moderation-new-menu";
import {
  CreativeSubmissionCard,
  EventSubmissionCard,
} from "@/components/admin/submission-cards";
import { EmptyState, Page, PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/admin";
import { countPendingSubmissions, getSubmissions } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { submissionStatuses } from "@/lib/validations";

export const metadata: Metadata = {
  title: "Moderation",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  status?: string;
}>;

const queues = [
  { status: "pending", label: "Needs review" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
] as const;

type QueueStatus = (typeof queues)[number]["status"];

function isQueueStatus(value: string | undefined): value is QueueStatus {
  return !!value && queues.some((queue) => queue.status === value);
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

  const [{ events, creatives }, pendingCount] = await Promise.all([
    getSubmissions({
      status: status as (typeof submissionStatuses)[number],
      type: "all",
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
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
          className="mb-8 flex gap-6 overflow-x-auto border-b border-border"
        >
          {queues.map((queue) => {
            const active = status === queue.status;

            return (
              <Link
                key={queue.status}
                href={
                  queue.status === "pending"
                    ? "/admin/submissions"
                    : `/admin/submissions?status=${queue.status}`
                }
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

        {items.length === 0 ? (
          <EmptyState>{emptyCopy[status]}</EmptyState>
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
