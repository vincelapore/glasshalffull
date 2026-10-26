"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ExternalImage } from "@/components/media/external-image";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/page";
import { calloutKindLabels } from "@/lib/callouts";
import type { ExampleCallout } from "@/lib/example-callouts";
import { cityShortLabels, roleLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

function interestKey(calloutId: string) {
  return `ghf-callout-draft:${calloutId}`;
}

function readInterest(calloutId: string) {
  try {
    const raw = sessionStorage.getItem(interestKey(calloutId));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function ProfileCallout({
  callout,
  showPoster = false,
}: {
  callout: ExampleCallout;
  showPoster?: boolean;
}) {
  const [interested, setInterested] = useState<string[]>([]);

  useEffect(() => {
    setInterested(readInterest(callout.id));
  }, [callout.id]);

  function toggle(roleId: string) {
    setInterested((current) => {
      const next = current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId];
      sessionStorage.setItem(interestKey(callout.id), JSON.stringify(next));
      return next;
    });
  }

  return (
    <aside className={cn("space-y-4", !showPoster && "border-b border-border pb-8")}>
      {showPoster ? (
        <Poster callout={callout} />
      ) : (
        <div className="flex items-baseline justify-between gap-3">
          <Eyebrow>Callout</Eyebrow>
          <p className="text-sm text-muted-foreground">{callout.daysLeft}</p>
        </div>
      )}

      <p className="text-base leading-relaxed">{callout.body}</p>

      <ul className="divide-y divide-border rounded-xl border border-border">
        {callout.roles.map((slot) => {
          const inRole = interested.includes(slot.id);

          return (
            <li
              key={slot.id}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-3"
            >
              <p className="min-w-0 text-sm">
                <span className="font-medium">{roleLabels[slot.role]}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {calloutKindLabels[slot.kind]}
                </span>
              </p>
              <Button
                type="button"
                size="sm"
                variant={inRole ? "outline" : "default"}
                aria-pressed={inRole}
                className="min-w-28"
                onClick={() => toggle(slot.id)}
              >
                {inRole ? "You’re in" : "I’m interested"}
              </Button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function Poster({ callout }: { callout: ExampleCallout }) {
  const name = (
    <span className="text-sm font-medium tracking-tight">
      {callout.poster.name}
    </span>
  );

  return (
    <div className="flex items-center gap-3">
      <ExternalImage
        src={callout.poster.avatarSrc}
        alt=""
        className="size-10 shrink-0 rounded-full object-cover"
        fallback={
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {callout.poster.name.slice(0, 1)}
          </span>
        }
      />
      <div className="min-w-0">
        {callout.poster.href ? (
          <Link
            href={callout.poster.href}
            prefetch={false}
            className="underline-offset-4 hover:underline"
          >
            {name}
          </Link>
        ) : (
          name
        )}
        <p className="text-sm text-muted-foreground">
          {cityShortLabels[callout.poster.city]} · {callout.daysLeft}
        </p>
      </div>
    </div>
  );
}
