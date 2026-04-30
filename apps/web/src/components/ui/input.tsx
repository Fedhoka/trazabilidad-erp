import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Surface — paper card sitting on cream canvas. No fake "inset" shadow.
        "h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 py-1.5 text-sm",
        // Transitions
        "transition-[border-color,box-shadow,background-color] duration-(--duration-fast) ease-(--ease-snap) outline-none",
        // File inputs
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Placeholder — slightly muted, not invisible
        "placeholder:text-muted-foreground/70",
        // Focus — primary-tinted ring with crisp 2-step (border darkens, ring blooms)
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25",
        // Disabled
        "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-60",
        // Invalid
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/60 dark:aria-invalid:ring-destructive/35",
        // Dark mode bg tint
        "dark:bg-input/30",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
