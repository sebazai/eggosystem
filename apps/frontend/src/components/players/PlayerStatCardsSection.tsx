import { useFilters } from "@/context/FilterContext";
import { usePlayerStats } from "@/hooks/data/filtered/usePlayerStats";

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-kanaliiga-light-brown/10 p-4 rounded-md">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
interface StatCardProps {
  label: string;
  value: string;
}

/** API may return null for derived stats when insufficient data exists. */
function formatFixed(value: number | null | undefined, digits: number): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return value.toFixed(digits);
}

function formatPercent(
  value: number | null | undefined,
  digits: number
): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return `${value.toFixed(digits)}%`;
}

interface PlayerDetailsProps {
  steamId: string;
}

const PlayerStatCardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-card rounded-md overflow-hidden mb-3">
      <h2 className="text-xl font-semibold mb-3">Player Statistics</h2>
      {children}
    </div>
  );
};

export const PlayerStatCardsSection = ({ steamId }: PlayerDetailsProps) => {
  const { filterParams } = useFilters();

  const { playerStats, isLoading, isError } = usePlayerStats({
    steamId,
    ...filterParams
  });

  if (isError) {
    return (
      <PlayerStatCardWrapper>
        <p className="text-muted-foreground">
          There was an error loading the player details. Please try again later
          or adjust your filters.
        </p>
      </PlayerStatCardWrapper>
    );
  }

  if (isLoading) {
    return (
      <PlayerStatCardWrapper>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-kanaliiga-light-brown/10 p-4 rounded-md"
            >
              <div className="h-4 w-16 bg-kanaliiga-light-brown/30 animate-pulse rounded mb-2" />
              <div className="h-6 w-12 bg-kanaliiga-light-brown/30 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </PlayerStatCardWrapper>
    );
  }

  if (!playerStats) {
    return (
      <PlayerStatCardWrapper>
        <p className="text-muted-foreground">No player stats found.</p>
      </PlayerStatCardWrapper>
    );
  }

  return (
    <PlayerStatCardWrapper>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Maps played"
          value={playerStats.maps_played.toString()}
        />
        <StatCard label="Kills" value={playerStats.kills.toString()} />
        <StatCard label="Deaths" value={playerStats.deaths.toString()} />
        <StatCard label="Assists" value={playerStats.assists.toString()} />
        <StatCard label="K/D Ratio" value={formatFixed(playerStats.kd, 2)} />
        <StatCard label="ADR" value={formatFixed(playerStats.adr, 1)} />
        <StatCard
          label="HS%"
          value={formatPercent(playerStats.hs_percent, 1)}
        />
        <StatCard
          label="Rating"
          value={formatFixed(playerStats.kana_rating, 2)}
        />
      </div>
    </PlayerStatCardWrapper>
  );
};
