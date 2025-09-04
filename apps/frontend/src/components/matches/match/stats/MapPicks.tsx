import { useMatchMaps } from "@/hooks/data/useMatchMaps";
import { useMatchMapVetoes } from "@/hooks/data/useMatchMapVetoes";
import { useMatchInfo } from "@/hooks/data/useMatchInfo";
import {
  createNextUrl,
  mapToReadableName,
  createTeamLogoUrl
} from "@/lib/utils";
import { NextImageFallback } from "@/components/layout/NextImageFallback";

interface MatchMapPicksProps {
  matchId: number;
  handleMapSelect: (mapId?: number) => void;
}

export const MatchMapPicks = ({
  matchId,
  handleMapSelect
}: MatchMapPicksProps) => {
  const { maps } = useMatchMaps(matchId);
  const { vetoes } = useMatchMapVetoes(matchId);
  const { matchInfo } = useMatchInfo(String(matchId));

  // Helper to get team info by id
  const getTeam = (teamId: number) =>
    matchInfo?.teams ? matchInfo.teams[teamId] : undefined;

  // If vetoes exist, show vetoes UI, else fallback to maps
  const showVetoes = vetoes && vetoes.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
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

              <div className="absolute bottom-1 left-1 right-1 text-xs text-white sm:text-sm font-semibold z-10">
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
        {showVetoes ? (
          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-7 gap-3">
            {vetoes.map((veto, index) => {
              const team = getTeam(veto.team_id);
              return (
                <div
                  key={index}
                  className="group relative rounded-xl overflow-hidden flex flex-row md:flex-col items-center min-h-[60px] h-[60px] md:h-auto md:min-h-[140px] bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm shadow-lg px-3 py-2 md:p-3 w-full"
                  style={{
                    backgroundImage: `url(${createNextUrl(`/images/maps/${veto.map_name}.png`)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                  <div className="relative z-10 flex flex-row md:flex-col items-center w-full h-full">
                    {/* Map name and logo */}
                    <div className="flex flex-row md:flex-col items-center md:mb-2 flex-1 min-w-0">
                      <div className="truncate text-xxs sm:text-sm md:text-base text-white font-bold drop-shadow-lg text-center mr-3 ml-2 md:ml-0 md:mr-0 md:mb-2 order-2 md:order-1">
                        {mapToReadableName(veto.map_name)}
                      </div>
                      {team?.logo && (
                        <NextImageFallback
                          src={createTeamLogoUrl(team.logo)}
                          alt={team.name}
                          className="w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12 rounded-lg bg-white/95 backdrop-blur-sm object-contain shadow-md ring-2 ring-white/20 order-1 md:order-2"
                          width={40}
                          height={40}
                        />
                      )}
                    </div>
                    {/* Action label */}
                    <span
                      className={`ml-auto md:ml-0 text-xs sm:text-xs md:text-sm font-black px-1 py-1 rounded-lg backdrop-blur-sm shadow-lg tracking-wider transition-all duration-300
                        ${veto.action === "pick" ? "bg-emerald-600/90 text-emerald-100 ring-2 ring-emerald-400/30" : ""}
                        ${veto.action === "drop" ? "bg-red-600/90 text-red-100 ring-2 ring-red-400/30" : ""}
                        ${veto.action === "decider" ? "bg-blue-600/90 text-blue-100 ring-2 ring-blue-400/30" : ""}
                      `}
                    >
                      {veto.action === "drop"
                        ? "BAN"
                        : veto.action.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-7 gap-3">
            {maps?.map((mapInfo, index) => (
              <div
                key={index}
                className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm shadow-lg p-4 min-h-[140px] flex flex-col items-center justify-center"
                style={{
                  backgroundImage: `url(${createNextUrl(`/images/maps/${mapInfo.map_name}.png`)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                <div className="relative z-10 text-center">
                  <div className="text-sm md:text-base text-white font-bold drop-shadow-lg mb-2">
                    {mapToReadableName(mapInfo.map_name)}
                  </div>
                  <span className="inline-block text-xs sm:text-xs font-black px-2 py-1 rounded-lg bg-emerald-600/90 text-emerald-100 ring-2 ring-emerald-400/30 backdrop-blur-sm shadow-lg tracking-wider">
                    PICK
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
