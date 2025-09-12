import { http, HttpResponse } from "msw";
import {
  IPlayerServiceResponse,
  InsufficientHoursPlayerSteamId,
  RaceConditionPlayerSteamId
} from "@eggosystem/types";

export const getOwnedGamesHandlers = [
  http.get(
    "http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=:steam_key&steamid=:steam_id",
    ({ params }) => {
      const { steam_id } = params;
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
