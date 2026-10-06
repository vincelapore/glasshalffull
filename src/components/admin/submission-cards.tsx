import Link from "next/link";

import { DeleteSubmissionButton } from "@/components/admin/delete-submission-button";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { CreativeCraftTags } from "@/components/creative-craft-tags";
import { CreativeWorkTags } from "@/components/creative-work-tags";
import { EventCategoryTags } from "@/components/event-category-tags";
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
  cityLabels,
  formatDateTime,
  formatInstagramHandle,
  instagramProfileHref,
  lineupRoleLabels,
  statusLabels,
} from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { creativePath, eventPath } from "@/lib/paths";

function StatusBadge({ status }: { status: Creative["status"] | Event["status"] }) {
  const variant =
    status === "approved"
      ? "default"
      : status === "rejected"
        ? "destructive"
        : "secondary";

  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

export function EventSubmissionCard({
  event,
  organisers,
}: {
  event: Event;
  organisers: Creative[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{event.title}</CardTitle>
            <CardDescription>
              {formatDateTime(event.dateTime)} · {cityLabels[event.city]} ·{" "}
              {event.location}
            </CardDescription>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ExternalImage
          src={mediaUrl(event.flyerKey)}
          alt={`${event.title} flyer`}
          className="aspect-video w-full rounded-lg object-cover"
        />
        <div className="space-y-2">
          <EventCategoryTags event={event} />
          {event.description ? (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Organisers
          </p>
          {organisers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No organisers linked.</p>
          ) : (
            <ul className="space-y-2">
              {organisers.map((creative) => (
                <li key={creative.id}>
                  <Link
                    href={creativePath(creative.slug)}
                    className="flex items-center gap-3 rounded-lg border border-border/70 p-2 transition-colors hover:bg-muted/40"
                  >
                    <ExternalImage
                      src={mediaUrl(creative.avatarKey)}
                      alt=""
                      className="size-9 rounded-full object-cover"
                      fallback={
                        <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {creative.name.slice(0, 1).toUpperCase()}
                        </div>
                      }
                    />
                    <div>
                      <p className="text-sm font-medium">{creative.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lineupRoleLabels.organizer}
                        {creative.status !== "approved"
                          ? ` · profile ${statusLabels[creative.status].toLowerCase()}`
                          : null}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Submitted {formatDateTime(event.createdAt)}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={eventPath(event.slug)}
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
              src={mediaUrl(creative.avatarKey)}
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
                <CreativeCraftTags creative={creative} asText />
                {creative.city ? ` · ${cityLabels[creative.city]}` : null}
              </CardDescription>
              <CreativeWorkTags creative={creative} />
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
          {creative.instagramHandle ? (
            <a
              href={instagramProfileHref(creative.instagramHandle)}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              {formatInstagramHandle(creative.instagramHandle)}
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
            href={creativePath(creative.slug)}
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
