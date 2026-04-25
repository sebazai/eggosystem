import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Kanaliiga logo — golden chicken crest + orange wordmark.
 *
 * Rules (from brand book):
 *  - Minimum size 40px tall. Below that, switch to `variant="mark"` (the 1-color favicon).
 *  - Clear space: at least the height of the "K" on every side.
 *  - NEVER place on a solid orange field — the wordmark is already orange.
 *  - NEVER rotate, tilt, recolor, add drop shadow, stretch, or animate.
 *  - Use `priority` when this is the LCP element (nav on landing).
 */
export function Logo({
  size = "md",
  variant = "full",
  priority = false,
  className
}: {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "mark";
  priority?: boolean;
  className?: string;
}) {
  const h = size === "sm" ? 40 : size === "md" ? 56 : 80;
  const src =
    variant === "mark"
      ? "/images/kanaliiga/logo-1color-64.png"
      : "/images/kanaliiga/logo-1800.png";

  return (
    <Image
      src={src}
      alt="Kanaliiga"
      height={h}
      width={variant === "mark" ? h : h * 3.5}
      priority={priority}
      className={cn("select-none", className)}
    />
  );
}
