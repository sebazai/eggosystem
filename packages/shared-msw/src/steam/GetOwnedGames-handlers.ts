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
