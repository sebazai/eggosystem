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
          <h2 className="text-left text-sm sm:text-lg mb-2">{date}</h2>
          {matchesForDate.map((match, index) => (
            <div key={index} className="mb-2 sm:mb-4">
              <Link
                className="no-underline"
                href="/matches/[id]"
                as={
                  match.game_id
                    ? `/matches/${match.match_id}/games/${match.game_id}`
                    : `/matches/${match.match_id}`
                }
              >
                <div className="grid grid-cols-[1fr_auto_1fr] min-h-10 md:min-h-12 items-center gap-2 px-0 transition-transform transform hover:scale-105 hover:bg-background-90 hover:ring-2 hover:ring-ring mb-1 rounded-lg shadow-md">
                  <div className="flex items-center justify-end min-w-0">
                    <div className="min-w-0 text-right xs:break-normal break-words text-sm sm:text-base mr-1">
                      {match.team1_name}
                    </div>
                    <NextImageFallback
                      src={createTeamLogoUrl(match.team1_logo)}
                      alt={match.team1_name}
                      width={30}
                      height={30}
                      className="w-6 h-6 sm:w-8 sm:h-8 ml-1 object-contain hidden xxs:block"
                    />
                  </div>
                  <div className="relative h-full min-w-15 md:min-w-18 flex items-center justify-center bg-cover bg-center bg-kanaliiga-orange/20">
                    <div className="relative z-10 font-black text-md sm:text-lg">
                      {match.team1_score} - {match.team2_score}
                    </div>
                  </div>

                  <div className="flex items-center justify-start ml-1 min-w-0">
                    <NextImageFallback
                      src={createTeamLogoUrl(match.team2_logo)}
                      alt={match.team2_name}
                      width={30}
                      height={30}
                      className="w-6 h-6 sm:w-8 sm:h-8 mr-1 object-contain hidden xxs:block"
                    />
                    <div className="min-w-0 text-left xs:break-normal break-words text-sm sm:text-base ml-1">
                      {match.team2_name}
                    </div>
                  </div>
                </div>
              </Link>
              {/* <div className="flex flex-wrap justify-center gap-2 mt-1">
                {match.map_name.split(",").map((map) => (
                  <div
                    key={`${map}-${match.match_id}`}
                    className="relative flex-1 min-w-[120px] max-w-[calc(33.33%-0.5rem)] h-10 rounded-lg overflow-hidden"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${createNextUrl(`/images/maps/${map.trim()}.png`)})`,
                        filter: "brightness(0.5)"
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/60 to-transparent" />

                    <div className="absolute bottom-1 left-1 right-1 text-muted-foreground text-xs sm:text-sm font-semibold z-10">
                      {mapToReadableName(map)}
                    </div>
                  </div>
                ))}
              </div> */}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
