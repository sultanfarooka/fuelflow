import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="field-group"
    className={cn("space-y-4", className)}
    {...props}
  />
))
FieldGroup.displayName = "FieldGroup"

const FieldSet = React.forwardRef<
  HTMLFieldSetElement,
  React.HTMLAttributes<HTMLFieldSetElement>
>(({ className, ...props }, ref) => (
  <fieldset
    ref={ref}
    data-slot="field-set"
    className={cn("space-y-4", className)}
    {...props}
  />
))
FieldSet.displayName = "FieldSet"

const FieldLegend = React.forwardRef<
  HTMLLegendElement,
  React.HTMLAttributes<HTMLLegendElement> & { variant?: "label" | "default" }
>(({ className, variant = "default", ...props }, ref) => (
  <legend
    ref={ref}
    data-slot="field-legend"
    data-variant={variant}
    className={cn(
      "text-sm font-medium leading-none",
      variant === "label" && "mb-2",
      className
    )}
    {...props}
  />
))
FieldLegend.displayName = "FieldLegend"

const fieldVariants = cva("space-y-2", {
  variants: {
    orientation: {
      default: "flex flex-col",
      horizontal:
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4",
      responsive:
        "flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4",
    },
  },
  defaultVariants: {
    orientation: "default",
  },
})

interface FieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof fieldVariants> {
  asChild?: boolean
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, orientation, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
    return (
      <Comp
        ref={ref}
        data-slot="field"
        className={cn(fieldVariants({ orientation }), className)}
        {...props}
      />
    )
  }
)
Field.displayName = "Field"

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    data-slot="field-label"
    className={cn(className)}
    {...props}
  />
))
FieldLabel.displayName = "FieldLabel"

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="field-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
FieldDescription.displayName = "FieldDescription"

interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  errors?: unknown[]
}

function getErrorMessage(err: unknown): string | null {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  return null
}

const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, errors, children, ...props }, ref) => {
    const message =
      errors?.length
        ? getErrorMessage(errors[0])
        : typeof children === 'string'
          ? children
          : null
    if (!message) return null
    return (
      <p
        ref={ref}
        data-slot="field-error"
        role="alert"
        className={cn("text-sm font-medium text-destructive", className)}
        {...props}
      >
        {message}
      </p>
    )
  }
)
FieldError.displayName = "FieldError"

const FieldSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="field-separator"
    className={cn("relative", className)}
    {...props}
  >
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-background px-2 text-muted-foreground">
        {children}
      </span>
    </div>
  </div>
))
FieldSeparator.displayName = "FieldSeparator"

export {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
}
