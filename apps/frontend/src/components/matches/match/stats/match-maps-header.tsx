import { useMatchMaps } from "@/hooks/data/useMatchMaps";
import { cn, mapToReadableName } from "@/lib/utils";
import type { SeasonPlatform } from "@eggosystem/types";
import Link from "next/link";

interface MatchMapsHeaderProps {
  matchId: number;
  gameId?: number;
  platform: SeasonPlatform;
  externalMatchRoomUrl: string | null;
  handleMapSelect: (mapId?: number) => void;
}
export const MatchMapsHeader = ({
  matchId,
  gameId,
  platform,
  externalMatchRoomUrl,
  handleMapSelect
}: MatchMapsHeaderProps) => {
  const { maps } = useMatchMaps(matchId);
  return (
    <>
      <h1 className="mb-2 sm:mb-0">MATCH STATS</h1>
      <div
        className={cn(
          "flex flex-col sm:flex-row",
          externalMatchRoomUrl ? "justify-between gap-5" : "justify-end"
        )}
      >
        {externalMatchRoomUrl && (
          <Link
            target="_blank"
            rel="noopener noreferrer"
            href={externalMatchRoomUrl}
            className="py-1 text-xs text-muted-foreground hover:text-kanaliiga-light-brown transition-colors"
          >
            {platform.charAt(0).toUpperCase() + platform.slice(1)} match room
          </Link>
        )}
        {maps?.length !== 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 ${!gameId ? "bg-foreground text-background" : "text-muted-foreground"} rounded text-xs transition-transform hover:scale-105 hover:text-kanaliiga-orange hover:cursor-pointer`}
              onClick={() => handleMapSelect(undefined)}
            >
              ALL MAPS
            </button>

            {maps?.map((map) => (
              <button
                key={map.id}
                className={`px-3 py-1 ${gameId === map.id ? "bg-foreground text-background" : "text-muted-foreground"} rounded text-xs transition-transform hover:scale-105 hover:text-kanaliiga-orange hover:cursor-pointer`}
                onClick={() => handleMapSelect(map.id)}
              >
                {mapToReadableName(map.map_name)}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
