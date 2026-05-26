import { ContentContainer } from "../layout/ContentContainer";
import type { FilterParamsQuery } from "@/lib/utils";
import { useRecentMatches } from "@/hooks/data/filtered/useRecentMatches";
import { MatchListSkeleton } from "@/components/loading";
import { DateGroup } from "./DateGroup";
import { MatchCard } from "./MatchCard";

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
        <DateGroup key={date} date={date} count={matchesForDate.length}>
          {matchesForDate.map((match) => {
            const href = match.match_game_id
              ? `/matches/${match.match_id}/games/${match.match_game_id}`
              : `/matches/${match.match_id}`;
            return <MatchCard key={match.match_id} match={match} href={href} />;
          })}
        </DateGroup>
      ))}
    </div>
  );
};
