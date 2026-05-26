import type { MatchMapScore } from "@eggosystem/types";
import { cn } from "@/lib/utils";

interface MapScoreChipProps {
  map: MatchMapScore;
  winner: "home" | "away" | "draw";
  compact?: boolean;
}

export function MapScoreChip({
  map,
  winner,
  compact = false
}: MapScoreChipProps) {
  const homeWins = winner === "home";
  const awayWins = winner === "away";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-white/5 bg-black/20",
        compact ? "gap-1 px-1.5 py-px" : "gap-1.5 px-2 py-0.5"
      )}
    >
      <span
        className={cn(
          "font-mono text-kanaliiga-light-brown",
          compact ? "text-[9px]" : "text-[10px]"
        )}
      >
        {map.name}
      </span>
      <span className={cn("font-mono", compact ? "text-[9px]" : "text-[10px]")}>
        <span
          className={
            homeWins ? "font-bold text-foreground" : "text-muted-foreground"
          }
        >
          {map.home_score}
        </span>
        <span className="mx-0.5 text-muted-foreground">:</span>
        <span
          className={
            awayWins ? "font-bold text-foreground" : "text-muted-foreground"
          }
        >
          {map.away_score}
        </span>
      </span>
    </span>
  );
}
