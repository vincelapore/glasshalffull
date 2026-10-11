import { Check, Circle } from "lucide-react";

import {
  getProfileVisibilityChecklist,
  isProfileReadyForPublic,
  type ProfileVisibilityFields,
} from "@/lib/profile-visibility";
import { cn } from "@/lib/utils";

export function ProfileDirectoryEssentials({
  profile,
  className,
}: {
  profile: ProfileVisibilityFields;
  className?: string;
}) {
  const checklist = getProfileVisibilityChecklist(profile);
  const ready = isProfileReadyForPublic(profile);
  const doneCount = checklist.filter((item) => item.done).length;

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3.5",
        ready
          ? "border-border bg-muted/30"
          : "border-foreground/15 bg-muted/50",
        className
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-medium tracking-tight">
          {ready
            ? "Directory essentials complete"
            : "Directory essentials"}
        </p>
        <p className="text-xs text-muted-foreground">
          {ready ? "Ready to appear" : `${doneCount} of ${checklist.length} done`}
        </p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {ready
          ? "You’ll appear in the directory once approved and set to Public."
          : "Add these before people can find you in the directory."}
      </p>

      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {checklist.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm",
              item.done
                ? "border-transparent bg-background/60 text-muted-foreground"
                : "border-border bg-background font-medium"
            )}
          >
            {item.done ? (
              <Check
                className="size-3.5 shrink-0 text-foreground"
                strokeWidth={2.5}
                aria-hidden
              />
            ) : (
              <Circle
                className="size-3.5 shrink-0 text-muted-foreground"
                strokeWidth={2}
                aria-hidden
              />
            )}
            <span>
              <span className="sr-only">
                {item.done ? "Done: " : "Still needed: "}
              </span>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
