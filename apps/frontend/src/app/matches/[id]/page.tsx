import Image from "next/image";
import React from "react";

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

export default function MatchPage() {
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

  // ... existing code ...

  // ... existing code ...

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "hsla(0, 0%, 10%, 0.7)" }}
    >
      <div className="max-w-[1400px] mx-auto p-4">
        <div
          className="p-4 mb-4 flex flex-col sm:flex-row justify-between items-center"
          style={{ backgroundColor: "hsla(25, 70%, 20%, 0.7)" }}
        >
          <h1 className="text-lg font-bold text-orange-500 mb-2 sm:mb-0">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {teams.map((team, teamIndex) => (
            <div
              key={team.name}
              className={`flex flex-col ${teamIndex === 0 ? "mb-8 md:mb-0" : ""}`}
            >
              {/* Team header with stats columns */}
              <div
                className="grid grid-cols-[2fr_repeat(7,1fr)] items-center text-xs text-gray-400 p-2"
                style={{ backgroundColor: "hsla(25, 70%, 20%, 0.7)" }}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Image
                    src={
                      teamIndex === 0
                        ? "https://stats.kanaliiga.fi/img/S14_1997.png"
                        : "https://stats.kanaliiga.fi/img/S14_1999.png"
                    }
                    alt={team.name}
                    className="w-4 h-4 flex-shrink-0"
                    width={16}
                    height={16}
                  />
                  <h2 className="text-sm font-bold text-orange-400 truncate">
                    {team.name}
                  </h2>
                </div>
                <div className="text-center">K</div>
                <div className="text-center">D</div>
                <div className="text-center">+/-</div>
                <div className="text-center">ADR</div>
                <div className="text-center sm:hidden md:block">MAX K/S</div>
                <div className="text-center sm:hidden md:block">Ø</div>
                <div className="text-center sm:hidden md:block">KANARATING</div>
              </div>

              {/* Mobile Headers - only player columns */}
              <div className="grid sm:hidden grid-cols-[2fr_repeat(3,1fr)] text-xs text-gray-400 p-2">
                <div>PLAYER</div>
                <div className="text-center">K</div>
                <div className="text-center">D</div>
                <div className="text-center">ADR</div>
              </div>

              {team.players.map((player, index) => (
                <React.Fragment key={player.name}>
                  {/* Desktop Row */}
                  <div className="hidden sm:grid grid-cols-[2fr_repeat(7,1fr)] py-2 border-b border-gray-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{player.name}</span>
                      <span className="text-xs text-gray-500">
                        {player.country}
                      </span>
                    </div>
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
                  <div className="grid sm:hidden grid-cols-[2fr_repeat(3,1fr)] py-2 border-b border-gray-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{player.name}</span>
                      <span className="text-xs text-gray-500">
                        {player.country}
                      </span>
                    </div>
                    <div className="text-center">{player.kills}</div>
                    <div className="text-center">{player.deaths}</div>
                    <div className="text-center">{player.adr}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
