import Link from "next/link";

import { DeleteSubmissionButton } from "@/components/admin/delete-submission-button";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { ExternalImage } from "@/components/media/external-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Creative, Event } from "@/db/schema";
import {
  craftCategoryLabels,
  eventCategoryLabels,
  formatDateTime,
  statusLabels,
} from "@/lib/labels";

function StatusBadge({ status }: { status: Creative["status"] | Event["status"] }) {
  const variant =
    status === "approved"
      ? "default"
      : status === "rejected"
        ? "destructive"
        : "secondary";

  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

export function EventSubmissionCard({ event }: { event: Event }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{event.title}</CardTitle>
            <CardDescription>
              {formatDateTime(event.dateTime)} · {event.location}
            </CardDescription>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ExternalImage
          src={event.flyerUrl}
          alt={`${event.title} flyer`}
          className="aspect-video w-full rounded-lg object-cover"
        />
        <p className="text-sm text-muted-foreground">
          {eventCategoryLabels[event.category]}
          {event.description ? ` — ${event.description}` : null}
        </p>
        <p className="text-xs text-muted-foreground">
          Submitted {formatDateTime(event.createdAt)}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/events/${event.id}`}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Open public page
          </Link>
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/admin/events/${event.id}/edit`} />}
          >
            Edit
          </Button>
          <DeleteSubmissionButton
            kind="event"
            id={event.id}
            label={event.title}
          />
        </div>
        <ModerationActions kind="event" id={event.id} status={event.status} />
      </CardFooter>
    </Card>
  );
}

export function CreativeSubmissionCard({ creative }: { creative: Creative }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ExternalImage
              src={creative.avatarUrl}
              alt={creative.name}
              className="size-12 rounded-full object-cover"
              fallback={
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {creative.name.slice(0, 1).toUpperCase()}
                </div>
              }
            />
            <div className="space-y-1">
              <CardTitle>{creative.name}</CardTitle>
              <CardDescription>
                {craftCategoryLabels[creative.craftCategory]}
              </CardDescription>
            </div>
          </div>
          <StatusBadge status={creative.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {creative.bio ? (
          <p className="text-sm text-muted-foreground">{creative.bio}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No bio provided.</p>
        )}
        <div className="flex flex-wrap gap-3 text-sm">
          {creative.instagramUrl ? (
            <a
              href={creative.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Instagram
            </a>
          ) : null}
          {creative.portfolioUrl ? (
            <a
              href={creative.portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Portfolio
            </a>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Submitted {formatDateTime(creative.createdAt)}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/creatives/${creative.id}`}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Open public page
          </Link>
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/admin/creatives/${creative.id}/edit`} />}
          >
            Edit
          </Button>
          <DeleteSubmissionButton
            kind="creative"
            id={creative.id}
            label={creative.name}
          />
        </div>
        <ModerationActions
          kind="creative"
          id={creative.id}
          status={creative.status}
        />
      </CardFooter>
    </Card>
  );
}
