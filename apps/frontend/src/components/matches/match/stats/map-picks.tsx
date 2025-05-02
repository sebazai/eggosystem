import { useMatchMaps } from "@/hooks/data/useMatchMaps";

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
                className={`flex items-center mb-[2px] bg-card cursor-pointer hover:bg-accent/50 ${
                  gameId === map.id ? "bg-kanaliiga-orange/10" : ""
                }`}
                onClick={() => handleMapSelect(map.id ?? undefined)}
              >
                <div className="w-32 p-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    {map.map_name}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3">
                  <span className="text-muted-foreground text-lg">
                    {map.team1_score}
                  </span>
                  <span className="text-muted-foreground text-lg">-</span>
                  <span className="text-muted-foreground text-lg">
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
                <div className="flex justify-between mb-2">
                  <span
                    className={`text-sm ${mapInfo.team1_score > mapInfo.team2_score ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {mapInfo.team1_score}
                  </span>
                  <span
                    className={`text-sm ${mapInfo.team2_score > mapInfo.team1_score ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {mapInfo.team2_score}
                  </span>
                </div>

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
                    {mapInfo.map_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-2 mb-2 flex flex-col sm:flex-row justify-between items-center bg-card">
        <h1 className="text-xl mb-2 sm:mb-0">MATCH STATS</h1>
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
              {map.map_name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
