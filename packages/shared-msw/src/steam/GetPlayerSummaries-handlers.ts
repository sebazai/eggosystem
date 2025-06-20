import { http, HttpResponse } from "msw";
import { ISteamUserResponse } from "@eggosystem/types";
import { validSignupData } from "../fixtures";

export const getPlayerSummariesHandlers = [
  http.get(
    "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/**",
    ({ request }) => {
      const url = new URL(request.url);
      const steamids = url.searchParams.get("steamids");
      const defaultPlayers = validSignupData.players.map((player) => {
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
