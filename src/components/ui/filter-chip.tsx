import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const filterChipVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors",
  {
    variants: {
      active: {
        true: "",
        false: "border-border text-muted-foreground hover:text-foreground",
      },
      tone: {
        solid: "",
        subtle: "",
      },
    },
    compoundVariants: [
      {
        active: true,
        tone: "solid",
        class: "border-foreground bg-foreground text-background",
      },
      {
        active: true,
        tone: "subtle",
        class: "border-foreground/40 bg-muted text-foreground",
      },
    ],
    defaultVariants: {
      active: false,
      tone: "solid",
    },
  }
)

function FilterChip({
  className,
  active = false,
  tone = "solid",
  ...props
}: React.ComponentProps<typeof Link> &
  VariantProps<typeof filterChipVariants>) {
  return (
    <Link
      data-slot="filter-chip"
      data-active={active ? "true" : undefined}
      aria-current={active ? "true" : undefined}
      className={cn(filterChipVariants({ active, tone }), className)}
      {...props}
    />
  )
}

export { FilterChip, filterChipVariants }
