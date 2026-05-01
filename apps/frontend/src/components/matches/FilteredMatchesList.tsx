import Link from "next/link";
import { ContentContainer } from "../layout/ContentContainer";
import { createTeamLogoUrl, type FilterParamsQuery } from "@/lib/utils";
import { dualTeamRowToHomeLeftDisplay } from "@/lib/order-match-teams-home-left-away";
import { useRecentMatches } from "@/hooks/data/filtered/useRecentMatches";
import { NextImageFallback } from "../layout/NextImageFallback";
import { MatchListSkeleton } from "@/components/loading";

interface FilteredMatchesListProps {
  filterQueryParams: FilterParamsQuery;
}

export const FilteredMatchesList = ({
  filterQueryParams
}: FilteredMatchesListProps) => {
  const { matches, isError, isLoading, isValidating } =
    useRecentMatches(filterQueryParams);

  if (isLoading || isValidating) {
    return <MatchListSkeleton />;
  }

  if (isError) {
    return <ContentContainer>Error loading Matches</ContentContainer>;
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
          {matchesForDate.map((match, index) => {
            const { left, right } = dualTeamRowToHomeLeftDisplay({
              team1_side: match.team1_side,
              team2_side: match.team2_side,
              team1_name: match.team1_name,
              team2_name: match.team2_name,
              team1_logo: match.team1_logo,
              team2_logo: match.team2_logo,
              team1_score: match.team1_score,
              team2_score: match.team2_score
            });
            return (
              <div key={index} className="mb-2 sm:mb-4">
                <Link
                  className="no-underline"
                  href="/matches/[id]"
                  as={
                    match.match_game_id
                      ? `/matches/${match.match_id}/games/${match.match_game_id}`
                      : `/matches/${match.match_id}`
                  }
                >
                  <div className="bg-card grid grid-cols-[1fr_auto_1fr] min-h-10 md:min-h-12 items-center gap-2 px-0 transition-transform transform hover:scale-105 hover:ring-2 hover:ring-ring mb-1 rounded-lg shadow-md dark:shadow-muted">
                    <div className="flex items-center justify-end">
                      <div className="text-right xs:break-normal break-words text-sm sm:text-base mr-1">
                        {left.name}
                      </div>
                      <NextImageFallback
                        src={createTeamLogoUrl(left.logo ?? "")}
                        alt={left.name}
                        width={30}
                        height={30}
                        className="w-8 h-8 sm:w-10 sm:h-10 ml-1 object-contain hidden xxs:block"
                      />
                    </div>
                    <div className="relative h-full min-w-16 md:min-w-20 flex items-center justify-center bg-kanaliiga-light-brown/30 rounded-xs">
                      <div className="z-10 w-7 font-black text-md sm:text-lg text-center">
                        {left.score}
                      </div>
                      <span className="mx-1 md:mx-2">&mdash;</span>
                      <div className="z-10 w-7 font-black text-md sm:text-lg text-center">
                        {right.score}
                      </div>
                    </div>

                    <div className="flex items-center justify-start ml-1">
                      <NextImageFallback
                        src={createTeamLogoUrl(right.logo ?? "")}
                        alt={right.name}
                        width={30}
                        height={30}
                        className="w-6 h-6 sm:w-8 sm:h-8 mr-1 object-contain hidden xxs:block"
                      />
                      <div className="text-left xs:break-normal break-words text-sm sm:text-base ml-1">
                        {right.name}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
