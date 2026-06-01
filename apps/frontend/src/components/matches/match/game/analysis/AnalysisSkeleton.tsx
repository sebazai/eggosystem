"use client";

import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {children}
    </section>
  );
}

function CardHeaderSkeleton({ hasRight = false }: { hasRight?: boolean }) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
      <div className="flex flex-col gap-1.5 flex-1">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-52 opacity-60" />
      </div>
      {hasRight && <Skeleton className="h-7 w-24 rounded-lg shrink-0" />}
    </header>
  );
}

/* Skeleton that matches the insights/overview tab layout */
function InsightsTabSkeleton() {
  return (
    <div className="flex flex-col gap-3.5">
      {/* "How the game went" card */}
      <CardSkeleton>
        <CardHeaderSkeleton hasRight />
        <div className="p-4 flex flex-col gap-5">
          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16 opacity-60" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
          {/* Momentum strip */}
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-[45px] w-full rounded" />
            <Skeleton className="h-3 w-full opacity-30" />
          </div>
        </div>
      </CardSkeleton>

      {/* "Scoreboard" card */}
      <CardSkeleton>
        <CardHeaderSkeleton />
        <div className="p-4 flex flex-col gap-2">
          {/* Table header */}
          <div className="flex items-center gap-4 pb-2 border-b border-border/40">
            <Skeleton className="h-3 w-24 opacity-60" />
            <div className="flex gap-4 ml-auto">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-8 opacity-50" />
              ))}
            </div>
          </div>
          {/* Table rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-1.5 border-b border-border/20"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-0.5 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex gap-4 ml-auto">
                {Array.from({ length: 7 }).map((_, j) => (
                  <Skeleton key={j} className="h-3 w-8 opacity-60" />
                ))}
              </div>
              <Skeleton className="h-1.5 w-16 rounded-full opacity-40" />
            </div>
          ))}
        </div>
      </CardSkeleton>

      {/* "Team report card" card */}
      <CardSkeleton>
        <CardHeaderSkeleton hasRight />
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          {/* Two team columns */}
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col} className="flex-1 min-w-0 flex flex-col gap-1.5">
              {/* Team header */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg bg-muted/30">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-12 ml-auto opacity-50" />
              </div>
              {/* Insight tiles */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/40 px-3 py-2.5"
                  style={{ borderLeft: "3px solid var(--border)" }}
                >
                  <div className="flex items-start gap-2">
                    <Skeleton className="h-2.5 w-2 shrink-0 mt-0.5 opacity-60" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Skeleton
                        className="h-3 w-full"
                        style={{ width: `${70 + (i % 3) * 10}%` }}
                      />
                      <div className="flex gap-1">
                        {Array.from({ length: 2 }).map((_, t) => (
                          <Skeleton
                            key={t}
                            className="h-4 w-14 rounded-full opacity-50"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardSkeleton>
    </div>
  );
}

/* Generic skeleton for other tabs — two stacked cards */
function GenericTabSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-3.5">
      {Array.from({ length: cards }).map((_, i) => (
        <CardSkeleton key={i}>
          <CardHeaderSkeleton />
          <div className="p-4 flex flex-col gap-4">
            {/* VS bar row */}
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="grid items-center gap-2.5"
                  style={{ gridTemplateColumns: "auto 1fr auto" }}
                >
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-2.5 w-full rounded-full" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
            {/* Player rows */}
            {i === 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
                {Array.from({ length: 5 }).map((_, k) => (
                  <div key={k} className="flex items-center gap-3">
                    <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-1.5 flex-1 rounded-full ml-auto opacity-50" />
                    <Skeleton className="h-3 w-10 opacity-60" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardSkeleton>
      ))}
    </div>
  );
}

/* ─── Exports ─────────────────────────────────────────────────────── */
export function AnalysisInsightsSkeleton() {
  return <InsightsTabSkeleton />;
}

export function AnalysisGenericSkeleton({ cards }: { cards?: number }) {
  return <GenericTabSkeleton cards={cards} />;
}
