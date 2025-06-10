import { http, HttpResponse } from "msw";
import { IPlayerServiceResponse } from "@eggosystem/types";

export const getOwnedGamesHandlers = [
  http.get(
    "http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/**",
    () => {
      return HttpResponse.json({
        response: {
          games: [
            {
              appid: 730,
              playtime_forever: 6747
            }
          ]
        }
      } satisfies IPlayerServiceResponse);
    }
  )
];
