import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-[1.4rem] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium leading-none whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/85",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",

        // ── Soft semantic variants (bg tinted, text colored) ───────────────
        success:
          "bg-success/12 text-success ring-1 ring-inset ring-success/20 [a]:hover:bg-success/20 dark:bg-success/20 dark:text-success",
        warning:
          "bg-warning/15 text-warning-foreground ring-1 ring-inset ring-warning/30 [a]:hover:bg-warning/25 dark:bg-warning/25 dark:text-warning",
        info: "bg-info/12 text-info ring-1 ring-inset ring-info/20 [a]:hover:bg-info/20 dark:bg-info/20 dark:text-info",
        destructive:
          "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:text-destructive dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",

        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
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
