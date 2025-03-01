"use client";

import { useState } from "react";
import { useRecentMatches } from "@/hooks/data/useMatches";
import MatchContainer from "./match-container";
import Image from "next/image";
import { MultiFilters } from "@/components/filters/multi-filters";
import Link from "next/link";

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
                      <span className="text-right xxs:break-normal break-all text-sm mr-1">
                        {match.team1_name}
                      </span>
                      <Image
                        src={`https://stats.kanaliiga.fi/img/${match.team1_logo}`}
                        alt={match.team1_name}
                        width={24}
                        height={24}
                        className="ml-1 object-contain hidden xxs:block"
                      />
                    </div>
                    <div className="text-sm bg-secondary h-full min-w-20 px-2 items-center justify-center flex">
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
                      <span className="text-left break-all xxs:break-normal text-sm ml-1">
                        {match.team2_name}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ))}
      </div>
    </MatchContainer>
  );
}
