import { http, HttpResponse } from "msw";
import {
  IPlayerServiceResponse,
  InsufficientHoursPlayerSteamId,
  RaceConditionPlayerSteamId,
  ConfigurableReqsHoursMissingSteamId,
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

      // Players with insufficient hours (should return empty games array).
      // S1-AC-4 "Configurable signup requirements" hours-missing target also
      // takes this branch so the backend's `getPlayerHoursForCS` returns
      // hours=-1 — same code path as a player whose Steam profile is not
      // public (signup hours/playtime scenarios).
      if (
        steam_id === InsufficientHoursPlayerSteamId ||
        steam_id === RaceConditionPlayerSteamId ||
        steam_id === ConfigurableReqsHoursMissingSteamId
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

      // Test Steam ID for partial data bug test (AppIdRank in DB, hours and FaceIT rank from API)
      if (steam_id === "88888888888888888") {
        return HttpResponse.json({
          response: {
            games: [
              {
                appid: 730,
                playtime_forever: 7200 // 120 hours = 7200 minutes
              }
            ]
          }
        } satisfies IPlayerServiceResponse);
      }

      // Test Steam ID for partial data bug test (FaceIT rank in DB, AppIdRank and hours from API)
      if (steam_id === "77777777777777777") {
        return HttpResponse.json({
          response: {
            games: [
              {
                appid: 730,
                playtime_forever: 7200 // 120 hours = 7200 minutes
              }
            ]
          }
        } satisfies IPlayerServiceResponse);
      }

      // Test Steam ID for partial data bug test (hours in DB, AppIdRank and FaceIT rank from API)
      if (steam_id === "66666666666666666") {
        return HttpResponse.json({
          response: {
            games: [
              {
                appid: 730,
                playtime_forever: 7200 // 120 hours = 7200 minutes
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
