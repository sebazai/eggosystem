"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface HomeAwaySidesLayoutProps {
  /** Left column (home) in LTR; first when stacked on small viewports */
  home: ReactNode;
  /** Right column (away) in LTR; second when stacked */
  away: ReactNode;
  /** Optional full-width block below the two columns (for example a comparison strip) */
  fullWidthFooter?: ReactNode;
  className?: string;
  /** Override styles for the two-column grid (columns, gaps) */
  gridClassName?: string;
}

/** Standard responsive grid: stacked on narrow screens; home left, away right from `md` up. */
export function HomeAwaySidesLayout({
  home,
  away,
  fullWidthFooter,
  className,
  gridClassName
}: HomeAwaySidesLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div
        className={cn(
          "grid grid-cols-1 gap-y-8 md:grid-cols-2 md:gap-6 lg:gap-8",
          gridClassName
        )}
        role="group"
        aria-label="Home and away team sides"
      >
        <section className="min-w-0" aria-label="Home team side">
          {home}
        </section>
        <section className="min-w-0" aria-label="Away team side">
          {away}
        </section>
      </div>
      {fullWidthFooter != null ? fullWidthFooter : null}
    </div>
  );
}
