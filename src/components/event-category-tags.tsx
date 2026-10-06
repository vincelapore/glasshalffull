import { Badge } from "@/components/ui/badge";
import type { Event } from "@/db/schema";
import { eventDisplayTags } from "@/lib/labels";
import { cn } from "@/lib/utils";

type EventCategoryTagsProps = {
  event: Pick<Event, "categories" | "musicGenres">;
  className?: string;
  asText?: boolean;
  variant?: "outline" | "secondary" | "default";
};

export function EventCategoryTags({
  event,
  className,
  asText = false,
  variant = "outline",
}: EventCategoryTagsProps) {
  const tags = eventDisplayTags(event);

  if (tags.length === 0) {
    return null;
  }

  if (asText) {
    return <span className={className}>{tags.join(" · ")}</span>;
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <Badge key={tag} variant={variant} className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  );
}
