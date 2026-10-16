import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Compact selectable chip for short option sets (city, email mode, etc.). */
export function OptionPill({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active
          ? "border-foreground/40 bg-foreground text-background"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}
