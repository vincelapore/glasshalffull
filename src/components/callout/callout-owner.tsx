"use client";

import { useState } from "react";
import Link from "next/link";

import { ExternalImage } from "@/components/media/external-image";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { TextLink } from "@/components/ui/page";
import { calloutKindLabels } from "@/lib/callouts";
import type {
  ExampleCallout,
  ExampleCalloutInterest,
} from "@/lib/example-callouts";
import { cityShortLabels, roleLabels } from "@/lib/labels";

export function CalloutOwner({
  callout,
  interests,
}: {
  callout: ExampleCallout;
  interests: ExampleCalloutInterest[];
}) {
  const [closed, setClosed] = useState(false);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {closed ? "Closed · off your page" : callout.daysLeft}
          </p>
        </div>
        {closed ? null : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setClosed(true)}
          >
            Close callout
          </Button>
        )}
      </div>

      <p className="text-base leading-relaxed">{callout.body}</p>

      {closed ? (
        <Notice>
          It’s off your public page. People who already raised a hand stay
          here until you post the next one.
        </Notice>
      ) : null}

      <div className="space-y-8">
        {callout.roles.map((slot) => {
          const people = interests.filter(
            (interest) => interest.roleId === slot.id,
          );

          return (
            <div key={slot.id} className="space-y-2">
              <h3 className="text-sm">
                <span className="font-medium">{roleLabels[slot.role]}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {calloutKindLabels[slot.kind]}
                </span>
              </h3>
              {people.length === 0 ? (
                <p className="text-sm text-muted-foreground">No one yet.</p>
              ) : (
                <ul className="divide-y divide-border border-y border-border">
                  {people.map((person) => (
                    <li key={person.id}>
                      <InterestRow person={person} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function InterestRow({ person }: { person: ExampleCalloutInterest }) {
  const detail = [
    person.roles.map((role) => roleLabels[role]).join(", "),
    cityShortLabels[person.city],
  ].join(" · ");

  return (
    <div className="flex items-center gap-3 py-3">
      <ExternalImage
        src={person.avatarSrc}
        alt=""
        className="size-10 shrink-0 rounded-full object-cover"
        fallback={
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {person.name.slice(0, 1)}
          </span>
        }
      />
      <div className="min-w-0 flex-1">
        <Link
          href={person.profileHref}
          prefetch={false}
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          {person.name}
        </Link>
        <p className="truncate text-sm text-muted-foreground">{detail}</p>
      </div>
      <TextLink
        href={person.profileHref}
        variant="hover"
        prefetch={false}
        className="shrink-0 text-sm"
      >
        View profile
      </TextLink>
    </div>
  );
}
