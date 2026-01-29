import { LeetifyResponse } from "@eggosystem/types";
import { http, HttpResponse } from "msw";
import {
  heppajpgSteamId,
  HoolyzSteamId,
  RealPlayer1SteamId,
  RealPlayer2SteamId,
  RealPlayer3SteamId,
  AabeSteamId,
  QuattraSteamId,
  TrevSteamId,
  PrivateProfilePlayerSteamId,
  NoFaceitRankPlayerSteamId,
  ValidWorkEmail1SteamId,
  ValidWorkEmail2SteamId,
  ValidWorkEmail3SteamId,
  ValidWorkEmail4SteamId,
  ValidWorkEmail5SteamId,
  EligiblePlayerForValidationSteamId,
  ManualRankTargetSteamId
} from "@eggosystem/types";

const createLeetifyResponse = (
  skillLevel: number,
  rankType: number | null = 11,
  isCs2 = true,
  gameFinishedAt = new Date().toISOString()
) => {
  return {
    dataSource: "matchmaking" as const,
    rankType,
    skillLevel,
    isCs2,
    gameFinishedAt
  } satisfies LeetifyResponse["games"][number];
};

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
          games: [createLeetifyResponse(15000, 11, true)]
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

      if (
        steamId === leetifyNoPremierRankSteamId ||
        steamId === ManualRankTargetSteamId
      ) {
        return HttpResponse.json({
          games: []
        } satisfies LeetifyResponse);
      }

      if (steamId === leetifyInvalidGameDataSteamId) {
        return HttpResponse.json({
          games: [
            createLeetifyResponse(1500, null, true, "2024-01-01T00:00:00Z")
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
            createLeetifyResponse(15000, 11, true, now.toISOString()),
            createLeetifyResponse(17000, 11, true, yesterday.toISOString())
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
            createLeetifyResponse(23000, 11, true, new Date().toISOString()),
            createLeetifyResponse(
              21000,
              11,
              true,
              oneAndHalfYearAgoAndADayBelow.toISOString()
            ),
            createLeetifyResponse(
              21000,
              11,
              true,
              oneAndHalfYearAgoAndADayAbove.toISOString()
            )
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
            createLeetifyResponse(23000, 11, true, new Date().toISOString())
          ]
        } satisfies LeetifyResponse);
      }

      if (steamId === heppajpgSteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(15, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === HoolyzSteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(18, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === RealPlayer1SteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(12, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === RealPlayer2SteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(14, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === RealPlayer3SteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(16, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === AabeSteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(20, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === QuattraSteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(17, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === TrevSteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(11, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === PrivateProfilePlayerSteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(15, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === NoFaceitRankPlayerSteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(13, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === ValidWorkEmail1SteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(15, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === ValidWorkEmail2SteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(18, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === ValidWorkEmail3SteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(14, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === ValidWorkEmail4SteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(19, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === ValidWorkEmail5SteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(16, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      if (steamId === EligiblePlayerForValidationSteamId) {
        return HttpResponse.json({
          games: [createLeetifyResponse(20, 11, true, new Date().toISOString())]
        } satisfies LeetifyResponse);
      }

      // Test Steam ID for partial data bug test (FaceIT rank in DB, AppIdRank and hours from API)
      if (steamId === "77777777777777777") {
        return HttpResponse.json({
          games: [
            createLeetifyResponse(16000, 11, true, new Date().toISOString())
          ]
        } satisfies LeetifyResponse);
      }

      // Test Steam ID for partial data bug test (hours in DB, AppIdRank and FaceIT rank from API)
      if (steamId === "66666666666666666") {
        return HttpResponse.json({
          games: [
            createLeetifyResponse(17000, 11, true, new Date().toISOString())
          ]
        } satisfies LeetifyResponse);
      }

      // Default success response
      return HttpResponse.json({
        games: [
          createLeetifyResponse(23430, 11, true, new Date().toISOString()),
          createLeetifyResponse(2333, null, true, new Date().toISOString())
        ]
      } satisfies LeetifyResponse);
    }
  )
];
