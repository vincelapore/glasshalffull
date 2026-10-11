import { Badge } from "@/components/ui/badge";
import type { Creative } from "@/db/schema";
import { disciplineLabels, roleLabels } from "@/lib/labels";

type CreativeCraftTagsProps = {
  creative: Pick<
    Creative,
    "disciplines" | "roles" | "specialty" | "isQueer"
  >;
  className?: string;
  variant?: "outline" | "secondary";
  /** Soften display for compact list rows (e.g. muted text instead of badges). */
  asText?: boolean;
};

function tagLabels(
  creative: Pick<Creative, "disciplines" | "roles" | "specialty" | "isQueer">
) {
  const labels: string[] = [];

  for (const discipline of creative.disciplines ?? []) {
    labels.push(disciplineLabels[discipline]);
  }
  for (const role of creative.roles ?? []) {
    labels.push(roleLabels[role]);
  }
  if (creative.specialty?.trim()) {
    labels.push(creative.specialty.trim());
  }
  if (creative.isQueer) {
    labels.push("Queer");
  }

  return labels;
}

export function CreativeCraftTags({
  creative,
  className,
  variant = "outline",
  asText = false,
}: CreativeCraftTagsProps) {
  const labels = tagLabels(creative);

  if (labels.length === 0) {
    return null;
  }

  if (asText) {
    return <span className={className}>{labels.join(" · ")}</span>;
  }

  return (
    <div className={className ?? "flex flex-wrap gap-1.5"}>
      {labels.map((label, index) => (
        <Badge key={`${label}-${index}`} variant={variant} className="text-xs">
          {label}
        </Badge>
      ))}
    </div>
  );
}
