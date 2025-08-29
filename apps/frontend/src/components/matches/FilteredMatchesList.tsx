import Link from "next/link";
import { ContentContainer } from "../layout/ContentContainer";
import { createTeamLogoUrl, type FilterParamsQuery } from "@/lib/utils";
import { useRecentMatches } from "@/hooks/data/filtered/useRecentMatches";
import { NextImageFallback } from "../layout/NextImageFallback";

interface FilteredMatchesListProps {
  filterQueryParams: FilterParamsQuery;
}

export const FilteredMatchesList = ({
  filterQueryParams
}: FilteredMatchesListProps) => {
  const { matches, isError, isLoading, isValidating } =
    useRecentMatches(filterQueryParams);

  // Helper function to determine the correct match URL
  const getMatchUrl = (match: NonNullable<typeof matches>[0]) => {
    // Since this component shows "recent matches" with scores, they are likely completed matches
    // But we can still check if the match date is in the future as a safety measure
    const matchDate = new Date(match.match_date);
    const now = new Date();

    // Set the match date to end of day for comparison since we only have date, not time
    matchDate.setHours(23, 59, 59, 999);

    if (matchDate > now) {
      // Future match - route to upcoming page
      return match.game_id
        ? `/matches/upcoming/${match.match_id}`
        : `/matches/upcoming/${match.match_id}`;
    } else {
      // Past/completed match - route to regular match page
      return match.game_id
        ? `/matches/${match.match_id}/games/${match.game_id}`
        : `/matches/${match.match_id}`;
    }
  };

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
      acc[matchDate]?.push(match);
      return acc;
    },
    {} as Record<string, typeof matches>
  );
  return (
    <div>
      {Object.entries(groupedMatches).map(([date, matchesForDate]) => (
        <div key={date}>
          <h2 className="text-left text-sm sm:text-lg mb-2">{date}</h2>
          {matchesForDate.map((match, index) => (
            <div key={index} className="mb-2 sm:mb-4">
              <Link className="no-underline" href={getMatchUrl(match)}>
                <div className="bg-card grid grid-cols-[1fr_auto_1fr] min-h-10 md:min-h-12 items-center gap-2 px-0 transition-transform transform hover:scale-105 hover:ring-2 hover:ring-ring mb-1 rounded-lg shadow-md dark:shadow-muted">
                  <div className="flex items-center justify-end">
                    <div className="text-right xs:break-normal break-words text-sm sm:text-base mr-1">
                      {match.team1_name}
                    </div>
                    <NextImageFallback
                      src={createTeamLogoUrl(match.team1_logo)}
                      alt={match.team1_name}
                      width={30}
                      height={30}
                      className="w-8 h-8 sm:w-10 sm:h-10 ml-1 object-contain hidden xxs:block"
                    />
                  </div>
                  <div className="relative h-full min-w-16 md:min-w-20 flex items-center justify-center bg-kanaliiga-light-brown/30 rounded-xs">
                    <div className="z-10 w-7 font-black text-md sm:text-lg text-center">
                      {match.team1_score}
                    </div>
                    <span className="mx-1 md:mx-2">&mdash;</span>
                    <div className="z-10 w-7 font-black text-md sm:text-lg text-center">
                      {match.team2_score}
                    </div>
                  </div>

                  <div className="flex items-center justify-start ml-1">
                    <NextImageFallback
                      src={createTeamLogoUrl(match.team2_logo)}
                      alt={match.team2_name}
                      width={30}
                      height={30}
                      className="w-6 h-6 sm:w-8 sm:h-8 mr-1 object-contain hidden xxs:block"
                    />
                    <div className="text-left xs:break-normal break-words text-sm sm:text-base ml-1">
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
