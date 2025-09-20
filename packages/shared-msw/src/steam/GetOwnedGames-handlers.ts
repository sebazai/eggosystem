import { http, HttpResponse } from "msw";
import {
  IPlayerServiceResponse,
  InsufficientHoursPlayerSteamId,
  RaceConditionPlayerSteamId
} from "@eggosystem/types";

export const getOwnedGamesHandlers = [
  http.get(
    "http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/",
    ({ request }) => {
      const url = new URL(request.url);
      const steam_id = url.searchParams.get("steamid");
      if (
        steam_id === InsufficientHoursPlayerSteamId ||
        steam_id === RaceConditionPlayerSteamId
      ) {
        return HttpResponse.json({
          response: {
            games: []
          }
        } satisfies IPlayerServiceResponse);
      }

      // season-team-registration.services.test.ts
      if (
        steam_id === "11111111111111111" ||
        steam_id === "11111111111111112" ||
        steam_id === "11111111111111113" ||
        steam_id === "11111111111111114" ||
        steam_id === "12345678901234570"
      ) {
        return HttpResponse.json({
          response: {
            games: [
              {
                appid: 730,
                playtime_forever: 6720
              }
            ]
          }
        } satisfies IPlayerServiceResponse);
      }

      return HttpResponse.json({
        response: {
          games: [
            {
              appid: 730,
              playtime_forever: 90000
            }
          ]
        }
      } satisfies IPlayerServiceResponse);
    }
  )
];
