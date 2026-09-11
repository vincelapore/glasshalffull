import { Badge } from "@/components/ui/badge";
import type { Creative } from "@/db/schema";
import {
  getCreativeWorkTags,
  workOpportunityTagLabels,
} from "@/lib/labels";

type CreativeWorkTagsProps = {
  creative: Pick<
    Creative,
    "openToPaidWork" | "openToTrade" | "buildingPortfolio"
  >;
  className?: string;
};

export function CreativeWorkTags({ creative, className }: CreativeWorkTagsProps) {
  const tags = getCreativeWorkTags(creative);

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={className ?? "flex flex-wrap gap-1.5"}>
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs">
          {workOpportunityTagLabels[tag]}
        </Badge>
      ))}
    </div>
  );
}
