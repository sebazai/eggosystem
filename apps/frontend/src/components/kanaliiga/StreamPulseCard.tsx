import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type React from "react";

/**
 * Live-stream card — only applies the pulse animation + Twitch gradient when `isLive`.
 * Abusing the pulse animation on non-live cards is a brand violation.
 */
export function StreamPulseCard({
  isLive,
  children,
  className,
  ...cardProps
}: React.ComponentProps<typeof Card> & {
  isLive: boolean;
}) {
  return (
    <Card
      className={cn(
        "stream-match overflow-hidden",
        isLive &&
          "animate-stream-pulse bg-gradient-to-br from-purple-600/10 via-orange-600/10 to-red-600/10",
        className
      )}
      {...cardProps}
    >
      {children}
    </Card>
  );
}
