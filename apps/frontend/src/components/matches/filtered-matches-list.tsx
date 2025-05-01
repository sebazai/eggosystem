import Image from "next/image";
import Link from "next/link";
import { ContentContainer } from "../layout/content-container";
import {
  createStatsKanaliigaImageUrl,
  type FilterParamsQuery,
  expressFetcher
} from "@/lib/utils";
import { useRecentMatches } from "@/hooks/data/useRecentMatches";
import { useState, useEffect } from "react";
import type { MatchMapsPlayed } from "@eggosystem/types";

interface FilteredMatchesListProps {
  filterQueryParams: FilterParamsQuery;
}

export const FilteredMatchesList = ({
  filterQueryParams
}: FilteredMatchesListProps) => {
  const { matches, isError, isLoading, isValidating } =
    useRecentMatches(filterQueryParams);

  // Store first game IDs for BO1 matches
  const [bo1GameIds, setBo1GameIds] = useState<Record<string, string>>({});

  // Use a simpler approach - load first game for each match as needed
  useEffect(() => {
    if (!matches || matches.length === 0) return;

    // Identify BO1 matches based on score
    // In CS2, BO1 scores are like 16-14, BO3/BO5 are like 2-1
    const bo1Matches = matches.filter(
      (match) => match.team1_score > 5 || match.team2_score > 5
    );

    console.log(
      `Found ${bo1Matches.length} potential BO1 matches of ${matches.length} total matches`
    );

    // For each BO1 match, fetch the first game ID
    const fetchFirstGameIds = async () => {
      const gameIds: Record<string, string> = {};

      for (const match of bo1Matches) {
        const matchId = match.game_id.toString();

        // Skip if we already have this match's game ID
        if (bo1GameIds[matchId]) continue;

        try {
          // Use the expressFetcher utility
          const maps = await expressFetcher<MatchMapsPlayed[]>(
            `/api/v1/matches/${matchId}/mapsplayed`
          );

          if (Array.isArray(maps) && maps.length > 0 && maps[0]?.id) {
            gameIds[matchId] = maps[0].id.toString();
            console.log(
              `Successfully mapped BO1 match ${matchId} to game ${maps[0].id}`
            );
          }
        } catch (error) {
          console.error(`Error fetching maps for match ${matchId}:`, error);
        }
      }

      // Only update state if we found new game IDs
      if (Object.keys(gameIds).length > 0) {
        setBo1GameIds((prev) => ({ ...prev, ...gameIds }));
      }
    };

    fetchFirstGameIds();
  }, [matches, bo1GameIds]);

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
          {matchesForDate.map((match, index) => {
            const matchId = match.game_id.toString();
            const isBO1 = match.team1_score > 5 || match.team2_score > 5;
            const hasGameId = bo1GameIds[matchId];

            // If it's a BO1 match with a game ID, link directly to the game page
            // Otherwise, link to the match page
            const matchUrl =
              isBO1 && hasGameId
                ? `/matches/${matchId}/games/${bo1GameIds[matchId]}`
                : `/matches/${matchId}`;

            return (
              <div key={index} className="mb-2">
                <Link className="no-underline" href={matchUrl}>
                  <div
                    className="grid grid-cols-[1fr_auto_1fr] min-h-[50px] items-center gap-2 bg-background-95 px-0 transition-transform transform hover:scale-105 hover:bg-background-90 hover:ring-2 hover:ring-ring mb-1 rounded-lg shadow-md"
                    style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
                  >
                    <div className="flex items-center justify-end min-w-0">
                      <div className="min-w-0 text-right xs:break-normal break-words text-sm sm:text-base mr-1">
                        {match.team1_name}
                      </div>
                      <Image
                        src={createStatsKanaliigaImageUrl(match.team1_logo)}
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
                        src={createStatsKanaliigaImageUrl(match.team2_logo)}
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
            );
          })}
        </div>
      ))}
    </div>
  );
};
