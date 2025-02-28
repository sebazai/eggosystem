"use client";

import { useState } from "react";
import { useRecentMatches } from "@/hooks/data/useMatches";
import MatchContainer from "./match-container";
import Image from "next/image";
import { MultiFilters } from "@/components/filters/multi-filters";

export default function AllMatches() {
  const [seasons, setSeasons] = useState<number[]>([]);
  const [leagues, setLeagues] = useState<number[]>([]);
  const [stages, setStages] = useState<number[]>([]);
  const [teams, setTeams] = useState<number[]>([]);
  const [maps, setMaps] = useState<number[]>([]);

  const { matches, isError, isLoading, isValidating } = useRecentMatches({
    seasons,
    leagues,
    stages,
    teams,
    maps
  });

  if (isLoading || isValidating) {
    return (
      <MatchContainer>
        <div className="flex items-center justify-center min-h-[70vh]">
          Loading...
        </div>
      </MatchContainer>
    );
  }
  if (isError) {
    return (
      <MatchContainer>
        <div className="flex items-center justify-center min-h-[70vh]">
          Error loading Matches
        </div>
      </MatchContainer>
    );
  }
  if (!matches) {
    return (
      <MatchContainer>
        <div className="flex items-center justify-center min-h-[70vh]">
          No matches found
        </div>
      </MatchContainer>
    );
  }

  let lastDate = "";

  return (
    <MatchContainer>
      <div className="p-0">
        <MultiFilters
          seasons={seasons}
          setSeasons={(value) => setSeasons(value)}
          leagues={leagues}
          setLeagues={(value) => setLeagues(value)}
          stages={stages}
          setStages={(value) => setStages(value)}
          teams={teams}
          setTeams={(value) => setTeams(value)}
          maps={maps}
          setMaps={(value) => setMaps(value)}
        />
        {matches.map((match, index) => {
          const matchDate = new Date(match.match_date).toLocaleDateString();
          const showDate = matchDate !== lastDate;
          lastDate = matchDate;

          return (
            <div key={index} className="mb-2">
              {showDate && (
                <div className="text-left text-sm font-bold text-white my-4">
                  {matchDate}
                </div>
              )}
              <a className="text-white no-underline" href="#">
                <div
                  className="grid grid-cols-[1fr_auto_1fr] h-[60px] items-center gap-2 bg-background-95 px-0 transition-transform transform hover:scale-105 hover:bg-background-90 mb-1 rounded-lg shadow-md"
                  style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
                >
                  <div className="flex items-center justify-end pr-1 min-w-0">
                    <span className="truncate text-right text-sm">
                      {match.team1_name}
                    </span>
                    <Image
                      src={`https://stats.kanaliiga.fi/img/${match.team1_logo}`}
                      alt={match.team1_name}
                      width={24}
                      height={24}
                      className="ml-1 object-contain"
                    />
                  </div>
                  <div className="text-sm text-white px-2">
                    {match.team1_score} - {match.team2_score}
                  </div>
                  <div className="flex items-center justify-start pl-1 min-w-0">
                    <Image
                      src={`https://stats.kanaliiga.fi/img/${match.team2_logo}`}
                      alt={match.team2_name}
                      width={24}
                      height={24}
                      className="mr-1 object-contain"
                    />
                    <span className="truncate text-left text-sm">
                      {match.team2_name}
                    </span>
                  </div>
                </div>
              </a>
            </div>
          );
        })}
      </div>
    </MatchContainer>
  );
}
