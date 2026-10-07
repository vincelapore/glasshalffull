import * as React from "react"

import { cn } from "@/lib/utils"

function Choice({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="choice"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border/70 px-3 py-2.5 transition-colors has-[:checked]:border-foreground/40 has-[:checked]:bg-muted/30",
        className
      )}
      {...props}
    />
  )
}

function ChoiceControl({
  className,
  type = "checkbox",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="choice-control"
      className={cn(
        "mt-0.5 size-4 border-border accent-foreground",
        type === "checkbox" && "rounded",
        className
      )}
      {...props}
    />
  )
}

export { Choice, ChoiceControl }
