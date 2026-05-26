import type { MatchMapScore } from "@eggosystem/types";

interface MapScoreChipProps {
  map: MatchMapScore;
  winner: "a" | "b" | "draw";
}

export function MapScoreChip({ map, winner }: MapScoreChipProps) {
  const aWins = winner === "a";
  const bWins = winner === "b";

  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-white/5 bg-black/20 px-2 py-0.5">
      <span className="font-mono text-[10px] text-kanaliiga-light-brown">
        {map.name}
      </span>
      <span className="font-mono text-[10px]">
        <span
          className={
            aWins ? "font-bold text-foreground" : "text-muted-foreground"
          }
        >
          {map.score_a}
        </span>
        <span className="mx-0.5 text-muted-foreground">:</span>
        <span
          className={
            bWins ? "font-bold text-foreground" : "text-muted-foreground"
          }
        >
          {map.score_b}
        </span>
      </span>
    </span>
  );
}
