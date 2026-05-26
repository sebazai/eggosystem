"use client";

import type { MatchesByFilters } from "@eggosystem/types";
import {
  leagueNameToTierKey,
  TIERS,
  tierCssColor,
  type TierKey
} from "@/lib/matches/tiers";

const TIER_ORDER: TierKey[] = ["premier", "elite", "challenge", "open"];

interface SummaryStripProps {
  matches: MatchesByFilters[];
}

export function SummaryStrip({ matches }: SummaryStripProps) {
  const tierCounts = matches.reduce(
    (acc, m) => {
      const key = leagueNameToTierKey(m.league_name);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<TierKey, number>>
  );

  const presentTiers = TIER_ORDER.filter((k) => tierCounts[k]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Showing{" "}
        <span className="font-bold text-foreground">{matches.length}</span>{" "}
        {matches.length === 1 ? "match" : "matches"}
      </span>

      {presentTiers.length > 0 && (
        <span className="h-4 w-px self-stretch bg-white/10" />
      )}

      <div className="flex flex-wrap gap-3">
        {presentTiers.map((key) => (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 font-mono text-[10px]"
          >
            <span
              className="size-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: tierCssColor(key) }}
            />
            <span className="text-muted-foreground">{TIERS[key].label}</span>
            <span className="font-bold text-foreground">{tierCounts[key]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
