import { useMatchMaps } from "@/hooks/data/useMatchMaps";
import { createNextUrl, mapToReadableName, createTeamLogoUrl } from "@/lib/utils";
import { useMatchVetoes } from "@/hooks/data/useMatchMaps";
import { useMatchInfo } from "@/hooks/data/useMatchInfo";
import { NextImageFallback } from "@/components/layout/image-with-fallback";

interface MatchMapPicksProps {
  matchId: number;
  handleMapSelect: (mapId?: number) => void;
}

export const MatchMapPicks = ({
  matchId,
  handleMapSelect
}: MatchMapPicksProps) => {
  const { maps } = useMatchMaps(matchId);
  const { vetoes } = useMatchVetoes(matchId);
  const { matchInfo } = useMatchInfo(String(matchId));

  // Helper to get team info by id
  const getTeam = (teamId: number | string) =>
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
          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-7 gap-[2px]">
            {vetoes.map((veto, index) => {
              const team = getTeam(veto.team_id);
              const actionLabel =
                veto.action === "pick"
                  ? "PICK"
                  : veto.action === "drop"
                  ? "BAN"
                  : "DECIDER";
              return (
                <div
                  key={index}
                  className="relative rounded overflow-hidden flex flex-row md:flex-col items-center min-h-[48px] h-[48px] md:h-auto md:min-h-[120px] bg-kanaliiga-light-brown/10 px-2 py-1 md:p-3 w-full"
                  style={{
                    backgroundImage: `url(${createNextUrl(`/images/maps/${veto.map_name}.png`)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                >
                  <div className="absolute inset-0 bg-black/60" />
                  <div className="relative z-10 flex flex-row md:flex-col items-center w-full h-full">
                    {/* Left: Logo and map name */}
                    <div className="flex flex-row md:flex-col items-center md:mb-1 flex-1 min-w-0">
                      {team?.logo && (
                        <NextImageFallback
                          src={createTeamLogoUrl(team.logo)}
                          alt={team.name}
                          className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 mr-2 md:mr-0 border border-white bg-white object-contain"
                          width={32}
                          height={32}
                        />
                      )}
                      <div className="truncate text-xs sm:text-sm text-white font-semibold drop-shadow text-center md:mb-1">
                        {mapToReadableName(veto.map_name)}
                      </div>
                    </div>
                    {/* Right: Action label */}
                    <span
                      className={`ml-auto md:ml-0 text-sm sm:text-base font-extrabold px-2 py-0.5 rounded bg-zinc-900 border border-white/80 shadow-md tracking-wide
                        ${veto.action === "pick" ? "text-green-500" : ""}
                        ${veto.action === "drop" ? "text-red-500" : ""}
                        ${veto.action === "decider" ? "text-blue-500" : ""}
                      `}
                    >
                      {actionLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-7 gap-[2px]">
            {maps?.map((mapInfo, index) => (
              <div
                key={index}
                className="relative bg-kanaliiga-light-brown/10 p-3"
              >
                <div className="text-center">
                  <span className={`text-xs mb-1 block text-green-500`}>PICK</span>
                  <div className="text-sm text-muted-foreground">
                    {mapToReadableName(mapInfo.map_name)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
