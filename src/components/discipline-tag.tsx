import {
  Brush,
  Camera,
  Clapperboard,
  Drama,
  Handshake,
  Music,
  PenLine,
  Shirt,
  Shapes,
  SprayCan,
  type LucideIcon,
} from "lucide-react";

import {
  cardIconAriaLabel,
  disciplineTagLabels,
  type CardIcon,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

const cardIconGlyphs: Record<CardIcon, LucideIcon> = {
  music: Music,
  visual_art: Brush,
  photography: Camera,
  fashion: Shirt,
  performance: Drama,
  film: Clapperboard,
  writing: PenLine,
  design: Shapes,
  tattoo: SprayCan,
  community: Handshake,
};

const cardIconLabels: Record<CardIcon, string> = disciplineTagLabels;

export function DisciplineIcon({
  icon,
  className,
  labelled = false,
  size = "inline",
}: {
  icon: CardIcon;
  className?: string;
  /** The visible label already names the icon, so skip the screen-reader copy. */
  labelled?: boolean;
  size?: "inline" | "md";
}) {
  const Icon = cardIconGlyphs[icon];
  const label = cardIconLabels[icon];

  return (
    <span
      title={cardIconAriaLabel(icon)}
      className="inline-flex shrink-0 align-baseline"
    >
      <Icon
        aria-hidden
        className={cn(
          size === "inline" ? "size-[0.85em]" : "size-4",
          className,
        )}
      />
      {labelled ? null : <span className="sr-only">{label}</span>}
    </span>
  );
}

function NameMark({ icon }: { icon: CardIcon }) {
  return (
    <DisciplineIcon
      icon={icon}
      className="relative top-[0.08em] ms-[0.28em]"
    />
  );
}

export function PersonName({
  name,
  icon,
  className,
  truncate = false,
}: {
  name: string;
  icon: CardIcon | null;
  className?: string;
  /** Keep the icon visible when the parent clips a long name. */
  truncate?: boolean;
}) {
  const mark = icon ? <NameMark icon={icon} /> : null;

  if (truncate) {
    return (
      <span
        className={cn(
          "inline-flex max-w-full min-w-0 items-baseline align-middle",
          className,
        )}
      >
        <span className="min-w-0 truncate">{name}</span>
        {mark}
      </span>
    );
  }

  const splitAt = name.lastIndexOf(" ");
  const before = splitAt === -1 ? "" : name.slice(0, splitAt + 1);
  const last = splitAt === -1 ? name : name.slice(splitAt + 1);

  return (
    <span className={className}>
      {before}
      <span className="whitespace-nowrap">
        {last}
        {mark}
      </span>
    </span>
  );
}
