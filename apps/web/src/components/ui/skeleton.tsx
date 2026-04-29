import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // Base muted bg + a sweeping gradient overlay for a richer loading feel
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-shimmer_1.6s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.06] before:to-transparent dark:before:via-foreground/[0.04]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
