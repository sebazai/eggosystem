import { useMatchMaps } from "@/hooks/data/useMatchMaps";
import { createNextUrl, mapToReadableName } from "@/lib/utils";

interface MatchMapPicksProps {
  matchId: number;
  gameId?: number;
  handleMapSelect: (mapId?: number) => void;
}

export const MatchMapPicks = ({
  matchId,
  gameId,
  handleMapSelect
}: MatchMapPicksProps) => {
  const { maps } = useMatchMaps(matchId);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 mb-4">
        {/* Picked Maps Scores */}
        <div className="w-full">
          {maps?.map((map, index) => {
            return (
              <div
                key={index}
                className="relative flex flex-1 min-h-10 items-center cursor-pointer overflow-hidden rounded my-1 border-1 border-transparent hover:border-1 hover:border-kanaliiga-orange"
                onClick={() => handleMapSelect(map.id ?? undefined)}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${createNextUrl(`/images/maps/${map.map_name}.png`)})`,
                    filter: "brightness(0.6)"
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-l from-white/60 via-white/30 dark:from-black/60 dark:via-black/30 to-transparent" />

                <div className="absolute bottom-1 left-1 right-1 text-xs sm:text-sm font-semibold z-10">
                  {mapToReadableName(map.map_name)}
                </div>

                <div className="flex items-center gap-1 p-3 z-10 w-full justify-end">
                  <span className="text-lg w-6 font-black text-center">
                    {map.team1_score}
                  </span>
                  <span className="text-md">-</span>
                  <span className="text-lg w-6 font-black text-center">
                    {map.team2_score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map Pick/Ban Phase */}
        <div className="w-full">
          <h2 className="text-lg font-bold mb-3">MAP PICKS & BANS</h2>
          <div className="grid grid-cols-2 xl:grid-cols-7 gap-[2px]">
            {maps?.map((mapInfo, index) => (
              <div key={index} className="relative bg-card p-3">
                <div className="text-center">
                  <span
                    className={`text-xs mb-1 block text-green-500`}
                    // ${mapInfo.type === "PICK" ? "text-green-500" : ""}
                    // ${mapInfo.type === "BAN" ? "text-red-500" : ""}
                    // ${mapInfo.type === "DECIDER" ? "text-[#4d79ff]" : ""}
                  >
                    PICK
                  </span>
                  <div className="text-sm text-muted-foreground">
                    {mapToReadableName(mapInfo.map_name)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-2 mb-2 flex flex-col sm:flex-row justify-between items-center bg-card">
        <h1 className="mb-2 sm:mb-0">MATCH STATS</h1>
        <div className="flex flex-wrap gap-2 justify-center">
          {maps?.length !== 1 && (
            <button
              className={`px-3 py-1 ${!gameId ? "bg-foreground text-background" : "text-muted-foreground"} rounded text-xs transition-transform hover:scale-105 hover:text-kanaliiga-orange hover:cursor-pointer`}
              onClick={() => handleMapSelect(undefined)}
            >
              ALL MAPS
            </button>
          )}
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
      </div>
    </>
  );
};
