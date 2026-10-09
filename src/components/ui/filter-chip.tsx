import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const filterChipVariants = cva(
  "inline-flex items-center gap-1 border transition-colors",
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
      size: {
        md: "rounded-lg px-3 py-1.5 text-sm",
        sm: "rounded-full px-2.5 py-0.5 text-sm",
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
      {
        active: false,
        size: "sm",
        class:
          "border-transparent bg-transparent text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
      },
    ],
    defaultVariants: {
      active: false,
      tone: "solid",
      size: "md",
    },
  }
)

function FilterChip({
  className,
  active = false,
  tone = "solid",
  size = "md",
  ...props
}: React.ComponentProps<typeof Link> &
  VariantProps<typeof filterChipVariants>) {
  return (
    <Link
      data-slot="filter-chip"
      data-active={active ? "true" : undefined}
      aria-current={active ? "true" : undefined}
      className={cn(filterChipVariants({ active, tone, size }), className)}
      {...props}
    />
  )
}

export { FilterChip, filterChipVariants }
