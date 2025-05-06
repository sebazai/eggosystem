import Link from "next/link";
import { ContentContainer } from "../layout/content-container";
import { createTeamLogoUrl, type FilterParamsQuery } from "@/lib/utils";
import { useRecentMatches } from "@/hooks/data/filtered/useRecentMatches";
import { NextImageFallback } from "../layout/image-with-fallback";

interface FilteredMatchesListProps {
  filterQueryParams: FilterParamsQuery;
}

export const FilteredMatchesList = ({
  filterQueryParams
}: FilteredMatchesListProps) => {
  const { matches, isError, isLoading, isValidating } =
    useRecentMatches(filterQueryParams);

  if (isError) {
    return <ContentContainer>Error loading Matches</ContentContainer>;
  }

  if (isLoading || isValidating) {
    return <ContentContainer>Loading...</ContentContainer>;
  }
  if (!matches) {
    return <ContentContainer>No matches found</ContentContainer>;
  }
  const groupedMatches = matches.reduce(
    (acc, match) => {
      const matchDate = match.match_date;
      if (!acc[matchDate]) {
        acc[matchDate] = [];
      }
      acc[matchDate].push(match);
      return acc;
    },
    {} as Record<string, typeof matches>
  );
  return (
    <div>
      {Object.entries(groupedMatches).map(([date, matchesForDate]) => (
        <div key={date}>
          <h2 className="text-left text-sm mb-4">{date}</h2>
          {matchesForDate.map((match, index) => (
            <div key={index} className="mb-2">
              <Link
                className="no-underline"
                href="/matches/[id]"
                as={
                  match.game_id
                    ? `/matches/${match.match_id}/games/${match.game_id}`
                    : `/matches/${match.match_id}`
                }
              >
                <div
                  className="grid grid-cols-[1fr_auto_1fr] min-h-[50px] items-center gap-2 bg-background-95 px-0 transition-transform transform hover:scale-105 hover:bg-background-90 hover:ring-2 hover:ring-ring mb-1 rounded-lg shadow-md"
                  style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
                >
                  <div className="flex items-center justify-end min-w-0">
                    <div className="min-w-0 text-right xs:break-normal break-words text-sm sm:text-base mr-1">
                      {match.team1_name}
                    </div>
                    <NextImageFallback
                      src={createTeamLogoUrl(match.team1_logo)}
                      alt={match.team1_name}
                      width={24}
                      height={24}
                      className="ml-1 object-contain hidden xxs:block"
                    />
                  </div>
                  <div className="text-sm bg-secondary h-full min-w-15 md:min-w-18 items-center justify-center flex">
                    {match.team1_score} - {match.team2_score}
                  </div>
                  <div className="flex items-center justify-start ml-1 min-w-0">
                    <NextImageFallback
                      src={createTeamLogoUrl(match.team2_logo)}
                      alt={match.team2_name}
                      width={24}
                      height={24}
                      className="mr-1 object-contain hidden xxs:block"
                    />
                    <div className="min-w-0 text-left xs:break-normal break-words text-sm sm:text-base ml-1">
                      {match.team2_name}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
