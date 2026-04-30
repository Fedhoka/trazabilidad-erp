import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "group/badge inline-flex h-[1.4rem] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden",
    "rounded-full border border-transparent px-2 py-0.5",
    "text-xs font-medium leading-none whitespace-nowrap",
    "transition-colors duration-(--duration-fast) ease-(--ease-snap)",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35",
    "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/85",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",

        // Soft semantic variants — bg tinted, text colored, inset ring.
        success:
          "bg-success/10 text-success ring-1 ring-inset ring-success/25 [a]:hover:bg-success/15 dark:bg-success/20 dark:text-success",
        warning:
          "bg-warning/12 text-warning ring-1 ring-inset ring-warning/30 [a]:hover:bg-warning/20 dark:bg-warning/25 dark:text-warning",
        info:
          "bg-info/10 text-info ring-1 ring-inset ring-info/25 [a]:hover:bg-info/15 dark:bg-info/20 dark:text-info",
        destructive:
          "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/25 focus-visible:ring-destructive/20 [a]:hover:bg-destructive/15 dark:bg-destructive/20 dark:text-destructive dark:focus-visible:ring-destructive/40",

        // Outline — paper card style chip.
        outline:
          "border-border-strong/70 bg-surface text-foreground [a]:hover:bg-muted",

        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/60",

        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
