import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base — typography, layout, focus, motion. All transitions go through
  // the named --ease-snap and --duration-fast tokens for consistency.
  [
    "group/button relative inline-flex shrink-0 items-center justify-center rounded-md border border-transparent text-sm font-medium whitespace-nowrap select-none outline-none",
    "transition-[background-color,box-shadow,transform,color,border-color] duration-(--duration-fast) ease-(--ease-snap)",
    "focus-visible:ring-3 focus-visible:ring-ring/35",
    "active:not-aria-[haspopup]:translate-y-px active:not-aria-[haspopup]:duration-75",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        // Brand button — terracotta, soft elevation, gentle hover lift.
        default:
          "bg-primary text-primary-foreground shadow-soft hover:-translate-y-px hover:bg-primary/95 hover:shadow-elevated focus-visible:ring-primary/30 dark:hover:bg-primary/90",

        // Outline — paper card style. Border carries the weight, no fill.
        outline:
          "border-border-strong bg-surface text-foreground hover:bg-muted hover:border-border-strong/80 aria-expanded:bg-muted",

        // Secondary — sand-tinted, used for low-emphasis actions.
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary",

        // Ghost — no chrome until hover.
        ghost:
          "text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted dark:hover:bg-muted/60",

        // Destructive solid — for confirm-style irreversible actions.
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:-translate-y-px hover:bg-destructive/95 hover:shadow-elevated focus-visible:ring-destructive/30",

        // Destructive soft — tinted bg + colored text. For inline secondary destructives.
        "destructive-soft":
          "bg-destructive/10 text-destructive hover:bg-destructive/15 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/25",

        // Semantic helpers — kept distinct from brand.
        success:
          "bg-success text-success-foreground shadow-soft hover:-translate-y-px hover:bg-success/95 hover:shadow-elevated focus-visible:ring-success/30",
        warning:
          "bg-warning text-warning-foreground shadow-soft hover:-translate-y-px hover:bg-warning/95 hover:shadow-elevated focus-visible:ring-warning/30",

        // Link — text-only, primary-tinted underline on hover.
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-0",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-7 gap-1 rounded-sm px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-md px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-5 text-[0.9rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-[1.05rem]",
        icon: "size-9",
        "icon-xs": "size-7 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
