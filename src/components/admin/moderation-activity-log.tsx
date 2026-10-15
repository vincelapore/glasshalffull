import { EmptyState, SectionHeader } from "@/components/ui/page";
import type { ModerationActivity } from "@/db/schema";
import { formatDateTime } from "@/lib/labels";
import {
  formatModerationActor,
  moderationActionLabel,
  type ModerationAction,
} from "@/lib/moderation-activity";

export function ModerationActivityLog({
  entries,
  viewerEmail,
}: {
  entries: ModerationActivity[];
  viewerEmail?: string | null;
}) {
  return (
    <section className="mt-14 space-y-4">
      <SectionHeader
        title="Activity"
        description="Owner-only log of who submitted, reviewed, edited, or deleted this."
      />
      {entries.length === 0 ? (
        <EmptyState>No activity recorded yet.</EmptyState>
      ) : (
        <ol className="space-y-3 border-t border-border pt-4">
          {entries.map((entry) => {
            const actor = formatModerationActor(entry, viewerEmail);
            const note = entry.metadata?.note?.trim();

            return (
              <li key={entry.id} className="space-y-1 text-sm">
                <p className="text-foreground">
                  {moderationActionLabel(entry.action as ModerationAction)} by{" "}
                  {actor}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(entry.createdAt)}
                </p>
                {note ? (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {note}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
