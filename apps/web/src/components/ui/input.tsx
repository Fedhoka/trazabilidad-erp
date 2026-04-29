import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Surface
        "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-1.5 text-sm",
        // Subtle inner shadow for tactile depth on light bgs
        "shadow-[inset_0_1px_0_0_oklch(0_0_0_/_0.02)] dark:shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.04)]",
        // Transitions
        "transition-[border-color,box-shadow,background-color] duration-150 outline-none",
        // File inputs
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Placeholder
        "placeholder:text-muted-foreground/70",
        // Focus ring — primary tinted, slightly thicker than the legacy ring
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
        // Disabled
        "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-60",
        // Invalid
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/60 dark:aria-invalid:ring-destructive/40",
        // Dark mode tweaks
        "dark:bg-input/30",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
