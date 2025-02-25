"use client";

import { useState } from "react";
import { useMatches } from "@/hooks/data/useMatches";
import MatchContainer from "./match-container";
import Image from "next/image";

export default function AllMatches() {
  const [season, setSeason] = useState("14"); // Fixme: any does not work to backend, dunno why
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
          <label className="mr-2 text-white">Season:</label>
          <select
            value={season}
            onChange={handleSeasonChange}
            className="bg-gray-800 text-white p-2 rounded"
          >
            <option value="14">14</option>
            <option value="11">11</option>
          </select>
          <label className="mr-2 ml-4 text-white">Stage:</label>
          <select
            value={stage}
            onChange={handleStageChange}
            className="bg-gray-800 text-white p-2 rounded"
          >
            <option value="any">Any</option>
            <option value="1">Regular</option>
            <option value="2">Playoffs</option>
          </select>
          <label className="mr-2 ml-4 text-white">Map:</label>
          <select
            value={map}
            onChange={handleMapChange}
            className="bg-gray-800 text-white p-2 rounded"
          >
            <option value="any">Any</option>
            <option value="1">Mirage</option>
            <option value="2">Inferno</option>
            <option value="3">Dust2</option>
            <option value="4">Overpass</option>
            <option value="5">Nuke</option>
            <option value="6">Train</option>
            <option value="7">Vertigo</option>
            <option value="8">Ancient</option>
            <option value="9">Anubis</option>
          </select>
        </div>
        {matches.map((match, index) => {
          const matchDate = new Date(match.match_date).toLocaleDateString();
          const showDate = matchDate !== lastDate;
          lastDate = matchDate;

          return (
            <div key={index} className="mb-2">
              {showDate && (
                <div className="text-left text-lg font-bold text-white my-2">
                  {matchDate}
                </div>
              )}
              <a className="text-white no-underline" href="#">
                <div
                  className="flex h-[60px] justify-between items-center gap-4 bg-background-95 px-2 transition-colors hover:bg-background-90 lg:grid lg:grid-cols-11 lg:px-4 mb-1"
                  style={{
                    backgroundColor: "hsla(0, 0%, 10%, 0.7)", // Dark but soft
                    boxShadow: "0 3px 8px hsla(0, 0%, 0%, 0.3)", // Modern soft shadow
                    borderRadius: "6px" // Slight round effect (not boxy)
                  }}
                >
                  <div className="flex items-center justify-center w-full">
                    <span className="truncate text-center font-style-body-b3 cursor-pointer">
                      {match.team_name}
                    </span>
                    <Image
                      src={`https://stats.kanaliiga.fi/img/${match.team_logo}`}
                      alt={match.team_name}
                      className="w-6 h-6 ml-2"
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className="flex h-8 items-center justify-center rounded bg-background-100 px-2 font-style-label-l3 whitespace-nowrap text-white lg:col-span-1 lg:h-auto lg:w-20 lg:py-1 lg:font-style-body-b1">
                    {match.team_score} - {match.opponent_score}
                  </div>
                  <div className="flex items-center justify-center w-full">
                    <Image
                      src={`https://stats.kanaliiga.fi/img/${match.opponent_logo}`}
                      alt={match.opponent_name}
                      className="w-6 h-6 mr-2"
                      width={24}
                      height={24}
                    />
                    <span className="truncate text-center font-style-body-b3 cursor-pointer">
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
