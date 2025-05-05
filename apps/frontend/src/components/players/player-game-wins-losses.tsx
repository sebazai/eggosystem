import { useFilters } from "@/context/FilterContext";
import { usePlayerGameDetails } from "@/hooks/data/usePlayerGameDetails";

export const PlayerWinsLosses = ({ steamId }: { steamId: string }) => {
  const { filterParams } = useFilters();
  const { playerGameDetails } = usePlayerGameDetails({
    steamId,
    ...filterParams
  });

  const total = playerGameDetails ?? {
    wins: 0,
    matches_played: 0,
    losses: 0,
    draws: 0
  };

  const winPercentage = (total.wins / Math.max(total.matches_played, 1)) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <div className="text-muted-foreground text-sm">W</div>
        <div className="text-lg font-semibold text-green-500">{total.wins}</div>
      </div>
      <div className="text-center">
        <div className="text-muted-foreground text-sm">L</div>
        <div className="text-lg font-semibold text-red-500">{total.losses}</div>
      </div>
      <div className="text-center">
        <div className="text-muted-foreground text-sm">Win%</div>
        <div className="text-lg font-semibold">{winPercentage.toFixed(1)}%</div>
      </div>
    </div>
  );
};
