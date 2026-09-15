import { Badge } from "@/components/ui/badge";
import type { Creative } from "@/db/schema";
import { craftCategoryLabels } from "@/lib/labels";

type CreativeCraftTagsProps = {
  creative: Pick<Creative, "craftCategories">;
  className?: string;
  variant?: "outline" | "secondary";
  /** Soften display for compact list rows (e.g. muted text instead of badges). */
  asText?: boolean;
};

export function CreativeCraftTags({
  creative,
  className,
  variant = "outline",
  asText = false,
}: CreativeCraftTagsProps) {
  const categories = creative.craftCategories ?? [];

  if (categories.length === 0) {
    return null;
  }

  if (asText) {
    return (
      <span className={className}>
        {categories.map((category) => craftCategoryLabels[category]).join(" · ")}
      </span>
    );
  }

  return (
    <div className={className ?? "flex flex-wrap gap-1.5"}>
      {categories.map((category) => (
        <Badge key={category} variant={variant} className="text-xs">
          {craftCategoryLabels[category]}
        </Badge>
      ))}
    </div>
  );
}
