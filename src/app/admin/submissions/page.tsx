import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAdminAction } from "@/app/actions/admin-auth";
import {
  CreativeSubmissionCard,
  EventSubmissionCard,
} from "@/components/admin/submission-cards";
import { Button } from "@/components/ui/button";
import { isAdminAuthenticated } from "@/lib/admin";
import { getSubmissions } from "@/lib/queries";
import { submissionStatuses } from "@/lib/validations";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Submissions",
};

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
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const status = isStatusFilter(params.status) ? params.status : "pending";
  const type = isTypeFilter(params.type) ? params.type : "all";

  const { events, creatives } = await getSubmissions({
    status: status === "all" ? "all" : (status as (typeof submissionStatuses)[number]),
    type,
  });

  const total = events.length + creatives.length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Submissions</h1>
          <p className="text-muted-foreground">
            Review, edit, approve, reject, or delete community submissions.
          </p>
        </div>
        <form action={logoutAdminAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>

      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => {
            const href = `/admin/submissions?status=${filter}&type=${type}`;
            const active = status === filter;
            return (
              <Link
                key={filter}
                href={href}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {filter}
              </Link>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {typeFilters.map((filter) => {
            const href = `/admin/submissions?status=${status}&type=${filter}`;
            const active = type === filter;
            return (
              <Link
                key={filter}
                href={href}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors",
                  active
                    ? "border-foreground/40 bg-muted text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {filter}
              </Link>
            );
          })}
        </div>
      </div>

      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
          No {status === "all" ? "" : `${status} `}submissions
          {type === "all" ? "" : ` in ${type}`} yet.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {type !== "creatives"
            ? events.map((event) => (
                <EventSubmissionCard key={event.id} event={event} />
              ))
            : null}
          {type !== "events"
            ? creatives.map((creative) => (
                <CreativeSubmissionCard key={creative.id} creative={creative} />
              ))
            : null}
        </div>
      )}
    </div>
  );
}
