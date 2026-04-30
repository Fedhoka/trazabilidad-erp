import * as React from "react"

import { cn } from "@/lib/utils"

type CardProps = React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  /** Adds hover lift + cursor-pointer affordance for clickable cards. */
  interactive?: boolean
}

function Card({
  className,
  size = "default",
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        // Surface — paper-on-cream contrast comes from a real border, not a fake shadow.
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl border border-border-strong/70 bg-card text-card-foreground",
        "shadow-soft",
        "py-5 text-sm",
        "has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0",
        "data-[size=sm]:gap-3 data-[size=sm]:py-3.5",
        "*:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        // Interactive cards lift on hover with the snap easing token.
        interactive && [
          "cursor-pointer",
          "transition-[transform,box-shadow,border-color] duration-(--duration-base) ease-(--ease-snap)",
          "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevated",
          "active:translate-y-0 active:duration-75",
        ],
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-xl px-5 group-data-[size=sm]/card:px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      // Fraunces for cards above sm. Normal weight (500) reads more editorial than semibold.
      className={cn(
        "font-heading text-[1.0625rem] font-medium leading-snug tracking-tight text-foreground group-data-[size=sm]/card:font-sans group-data-[size=sm]/card:text-sm group-data-[size=sm]/card:font-semibold",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-5 group-data-[size=sm]/card:px-4", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-2 rounded-b-xl border-t border-border bg-surface-2/40 px-5 py-3 group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:py-2.5",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
