import Image from "next/image";
import React from "react";
import { MatchHeader } from "@/components/layout/match-header";

interface MapPickBan {
  map: string;
  type: "PICK" | "BAN" | "DECIDER";
  team?: number; // 0 for team1, 1 for team2
  score?: {
    team1: number;
    team2: number;
  };
}

interface Player {
  name: string;
  country: string;
  kills: number;
  deaths: number;
  killDiff: number;
  adr: number;
  maxKills: number;
  fantasyPicked: number;
  rating: number;
}

interface Team {
  name: string;
  players: Player[];
}

interface RoundResult {
  type: "T_WIN" | "CT_WIN" | "BOMB_EXPLODED" | "BOMB_DEFUSED" | "TIMEOUT";
  winner: number; // 0 for team1, 1 for team2
}

interface TopPlayer {
  award: string;
  player: string;
  team: number;
  score: number | string;
}

export default function MatchPage() {
  const mapPickBans: MapPickBan[] = [
    { map: "ANCIENT", type: "BAN", team: 1 },
    { map: "TRAIN", type: "BAN", team: 1 },
    { map: "ANUBIS", type: "PICK", team: 0, score: { team1: 11, team2: 13 } },
    { map: "DUST2", type: "PICK", team: 1, score: { team1: 13, team2: 9 } },
    { map: "MIRAGE", type: "BAN", team: 0 },
    { map: "INFERNO", type: "BAN", team: 1 },
    { map: "NUKE", type: "DECIDER", score: { team1: 10, team2: 13 } }
  ];

  // Generate round data for Anubis (11-13)
  const roundResults: RoundResult[] = [
    { type: "CT_WIN", winner: 0 }, // 1-0
    { type: "BOMB_EXPLODED", winner: 1 }, // 1-1
    { type: "T_WIN", winner: 1 }, // 1-2
    { type: "CT_WIN", winner: 0 }, // 2-2
    { type: "BOMB_DEFUSED", winner: 0 }, // 3-2
    { type: "T_WIN", winner: 1 }, // 3-3
    { type: "TIMEOUT", winner: 1 }, // Technical timeout
    { type: "BOMB_EXPLODED", winner: 1 }, // 3-4
    { type: "T_WIN", winner: 1 }, // 3-5
    { type: "CT_WIN", winner: 0 }, // 4-5
    { type: "CT_WIN", winner: 0 }, // 5-5
    { type: "BOMB_EXPLODED", winner: 1 }, // 5-6
    { type: "CT_WIN", winner: 0 }, // 6-6
    { type: "T_WIN", winner: 1 }, // 6-7
    { type: "CT_WIN", winner: 0 }, // 7-7
    { type: "TIMEOUT", winner: 0 }, // Technical timeout
    { type: "BOMB_DEFUSED", winner: 0 }, // 8-7
    { type: "T_WIN", winner: 1 }, // 8-8
    { type: "BOMB_EXPLODED", winner: 1 }, // 8-9
    { type: "CT_WIN", winner: 0 }, // 9-9
    { type: "T_WIN", winner: 1 }, // 9-10
    { type: "CT_WIN", winner: 0 }, // 10-10
    { type: "BOMB_EXPLODED", winner: 1 }, // 10-11
    { type: "CT_WIN", winner: 0 }, // 11-11
    { type: "T_WIN", winner: 1 }, // 11-12
    { type: "BOMB_EXPLODED", winner: 1 } // 11-13
  ];

  const teams: Team[] = [
    {
      name: "PHOENIX FLAMES",
      players: [
        {
          name: "Blaze",
          country: "se",
          kills: 56,
          deaths: 66,
          killDiff: -10,
          adr: 80,
          maxKills: 4,
          rating: 73,
          fantasyPicked: 0
        },
        {
          name: "Sparks",
          country: "dk",
          kills: 59,
          deaths: 68,
          killDiff: -9,
          adr: 79,
          maxKills: 5,
          rating: 52,
          fantasyPicked: 0
        },
        {
          name: "Inferno",
          country: "fi",
          kills: 54,
          deaths: 62,
          killDiff: -8,
          adr: 75,
          maxKills: 4,
          rating: 55,
          fantasyPicked: 0
        },
        {
          name: "Ember",
          country: "no",
          kills: 62,
          deaths: 56,
          killDiff: 6,
          adr: 75,
          maxKills: 13,
          rating: 43,
          fantasyPicked: 0
        },
        {
          name: "Cinder",
          country: "fr",
          kills: 37,
          deaths: 71,
          killDiff: -34,
          adr: 61,
          maxKills: 3,
          rating: 43,
          fantasyPicked: 0
        }
      ]
    },
    {
      name: "ARCTIC WOLVES",
      players: [
        {
          name: "Frost",
          country: "ca",
          kills: 78,
          deaths: 63,
          killDiff: 15,
          adr: 109,
          maxKills: 7,
          rating: 62,
          fantasyPicked: 0
        },
        {
          name: "Glacier",
          country: "us",
          kills: 79,
          deaths: 39,
          killDiff: 40,
          adr: 105,
          maxKills: 5,
          rating: 35,
          fantasyPicked: 0
        },
        {
          name: "Tundra",
          country: "de",
          kills: 65,
          deaths: 59,
          killDiff: 6,
          adr: 89,
          maxKills: 9,
          rating: 34,
          fantasyPicked: 0
        },
        {
          name: "Blizzard",
          country: "pl",
          kills: 48,
          deaths: 55,
          killDiff: -7,
          adr: 75,
          maxKills: 8,
          rating: 55,
          fantasyPicked: 0
        },
        {
          name: "Avalanche",
          country: "uk",
          kills: 53,
          deaths: 58,
          killDiff: -5,
          adr: 67,
          maxKills: 4,
          rating: 57,
          fantasyPicked: 0
        }
      ]
    }
  ];

  const topPlayers: TopPlayer[] = [
    { award: "Highest ADR", player: "Glacier", team: 1, score: 122.4 },
    { award: "Most Assists", player: "Frost", team: 1, score: 6 },
    { award: "Most AWP kills", player: "Blaze", team: 0, score: 3 },
    { award: "Most utility damage", player: "Tundra", team: 1, score: 227 },
    { award: "Most first kills", player: "Glacier", team: 1, score: 4 },
    { award: "Most clutches won", player: "Ember", team: 0, score: 2 },
    { award: "Most entry kills", player: "Frost", team: 1, score: 5 },
    { award: "Most flash assists", player: "Sparks", team: 0, score: 4 }
  ];

  // Calculate total score for each team from mapPickBans
  const totalScore = mapPickBans
    .filter((map) => map.type === "PICK" || map.type === "DECIDER")
    .reduce(
      (acc, map) => {
        if (map.score) {
          if (map.score.team1 > map.score.team2) acc.team1++;
          if (map.score.team2 > map.score.team1) acc.team2++;
        }
        return acc;
      },
      { team1: 0, team2: 0 }
    );

  const matchHeaderProps = {
    team1: {
      name: teams[0]?.name ?? "Team 1",
      logo: "https://stats.kanaliiga.fi/img/S14_1997.png",
      score: totalScore.team1,
      rank: 9
    },
    team2: {
      name: teams[1]?.name ?? "Team 2",
      logo: "https://stats.kanaliiga.fi/img/S14_1999.png",
      score: totalScore.team2,
      rank: 1
    },
    matchTime: "21:00",
    matchDate: "25TH JAN"
  };

  return (
    <div
      className="min-h-fit pb-8"
      style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
    >
      <MatchHeader {...matchHeaderProps} />
      <div className="max-w-[1400px] mx-auto p-2">
        {/* Maps Container */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 mb-4">
          {/* Picked Maps Scores */}
          <div className="w-full">
            {mapPickBans
              .filter((map) => map.type === "PICK" || map.type === "DECIDER")
              .map((map, index) => (
                <div
                  key={index}
                  className="flex items-center mb-[2px] bg-[#1a1a1a]"
                >
                  <div className="w-32 p-3">
                    <div className="text-sm font-medium text-gray-300">
                      {map.map}
                    </div>
                  </div>
                  {map.score && (
                    <div className="flex items-center gap-3 p-3">
                      <span
                        className={`text-lg ${map.score.team1 > map.score.team2 ? "text-white font-bold" : "text-gray-500"}`}
                      >
                        {map.score.team1}
                      </span>
                      <span className="text-gray-600 text-lg">-</span>
                      <span
                        className={`text-lg ${map.score.team2 > map.score.team1 ? "text-white font-bold" : "text-gray-500"}`}
                      >
                        {map.score.team2}
                      </span>
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Map Pick/Ban Phase */}
          <div className="w-full">
            <h2 className="text-lg font-bold text-orange-400 mb-3">
              MAP PICKS & BANS
            </h2>
            <div className="grid grid-cols-2 xl:grid-cols-7 gap-[2px]">
              {mapPickBans.map((mapInfo, index) => (
                <div key={index} className="relative bg-[#0a1520] p-3">
                  {(mapInfo.type === "PICK" || mapInfo.type === "DECIDER") &&
                    mapInfo.score && (
                      <div className="flex justify-between mb-2">
                        <span
                          className={`text-sm ${mapInfo.score.team1 > mapInfo.score.team2 ? "text-white" : "text-gray-500"}`}
                        >
                          {mapInfo.score.team1}
                        </span>
                        <span
                          className={`text-sm ${mapInfo.score.team2 > mapInfo.score.team1 ? "text-white" : "text-gray-500"}`}
                        >
                          {mapInfo.score.team2}
                        </span>
                      </div>
                    )}
                  <div className="text-center">
                    <span
                      className={`text-xs mb-1 block
                      ${mapInfo.type === "PICK" ? "text-green-500" : ""}
                      ${mapInfo.type === "BAN" ? "text-red-500" : ""}
                      ${mapInfo.type === "DECIDER" ? "text-[#4d79ff]" : ""}
                    `}
                    >
                      {mapInfo.type}
                    </span>
                    <div className="text-sm text-gray-300">{mapInfo.map}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-2 mb-2 flex flex-col sm:flex-row justify-between items-center bg-[#1a1a1a]">
          <h1 className="text-base font-bold text-orange-500 mb-2 sm:mb-0">
            MATCH STATS
          </h1>
          <div className="flex flex-wrap gap-2 justify-center">
            <button className="px-3 py-1 bg-white text-black rounded text-xs transition-transform hover:scale-105">
              ALL MAPS
            </button>
            <button className="px-3 py-1 text-gray-400 text-xs transition-transform hover:scale-105 hover:text-white">
              ANUBIS
            </button>
            <button className="px-3 py-1 text-gray-400 text-xs transition-transform hover:scale-105 hover:text-white">
              NUKE
            </button>
            <button className="px-3 py-1 text-gray-400 text-xs transition-transform hover:scale-105 hover:text-white">
              DUST2
            </button>
            <button className="px-3 py-1 text-gray-400 text-xs transition-transform hover:scale-105 hover:text-white">
              MIRAGE
            </button>
          </div>
        </div>

        {/* Statistics Box */}
        <div className="mb-4 bg-[#1a1a1a]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px]">
            {/* Team 1 Stats */}
            <div className="p-4">
              <h3 className="text-base font-bold text-orange-400 mb-4">
                {teams[0]?.name}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Breakdown</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <Image
                        src="/icons/t-side.png"
                        alt="T"
                        width={16}
                        height={16}
                        className="mr-1"
                      />
                      <span className="text-yellow-500">4</span>
                    </div>
                    <div className="flex items-center">
                      <Image
                        src="/icons/ct-side.png"
                        alt="CT"
                        width={16}
                        height={16}
                        className="mr-1"
                      />
                      <span className="text-blue-500">0</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">First kills</span>
                  <span className="text-white">7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Clutches won</span>
                  <span className="text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bombs planted</span>
                  <span className="text-white">6</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trades</span>
                  <span className="text-white">8</span>
                </div>
              </div>
            </div>

            {/* Center Stats - GOTV Demo */}
            <div className="p-4 flex flex-col justify-center items-center border-l border-r border-gray-800">
              <span className="text-gray-400 mb-2">GOTV Demo File</span>
              <button className="px-4 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors">
                Download
              </button>
            </div>

            {/* Team 2 Stats */}
            <div className="p-4">
              <h3 className="text-base font-bold text-orange-400 mb-4">
                {teams[1]?.name}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Breakdown</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <Image
                        src="/icons/t-side.png"
                        alt="T"
                        width={16}
                        height={16}
                        className="mr-1"
                      />
                      <span className="text-yellow-500">5</span>
                    </div>
                    <div className="flex items-center">
                      <Image
                        src="/icons/ct-side.png"
                        alt="CT"
                        width={16}
                        height={16}
                        className="mr-1"
                      />
                      <span className="text-blue-500">8</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">First kills</span>
                  <span className="text-white">10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Clutches won</span>
                  <span className="text-white">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bombs planted</span>
                  <span className="text-white">4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trades</span>
                  <span className="text-white">9</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Round Score */}
        <div className="mb-4 p-4 bg-[#1a1a1a]">
          <div className="flex flex-wrap gap-2">
            {roundResults.map((round, index) => (
              <div
                key={index}
                className="relative w-8 h-8 flex items-center justify-center"
              >
                <div
                  className={`absolute inset-0 ${round.winner === 0 ? "bg-blue-500/20" : "bg-yellow-500/20"} rounded`}
                ></div>
                <Image
                  src={`/icons/${
                    round.type === "T_WIN"
                      ? "terrorist-win.png"
                      : round.type === "CT_WIN"
                        ? "ct-win.png"
                        : round.type === "BOMB_EXPLODED"
                          ? "bomb-exploded.png"
                          : round.type === "BOMB_DEFUSED"
                            ? "bomb-defused.png"
                            : "timeout.png"
                  }`}
                  alt={round.type}
                  width={20}
                  height={20}
                  className="relative z-10"
                />
                <span className="absolute -bottom-5 text-xs text-gray-400">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Player Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          {teams.map((team, teamIndex) => (
            <div
              key={team.name}
              className={`flex flex-col ${teamIndex === 0 ? "mb-4 md:mb-0" : ""}`}
            >
              {/* Team name bar */}
              <div
                className="flex items-center gap-2 p-3 mb-[1px]"
                style={{ backgroundColor: "hsla(25, 70%, 20%, 0.7)" }}
              >
                <Image
                  src={
                    teamIndex === 0
                      ? "https://stats.kanaliiga.fi/img/S14_1997.png"
                      : "https://stats.kanaliiga.fi/img/S14_1999.png"
                  }
                  alt={team.name}
                  className="w-6 h-6"
                  width={24}
                  height={24}
                />
                <h2 className="text-base font-bold text-orange-400">
                  {team.name}
                </h2>
              </div>

              {/* Stats header */}
              <div
                className="grid grid-cols-[2fr_repeat(7,1fr)] items-center text-xs text-gray-400 py-2 px-3 sticky top-0"
                style={{ backgroundColor: "hsla(25, 70%, 20%, 0.7)" }}
              >
                <div className="text-left">PLAYER</div>
                <div className="text-center">K</div>
                <div className="text-center">D</div>
                <div className="text-center">+/-</div>
                <div className="text-center">ADR</div>
                <div className="text-center sm:hidden md:block">MAX K/S</div>
                <div className="text-center sm:hidden md:block">Ø</div>
                <div className="text-center sm:hidden md:block">KANARATING</div>
              </div>

              {/* Mobile Headers - only player columns */}
              <div
                className="grid sm:hidden grid-cols-[2fr_repeat(3,1fr)] text-xs text-gray-400 p-2"
                style={{ backgroundColor: "hsla(25, 70%, 20%, 0.7)" }}
              >
                <div>PLAYER</div>
                <div className="text-center">K</div>
                <div className="text-center">D</div>
                <div className="text-center">ADR</div>
              </div>

              {team.players.map((player) => (
                <React.Fragment key={player.name}>
                  {/* Desktop Row */}
                  <div className="hidden sm:grid grid-cols-[2fr_repeat(7,1fr)] py-2 px-3 border-b border-gray-800 text-xs items-center">
                    <div className="text-left font-bold">{player.name}</div>
                    <div className="text-center">{player.kills}</div>
                    <div className="text-center">{player.deaths}</div>
                    <div
                      className={`text-center ${player.killDiff >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {player.killDiff >= 0
                        ? `+${player.killDiff}`
                        : player.killDiff}
                    </div>
                    <div className="text-center">{player.adr}</div>
                    <div className="text-center sm:hidden md:block">
                      {player.maxKills}
                    </div>
                    <div className="text-center sm:hidden md:block">
                      {player.rating}%
                    </div>
                    <div className="text-center sm:hidden md:block">
                      {(Math.random() * 0.6 + 0.7).toFixed(2)}
                    </div>
                  </div>

                  {/* Mobile Row */}
                  <div className="grid sm:hidden grid-cols-[2fr_repeat(3,1fr)] py-2 px-3 border-b border-gray-800 text-xs items-center">
                    <div className="text-left font-bold">{player.name}</div>
                    <div className="text-center">{player.kills}</div>
                    <div className="text-center">{player.deaths}</div>
                    <div className="text-center">{player.adr}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>

        {/* Top Players */}
        <div className="mt-8 max-w-[600px]">
          <h2 className="text-xl font-bold text-orange-400 mb-4">
            TOP PLAYERS
          </h2>
          <div className="bg-[#1a1a1a] rounded-sm">
            <div className="grid grid-cols-[1.5fr_1fr_auto] gap-4 p-4">
              <div className="text-gray-400 text-sm">Award</div>
              <div className="text-gray-400 text-sm">Player</div>
              <div className="text-gray-400 text-sm text-right">Score</div>
              {topPlayers.map((award, index) => (
                <React.Fragment key={index}>
                  <div className="text-gray-400 text-sm">{award.award}</div>
                  <div className="flex items-center gap-2">
                    <Image
                      src={
                        award.team === 0
                          ? "https://stats.kanaliiga.fi/img/S14_1997.png"
                          : "https://stats.kanaliiga.fi/img/S14_1999.png"
                      }
                      alt="team"
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    <span className="text-white text-sm">{award.player}</span>
                  </div>
                  <div className="text-white text-sm text-right">
                    {award.score}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
