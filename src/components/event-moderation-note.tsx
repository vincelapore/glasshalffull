import { Notice } from "@/components/ui/notice";
import { Eyebrow } from "@/components/ui/page";
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
    <Notice className={cn("py-2.5", className)}>
      <Eyebrow>Review note</Eyebrow>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{text}</p>
    </Notice>
  );
}
