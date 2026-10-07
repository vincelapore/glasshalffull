import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const pageWidths = {
  wide: "max-w-6xl",
  narrow: "max-w-2xl",
  auth: "max-w-md",
} as const

function Page({
  className,
  width = "wide",
  ...props
}: React.ComponentProps<"div"> & { width?: keyof typeof pageWidths }) {
  return (
    <div
      data-slot="page"
      className={cn(
        "mx-auto w-full px-4 py-12 sm:px-6",
        pageWidths[width],
        className
      )}
      {...props}
    />
  )
}

const eyebrowVariants = cva("font-mono font-medium uppercase", {
  variants: {
    size: {
      sm: "text-xs tracking-wide",
      md: "text-sm tracking-[0.2em]",
      brand: "text-xs tracking-[0.2em]",
    },
    tone: {
      muted: "text-muted-foreground",
      liquid: "text-liquid",
    },
  },
  defaultVariants: {
    size: "sm",
    tone: "muted",
  },
})

function Eyebrow({
  className,
  size = "sm",
  tone = "muted",
  ...props
}: React.ComponentProps<"p"> & VariantProps<typeof eyebrowVariants>) {
  return (
    <p
      data-slot="eyebrow"
      className={cn(eyebrowVariants({ size, tone }), className)}
      {...props}
    />
  )
}

function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-title"
      className={cn(
        "font-heading text-3xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function PageHeader({
  eyebrow,
  eyebrowSize = "sm",
  title,
  description,
  actions,
  className,
  titleClassName,
  descriptionClassName,
  children,
}: React.ComponentProps<"header"> & {
  eyebrow?: React.ReactNode
  eyebrowSize?: VariantProps<typeof eyebrowVariants>["size"]
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  titleClassName?: string
  descriptionClassName?: string
}) {
  const heading = (
    <>
      {eyebrow ? <Eyebrow size={eyebrowSize}>{eyebrow}</Eyebrow> : null}
      <PageTitle className={titleClassName}>{title}</PageTitle>
      {description ? (
        <p className={cn("text-muted-foreground", descriptionClassName)}>
          {description}
        </p>
      ) : null}
    </>
  )

  return (
    <header
      data-slot="page-header"
      className={cn("mb-8 space-y-2", className)}
    >
      {actions ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">{heading}</div>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
      ) : (
        heading
      )}
      {children}
    </header>
  )
}

function Section({
  label,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & { label?: React.ReactNode }) {
  return (
    <section
      data-slot="section"
      className={cn("mb-6 space-y-3", className)}
      {...props}
    >
      {label ? <Eyebrow>{label}</Eyebrow> : null}
      {children}
    </section>
  )
}

function SectionHeader({
  title,
  description,
  action,
  className,
  titleClassName,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  titleClassName?: string
}) {
  return (
    <div
      data-slot="section-header"
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        className
      )}
    >
      <div>
        <h2
          className={cn(
            "text-xl font-semibold tracking-tight",
            titleClassName
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function ChipRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chip-row"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  )
}

function EmptyState({
  className,
  align = "start",
  ...props
}: React.ComponentProps<"p"> & { align?: "start" | "center" }) {
  return (
    <p
      data-slot="empty-state"
      className={cn(
        "rounded-xl border border-dashed border-border px-4 text-muted-foreground",
        align === "center" ? "py-10 text-center" : "py-8 text-sm",
        className
      )}
      {...props}
    />
  )
}

const textLinkVariants = cva("underline-offset-4", {
  variants: {
    variant: {
      quiet:
        "text-sm text-muted-foreground hover:text-foreground hover:underline",
      inline: "underline",
      hover: "hover:underline",
    },
  },
  defaultVariants: {
    variant: "quiet",
  },
})

function TextLink({
  className,
  variant = "quiet",
  ...props
}: React.ComponentProps<typeof Link> & VariantProps<typeof textLinkVariants>) {
  return (
    <Link
      data-slot="text-link"
      className={cn(textLinkVariants({ variant }), className)}
      {...props}
    />
  )
}

export {
  ChipRow,
  EmptyState,
  Eyebrow,
  eyebrowVariants,
  Page,
  PageHeader,
  PageTitle,
  pageWidths,
  Section,
  SectionHeader,
  TextLink,
}
