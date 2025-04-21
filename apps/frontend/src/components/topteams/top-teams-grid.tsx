import Image from "next/image";
import Link from "next/link";
import { ContentContainer } from "../layout/content-container";
import { createNextImageUrl, type FilterParamsQuery } from "@/lib/utils";
import { useTopTeams } from "@/hooks/data/useTopTeams";
import { useSearchParams } from "next/navigation";

const getLeagueEmoji = (leagueSortPriority: number): string => {
  switch (leagueSortPriority) {
    case 1:
      return "👑";
    case 2:
      return "🏆";
    case 3:
      return "⭐";
    default:
      return "🎮";
  }
};

const getStageType = (stage: number): string => {
  switch (stage) {
    case 1:
      return "Regular";
    case 2:
      return "Playoffs";
    default:
      return "Regular";
  }
};

interface TopTeamsGridProps {
  filterQueryParams: FilterParamsQuery;
}

export const TopTeamsGrid = ({ filterQueryParams }: TopTeamsGridProps) => {
  const { isError, isLoading, isValidating, divisions } =
    useTopTeams(filterQueryParams);
  const searchParams = useSearchParams();

  if (isError) {
    return (
      <ContentContainer>
        {isError?.message ?? "Error loading top teams"}
      </ContentContainer>
    );
  }
  if (isLoading || isValidating) {
    return <ContentContainer>Loading...</ContentContainer>;
  }
  if (!divisions) {
    return <ContentContainer>No top teams found</ContentContainer>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {divisions.map((division, index) => (
        <div key={index} className="bg-card rounded-sm overflow-hidden">
          <div className="bg-[#2a1810] p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {getLeagueEmoji(division.league_sort_priority)}
              </span>
              <div>
                <h2 className="text-kanaliiga-orange text-xl font-bold">
                  {`${division.league_name}, ${getStageType(division.stage)}`}
                </h2>
              </div>
            </div>
          </div>

          <div className="p-4">
            {division.teams.map((team, teamIndex) => (
              <Link
                key={teamIndex}
                href={{
                  pathname: `/teams/${team.team_id}`,
                  query: searchParams.toString()
                }}
                className={`flex items-center justify-between py-3 px-2 ${
                  teamIndex < 3 ? "bg-[#1e1e1e] rounded-sm mb-1" : ""
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className={
                      "flex-shrink-0 w-6 text-center text-muted-foreground"
                    }
                  >
                    {teamIndex === 0
                      ? "👑"
                      : teamIndex === 1
                        ? "🥈"
                        : teamIndex === 2
                          ? "🥉"
                          : `#${team.rank}`}
                  </span>

                  <div className="flex items-center gap-2 min-w-0">
                    {team.team_logo && (
                      <Image
                        src={createNextImageUrl(team.team_logo)}
                        alt={`${team.team_name} logo`}
                        width={20}
                        height={20}
                        className="rounded-full flex-shrink-0"
                      />
                    )}
                    <div className="truncate">
                      <span
                        className={`${
                          teamIndex < 3
                            ? "font-bold text-white"
                            : "text-muted-foreground"
                        }`}
                      >
                        {team.team_name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-muted-foreground text-sm hidden sm:inline">
                    {team.matches_played} matches
                  </span>
                  <span
                    className={`w-16 text-right ${
                      teamIndex < 3
                        ? "font-bold text-white"
                        : "text-muted-foreground"
                    }`}
                  >
                    {team.kana.toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
