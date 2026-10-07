import * as React from "react"

import { cn } from "@/lib/utils"

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("space-y-2", className)}
      {...props}
    />
  )
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  if (!props.children) return null

  return (
    <p
      data-slot="field-error"
      className={cn("text-xs text-destructive", className)}
      {...props}
    />
  )
}

function Fieldset({
  className,
  legend,
  legendClassName,
  children,
  ...props
}: React.ComponentProps<"fieldset"> & {
  legend?: React.ReactNode
  legendClassName?: string
}) {
  return (
    <fieldset
      data-slot="fieldset"
      className={cn("space-y-3", className)}
      {...props}
    >
      {legend ? (
        <legend className={cn("text-sm font-medium", legendClassName)}>
          {legend}
        </legend>
      ) : null}
      {children}
    </fieldset>
  )
}

export { Field, FieldError, Fieldset }
