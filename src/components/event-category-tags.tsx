import { Badge } from "@/components/ui/badge";
import type { Event } from "@/db/schema";
import { eventCategoryLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

type EventCategoryTagsProps = {
  event: Pick<Event, "categories">;
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
  const categories = event.categories ?? [];

  if (categories.length === 0) {
    return null;
  }

  if (asText) {
    return (
      <span className={className}>
        {categories.map((category) => eventCategoryLabels[category]).join(" · ")}
      </span>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {categories.map((category) => (
        <Badge key={category} variant={variant} className="text-xs">
          {eventCategoryLabels[category]}
        </Badge>
      ))}
    </div>
  );
}
