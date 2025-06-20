import { LeetifyResponse } from "@eggosystem/types";
import { http, HttpResponse } from "msw";

export const leetifyValidSteamId = "76561198000000000";
export const leetifyNotFoundSteamId = "76561198000000001";
export const leetifyNetworkErrorSteamId = "76561198000000002";
export const leetifyInvalidJsonSteamId = "76561198000000003";
export const leetifyNoPremierRankSteamId = "76561198000000004";
export const leetifyInvalidGameDataSteamId = "76561198000000005";
export const leetifyRateLimitSteamId = "76561198000000006";
export const leetifyMultipleGamesSteamId = "76561198000000007";

export const getLeetifyHandlers = [
  http.get(
    "https://api.cs-prod.leetify.com/api/profile/id/**",
    ({ request }) => {
      const url = new URL(request.url);
      const steamId = url.pathname.split("/").pop();

      if (steamId === leetifyValidSteamId) {
        return HttpResponse.json({
          games: [
            {
              dataSource: "matchmaking",
              rankType: 11,
              skillLevel: 15000,
              isCs2: true,
              gameFinishedAt: new Date().toISOString()
            }
          ]
        } satisfies LeetifyResponse);
      }

      if (steamId === leetifyNotFoundSteamId) {
        return new HttpResponse("Not found", { status: 404 });
      }

      if (steamId === leetifyNetworkErrorSteamId) {
        return HttpResponse.error();
      }

      if (steamId === leetifyInvalidJsonSteamId) {
        return HttpResponse.text("Invalid JSON");
      }

      if (steamId === leetifyNoPremierRankSteamId) {
        return HttpResponse.json({
          games: []
        } satisfies LeetifyResponse);
      }

      if (steamId === leetifyInvalidGameDataSteamId) {
        return HttpResponse.json({
          games: [
            {
              dataSource: "faceit",
              rankType: null,
              skillLevel: null,
              elo: 1500,
              isCs2: true,
              gameFinishedAt: "2024-01-01T00:00:00Z"
            }
          ]
        } satisfies LeetifyResponse);
      }
      if (steamId === leetifyRateLimitSteamId) {
        return new HttpResponse("Too Many Requests", { status: 429 });
      }

      if (steamId === leetifyMultipleGamesSteamId) {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const multipleGamesResponse = {
          games: [
            {
              dataSource: "matchmaking" as const,
              rankType: 11,
              skillLevel: 15000,
              isCs2: true,
              gameFinishedAt: now.toISOString() // Latest
            },
            {
              dataSource: "matchmaking" as const,
              rankType: 11,
              skillLevel: 17000,
              isCs2: true,
              gameFinishedAt: yesterday.toISOString()
            }
          ]
        };
        return HttpResponse.json(multipleGamesResponse);
      }

      // Player with AVG premier skill level 22000 within last year.
      if (steamId === "11111111111111111") {
        const oneAndHalfYearAgoAndADayAbove = new Date();
        oneAndHalfYearAgoAndADayAbove.setFullYear(
          oneAndHalfYearAgoAndADayAbove.getFullYear() - 1
        );
        oneAndHalfYearAgoAndADayAbove.setMonth(
          oneAndHalfYearAgoAndADayAbove.getMonth() - 6
        );
        oneAndHalfYearAgoAndADayAbove.setDate(
          oneAndHalfYearAgoAndADayAbove.getDate() - 1
        );
        const oneAndHalfYearAgoAndADayBelow = new Date();
        oneAndHalfYearAgoAndADayBelow.setFullYear(
          oneAndHalfYearAgoAndADayBelow.getFullYear() - 1
        );
        oneAndHalfYearAgoAndADayBelow.setMonth(
          oneAndHalfYearAgoAndADayBelow.getMonth() - 6
        );
        oneAndHalfYearAgoAndADayBelow.setDate(
          oneAndHalfYearAgoAndADayBelow.getDate() + 1
        );
        return HttpResponse.json({
          games: [
            {
              isCs2: true,
              dataSource: "matchmaking",
              rankType: 11,
              skillLevel: 23000,
              gameFinishedAt: new Date().toISOString()
            },
            {
              isCs2: true,
              dataSource: "matchmaking",
              rankType: 11,
              skillLevel: 21000,
              gameFinishedAt: oneAndHalfYearAgoAndADayBelow.toISOString()
            },
            {
              isCs2: true,
              dataSource: "matchmaking",
              rankType: 11,
              skillLevel: 21000,
              gameFinishedAt: oneAndHalfYearAgoAndADayAbove.toISOString()
            }
          ]
        } satisfies LeetifyResponse);
      }

      // No premier rank players
      if (steamId === "11111111111111112" || steamId === "11111111111111113") {
        return HttpResponse.json({
          games: []
        } satisfies LeetifyResponse);
      }

      if (steamId === "11111111111111114") {
        return HttpResponse.json({
          games: [
            {
              isCs2: true,
              dataSource: "matchmaking",
              rankType: 11,
              skillLevel: 23000,
              gameFinishedAt: new Date().toISOString()
            }
          ]
        } satisfies LeetifyResponse);
      }

      // Default success response
      return HttpResponse.json({
        games: [
          {
            isCs2: true,
            dataSource: "matchmaking",
            rankType: 11,
            skillLevel: 23430,
            gameFinishedAt: new Date().toISOString()
          },
          {
            isCs2: true,
            dataSource: "faceit",
            elo: 2333,
            rankType: null,
            skillLevel: null,
            gameFinishedAt: new Date().toISOString()
          }
        ]
      } satisfies LeetifyResponse);
    }
  )
];
