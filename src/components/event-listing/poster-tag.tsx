import { cn } from "@/lib/utils";

const tones = {
  time: "bg-[#f04444]",
  category: "bg-[#8b7cf6]",
} as const;

export function EventPosterTag({
  tone,
  children,
  className,
}: {
  tone: keyof typeof tones;
  children: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-sm px-2 font-mono text-xs leading-none text-white lowercase",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
