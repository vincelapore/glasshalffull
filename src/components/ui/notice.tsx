import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const noticeVariants = cva("rounded-lg border px-3 py-2 text-sm", {
  variants: {
    variant: {
      default: "border-border bg-muted/40",
      muted: "border-border bg-muted/40 text-muted-foreground",
      destructive:
        "border-destructive/30 bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Notice({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof noticeVariants>) {
  return (
    <div
      data-slot="notice"
      className={cn(noticeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Notice, noticeVariants }
