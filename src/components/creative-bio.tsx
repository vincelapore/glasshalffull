"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const COLLAPSE_AT = 220;

export function CreativeBio({
  bio,
  className,
}: {
  bio: string;
  className?: string;
}) {
  const long = bio.trim().length > COLLAPSE_AT;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("max-w-2xl space-y-2", className)}>
      <p
        className={cn(
          "whitespace-pre-wrap text-base leading-relaxed",
          long && !expanded && "line-clamp-3"
        )}
      >
        {bio}
      </p>
      {long ? (
        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
