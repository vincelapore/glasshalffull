import { AlertCircle, Check, Circle } from "lucide-react";

import { Notice } from "@/components/ui/notice";
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
  const missing = checklist.filter((item) => !item.done);

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3.5",
        ready
          ? "border-border bg-muted/30"
          : "border-destructive/40 bg-destructive/8",
        className
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p
          className={cn(
            "flex items-center gap-2 text-sm font-medium tracking-tight",
            !ready && "text-destructive"
          )}
        >
          {!ready ? (
            <AlertCircle className="size-4 shrink-0" aria-hidden />
          ) : null}
          {ready
            ? "Directory essentials complete"
            : "Finish these to go public"}
        </p>
        <p
          className={cn(
            "text-xs",
            ready ? "text-muted-foreground" : "font-medium text-destructive"
          )}
        >
          {ready ? "Ready to appear" : `${doneCount} of ${checklist.length} done`}
        </p>
      </div>
      <p
        className={cn(
          "mt-1 text-sm",
          ready ? "text-muted-foreground" : "text-destructive/90"
        )}
      >
        {ready
          ? "You’ll appear in the directory once approved and set to Public."
          : missing.length === 1
            ? `Still needed: ${missing[0].label.toLowerCase()}.`
            : "Your profile stays hidden until bio, profile picture, and a work photo are in place."}
      </p>

      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {checklist.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm",
              item.done
                ? "border-transparent bg-background/60 text-muted-foreground"
                : "border-destructive/35 bg-background font-medium text-destructive"
            )}
          >
            {item.done ? (
              <Check
                className="size-3.5 shrink-0 text-foreground"
                strokeWidth={2.5}
                aria-hidden
              />
            ) : (
              <span
                className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-destructive text-[9px] font-bold leading-none text-white"
                aria-hidden
              >
                !
              </span>
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

/** Page-level callout when directory essentials are missing. */
export function ProfileEssentialsAttention({
  profile,
  className,
}: {
  profile: ProfileVisibilityFields;
  className?: string;
}) {
  if (isProfileReadyForPublic(profile)) return null;

  const missing = getProfileVisibilityChecklist(profile)
    .filter((item) => !item.done)
    .map((item) => item.label.toLowerCase());

  const list =
    missing.length === 1
      ? missing[0]
      : missing.length === 2
        ? `${missing[0]} and ${missing[1]}`
        : `${missing.slice(0, -1).join(", ")}, and ${missing.at(-1)}`;

  return (
    <Notice variant="destructive" className={cn("flex gap-2.5", className)}>
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">Your profile isn’t public yet</p>
        <p className="mt-1 text-destructive/90">
          Add {list} below so people can find you in the directory.
        </p>
      </div>
    </Notice>
  );
}
