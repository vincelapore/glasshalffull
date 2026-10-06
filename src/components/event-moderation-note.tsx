import { cn } from "@/lib/utils";

export function EventModerationNote({
  note,
  className,
}: {
  note?: string | null;
  className?: string;
}) {
  const text = note?.trim();
  if (!text) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/40 px-3 py-2.5",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Review note
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{text}</p>
    </div>
  );
}
