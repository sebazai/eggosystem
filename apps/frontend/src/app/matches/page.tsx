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
      <div className="p-0">
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
                  className="grid grid-cols-[1fr_auto_1fr] h-[60px] items-center gap-2 bg-background-95 px-0 transition-transform transform hover:scale-105 hover:bg-background-90 mb-1"
                  style={{
                    backgroundColor: "hsla(0, 0%, 10%, 0.7)",
                    boxShadow: "0 3px 8px hsla(0, 0%, 0%, 0.3)",
                    borderRadius: "6px",
                    minWidth: "0"
                  }}
                >
                  {/* Left Team */}
                  <div className="flex items-center justify-end w-full pr-1 h-full min-w-0">
                    <span className="truncate text-right font-style-body-b3 cursor-pointer text-sm overflow-hidden text-ellipsis">
                      {match.team1_name}
                    </span>
                    <div className="flex items-center justify-center w-6 h-6 ml-1">
                      <Image
                        src={`https://stats.kanaliiga.fi/img/${match.team1_logo}`}
                        alt={match.team1_name}
                        className="w-full h-full object-contain"
                        width={24}
                        height={24}
                      />
                    </div>
                  </div>

                  {/* Score */}
                  <div
                    className="flex items-center justify-center w-20 h-full rounded px-2 font-style-label-l3 whitespace-nowrap text-white text-sm shadow-md backdrop-blur-md"
                    style={{ backgroundColor: "hsla(0, 0%, 20%, 0.45)" }} // Darker with slight transparency
                  >
                    {match.team1_score} - {match.team2_score}
                  </div>

                  {/* Right Team */}
                  <div className="flex items-center justify-start w-full pl-1 h-full min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 mr-1">
                      <Image
                        src={`https://stats.kanaliiga.fi/img/${match.team2_logo}`}
                        alt={match.team2_name}
                        className="w-full h-full object-contain"
                        width={24}
                        height={24}
                      />
                    </div>
                    <span className="truncate text-left font-style-body-b3 cursor-pointer text-sm overflow-hidden text-ellipsis">
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
