"use client";

import { useMatches } from "@/hooks/data/useMatches";
import MatchContainer from "./match-container";

export default function AllMatches() {
  const { matches, isError, isLoading, isValidating } = useMatches();

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
        <div>No matches found</div>
      </MatchContainer>
    );
  }

  const formatMapName = (mapName: string) => {
    if (mapName.startsWith("de_")) {
      mapName = mapName.slice(3);
    }
    return mapName.charAt(0).toUpperCase() + mapName.slice(1);
  };

  return (
    <MatchContainer>
      <div className="p-6">
        <table className="w-full border-separate border-spacing-y-3">
          <thead className="sticky top-[215px] z-10 bg-gray-900">
            <tr className="text-left text-lg font-medium">
              <th className="p-4">Team 1</th>
              <th className="p-4">Score</th>
              <th className="p-4">Team 2</th>
              <th className="p-4">Date</th>
              <th className="p-4">League</th>
              <th className="p-4">Map</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match, index) => (
              <tr
                key={index}
                className="shadow-md transition hover:scale-[1.02] hover:shadow-lg mb-3"
                style={{
                  backgroundColor: "hsla(0, 0.00%, 10.20%, 0.70)", // Dark but soft
                  boxShadow: "0 3px 8px hsla(0, 0%, 0%, 0.3)", // Modern soft shadow
                  borderRadius: "6px" // Slight round effect (not boxy)
                }}
              >
                <td className="p-4">{match.team_name}</td>
                <td className="p-4">
                  {match.team_score} - {match.opponent_score}
                </td>
                <td className="p-4">{match.opponent_name}</td>
                <td className="p-4">{match.match_date}</td>
                <td className="p-4">{match.league_name}</td>
                <td className="p-4">{formatMapName(match.map_name)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MatchContainer>
  );
}
