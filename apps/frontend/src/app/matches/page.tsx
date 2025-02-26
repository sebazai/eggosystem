"use client";

import { useState } from "react";
import { useMatches } from "@/hooks/data/useMatches";
import MatchContainer from "./match-container";
import Image from "next/image";

export default function AllMatches() {
  const [season, setSeason] = useState("14");
  const [stage, setStage] = useState("any");
  const [map, setMap] = useState("any");

  const { matches, isError, isLoading, isValidating } = useMatches(
    season,
    stage,
    map
  );

  const handleSeasonChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSeason(event.target.value);
  };

  const handleStageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStage(event.target.value);
  };

  const handleMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMap(event.target.value);
  };

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
      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-center">
          <label className="mr-2 text-white text-sm">Season:</label>
          <select
            value={season}
            onChange={handleSeasonChange}
            className="bg-gray-800 text-white p-2 rounded text-sm"
          >
            <option value="14">14</option>
            <option value="11">11</option>
          </select>
          <label className="mr-2 ml-4 text-white text-sm">Stage:</label>
          <select
            value={stage}
            onChange={handleStageChange}
            className="bg-gray-800 text-white p-2 rounded text-sm"
          >
            <option value="any">Any</option>
            <option value="1">Regular</option>
            <option value="2">Playoffs</option>
          </select>
          <label className="mr-2 ml-4 text-white text-sm">Map:</label>
          <select
            value={map}
            onChange={handleMapChange}
            className="bg-gray-800 text-white p-2 rounded text-sm"
          >
            <option value="any">Any</option>
            <option value="de_dust2">Dust2</option>
            <option value="de_nuke">Nuke</option>
            <option value="de_anubis">Anubis</option>
            <option value="de_ancient">Ancient</option>
            <option value="de_overpass">Overpass</option>
            <option value="de_train">Train</option>
            <option value="de_mirage">Mirage</option>
            <option value="de_vertigo">Vertigo</option>
          </select>
        </div>
        {matches.map((match, index) => {
          const matchDate = new Date(match.match_date).toLocaleDateString();
          const showDate = matchDate !== lastDate;
          lastDate = matchDate;

          return (
            <div key={index} className="mb-2">
              {showDate && (
                <div className="text-left text-sm font-bold text-white my-2">
                  {matchDate}
                </div>
              )}
              <a className="text-white no-underline" href="#">
                <div
                  className="grid grid-cols-[1fr_auto_1fr] h-[60px] items-center gap-4 bg-background-95 px-2 transition-transform transform hover:scale-105 hover:bg-background-90 lg:px-4 mb-1"
                  style={{
                    backgroundColor: "hsla(0, 0%, 10%, 0.7)",
                    boxShadow: "0 3px 8px hsla(0, 0%, 0%, 0.3)",
                    borderRadius: "6px",
                    minWidth: "0" // Prevents flexbox from forcing content to expand
                  }}
                >
                  {/* Left Team */}
                  <div className="flex items-center justify-end w-full pr-4 h-full min-w-0">
                    <span className="truncate text-right font-style-body-b3 cursor-pointer text-sm overflow-hidden text-ellipsis">
                      {match.team_name}
                    </span>
                    <div className="flex items-center justify-center w-8 h-8 ml-2">
                      <Image
                        src={`https://stats.kanaliiga.fi/img/${match.team_logo}`}
                        alt={match.team_name}
                        className="w-full h-full object-contain"
                        width={32}
                        height={32}
                      />
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-center w-20 h-full rounded bg-background-100 px-2 font-style-label-l3 whitespace-nowrap text-white text-sm">
                    {match.team_score} - {match.opponent_score}
                  </div>

                  {/* Right Team */}
                  <div className="flex items-center justify-start w-full pl-4 h-full min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 mr-2">
                      <Image
                        src={`https://stats.kanaliiga.fi/img/${match.opponent_logo}`}
                        alt={match.opponent_name}
                        className="w-full h-full object-contain"
                        width={32}
                        height={32}
                      />
                    </div>
                    <span className="truncate text-left font-style-body-b3 cursor-pointer text-sm overflow-hidden text-ellipsis">
                      {match.opponent_name}
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
