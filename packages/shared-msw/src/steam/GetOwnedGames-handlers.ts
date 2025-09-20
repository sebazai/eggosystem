import { http, HttpResponse } from "msw";
import {
  IPlayerServiceResponse,
  InsufficientHoursPlayerSteamId,
  RaceConditionPlayerSteamId,
  e2eSteamPlayerData
} from "@eggosystem/types";

export const getOwnedGamesHandlers = [
  http.get(
    "http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/",
    ({ request }) => {
      const url = new URL(request.url);
      const steam_id = url.searchParams.get("steamid");

      if (!steam_id) {
        return new HttpResponse("Bad Request MSW", { status: 400 });
      }

      // Players with insufficient hours (should return empty games array)
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

      // Check if this Steam ID exists in our e2e data
      const playerData = e2eSteamPlayerData.find(
        (p) => p.steam_id === steam_id
      );

      if (playerData) {
        // All e2e test players should have CS2 with sufficient hours
        return HttpResponse.json({
          response: {
            games: [
              {
                appid: 730, // CS2 app ID
                playtime_forever: 90000 // 90 hours - sufficient for validation
              }
            ]
          }
        } satisfies IPlayerServiceResponse);
      }

      // Legacy test data for season-team-registration.services.test.ts
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

      // Default response for any other Steam ID
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
