import { http, HttpResponse } from "msw";
import { ISteamUserResponse } from "@eggosystem/types";

const players = [
  {
    accountId: 99999,
    steamId: "12345678901234566",
    nickname: "Player One",
    discord: "playerOne#1234",
    captain: true
  },
  {
    accountId: 99998,
    steamId: "12345678901234567",
    nickname: "Player Two",
    discord: "playerTwo#1234",
    coCaptain: true
  },
  {
    accountId: 99997,
    steamId: "12345678901234568",
    nickname: "Player Three"
  },
  {
    accountId: 99996,
    steamId: "12345678901234569",
    nickname: "Player Four"
  },
  {
    accountId: 99995,
    steamId: "12345678901234570",
    nickname: "Player Five"
  }
];

export const getPlayerSummariesHandlers = [
  http.get(
    "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/**",
    ({ request }) => {
      const url = new URL(request.url);
      const steamids = url.searchParams.get("steamids");
      const defaultPlayers = players.map((player) => {
        return { steamid: player.steamId, communityvisibilitystate: 3 };
      });

      if (steamids?.includes("11111111111111115")) {
        return HttpResponse.json({
          response: {
            players: [
              { steamid: "11111111111111115", communityvisibilitystate: 1 }
            ]
          }
        });
      }
      return HttpResponse.json({
        response: {
          players: defaultPlayers
        }
      } satisfies ISteamUserResponse);
    }
  )
];
