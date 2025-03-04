import type { MatchesByFilters } from "@eggosystem/types";
import Image from "next/image";
import Link from "next/link";

interface FilteredMatchesListProps {
  matches: MatchesByFilters[] | undefined;
  isLoading: boolean;
}

export const FilteredMatchesList = ({
  matches,
  isLoading
}: FilteredMatchesListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        Loading...
      </div>
    );
  }
  if (!matches) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        No matches found
      </div>
    );
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
                as={`/matches/${match.match_played_id}`}
              >
                <div
                  className="grid grid-cols-[1fr_auto_1fr] min-h-[50px] items-center gap-2 bg-background-95 px-0 transition-transform transform hover:scale-105 hover:bg-background-90 hover:ring-2 hover:ring-ring mb-1 rounded-lg shadow-md"
                  style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
                >
                  <div className="flex items-center justify-end min-w-0">
                    <div className="min-w-0 text-right xs:break-normal break-words text-sm sm:text-base mr-1">
                      {match.team1_name}
                    </div>
                    <Image
                      src={`https://stats.kanaliiga.fi/img/${match.team1_logo}`}
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
                    <Image
                      src={`https://stats.kanaliiga.fi/img/${match.team2_logo}`}
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
