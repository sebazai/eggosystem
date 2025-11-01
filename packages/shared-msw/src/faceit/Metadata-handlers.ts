import { http, HttpResponse } from "msw";
import {
  faceitValidSteamId,
  faceitValidSteamIdDecayed,
  faceitCs2EmptyMetadataSteamId
} from "./test-ids.js";

import {
  NoFaceitRankPlayerSteamId,
  heppajpgSteamId,
  HoolyzSteamId,
  RealPlayer1SteamId,
  RealPlayer2SteamId,
  RealPlayer3SteamId,
  AabeSteamId,
  QuattraSteamId,
  TrevSteamId,
  PrivateProfilePlayerSteamId,
  ValidWorkEmail1SteamId,
  ValidWorkEmail2SteamId,
  ValidWorkEmail3SteamId,
  ValidWorkEmail4SteamId,
  ValidWorkEmail5SteamId,
  EligiblePlayerForValidationSteamId
} from "@eggosystem/types";

const createFaceitMetadataPlayerStatsGame = (
  kdr: string | undefined,
  matches_played: string | undefined
) => {
  return {
    lifetime: {
      "Average K/D Ratio": kdr,
      Matches: matches_played
    }
  };
};

const createFaceitMetadataLastGame = (last_game: number) => {
  return {
    items: [
      {
        stats: {
          "Created At": last_game
        }
      }
    ]
  };
};

export const faceitMetadataHandlers = [
  http.get<{ faceit_player_id: string; game: string }>(
    // createFaceitMetadataLastGame
    "https://open.faceit.com/data/v4/players/:faceit_player_id/games/:game/stats",
    ({ params }) => {
      const { faceit_player_id, game } = params;

      if (faceit_player_id === faceitValidSteamId) {
        const today = new Date();
        return HttpResponse.json(createFaceitMetadataLastGame(today.getTime()));
      }

      if (faceit_player_id === faceitValidSteamIdDecayed) {
        const lastMatchSevenMonthsAgo = new Date(
          new Date().getTime() - 7 * 30 * 24 * 60 * 60 * 1000
        ).getTime();
        return HttpResponse.json(
          createFaceitMetadataLastGame(lastMatchSevenMonthsAgo)
        );
      }

      if (
        faceit_player_id === faceitCs2EmptyMetadataSteamId &&
        game === "cs2"
      ) {
        // Extraordinary case: CS2 metadata returns empty items array
        return HttpResponse.json({
          items: []
        });
      }

      if (
        faceit_player_id === faceitCs2EmptyMetadataSteamId &&
        game === "csgo"
      ) {
        // When CS2 metadata is empty, it falls back to CSGO metadata
        // Return a date 3 years in the past
        const threeYearsAgo = new Date(
          new Date().getTime() - 3 * 365 * 24 * 60 * 60 * 1000
        ).getTime();
        return HttpResponse.json(createFaceitMetadataLastGame(threeYearsAgo));
      }

      if (faceit_player_id === "11111111111111112" && game === "cs2") {
        return HttpResponse.json(createFaceitMetadataLastGame(1745078400000));
      }

      if (faceit_player_id === "11111111111111114" && game === "csgo") {
        // Set last match to exactly 15 months ago to trigger 10% decay
        const fifteenMonthsAgo =
          new Date().getTime() - 15 * 30 * 24 * 60 * 60 * 1000;
        return HttpResponse.json(
          createFaceitMetadataLastGame(fifteenMonthsAgo)
        );
      }

      // E2E test Steam IDs - provide recent match dates for all
      const recentMatchTime = new Date().getTime() - 7 * 24 * 60 * 60 * 1000; // 7 days ago

      // NoFaceitRankPlayer should get invalid data to trigger external rank error
      if (faceit_player_id === NoFaceitRankPlayerSteamId) {
        return HttpResponse.json({
          items: [
            {
              stats: {
                "Created At": "invalid-date-string" // This will cause NaN when converted to number
              }
            }
          ]
        });
      }

      if (faceit_player_id === heppajpgSteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === HoolyzSteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === RealPlayer1SteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === RealPlayer2SteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === RealPlayer3SteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === AabeSteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === QuattraSteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === TrevSteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === PrivateProfilePlayerSteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === ValidWorkEmail1SteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === ValidWorkEmail2SteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === ValidWorkEmail3SteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === ValidWorkEmail4SteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === ValidWorkEmail5SteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      if (faceit_player_id === EligiblePlayerForValidationSteamId) {
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      // Test Steam ID for partial data bug test (AppIdRank in DB, hours and FaceIT rank from API)
      if (faceit_player_id === "88888888888888888" && game === "cs2") {
        // Return a recent match date (7 days ago)
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      // Test Steam ID for partial data bug test (FaceIT rank in DB, AppIdRank and hours from API)
      if (faceit_player_id === "77777777777777777" && game === "cs2") {
        // Return a recent match date (7 days ago)
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      // Test Steam ID for partial data bug test (hours in DB, AppIdRank and FaceIT rank from API)
      if (faceit_player_id === "66666666666666666" && game === "cs2") {
        // Return a recent match date (7 days ago)
        return HttpResponse.json(createFaceitMetadataLastGame(recentMatchTime));
      }

      // Default success response
      return HttpResponse.json(
        createFaceitMetadataLastGame(new Date().getTime())
      );
    }
  ),
  http.get<{ faceit_player_id: string; game: string }>(
    // createFaceitMetadataPlayerStatsGame
    "https://open.faceit.com/data/v4/players/:faceit_player_id/stats/:game",
    ({ params }) => {
      const { faceit_player_id, game } = params;

      if (faceit_player_id === NoFaceitRankPlayerSteamId) {
        return HttpResponse.json({
          lifetime: {
            "Average K/D Ratio": "invalid-kdr-string", // This will cause NaN when converted to number
            Matches: "invalid-matches-string" // This will cause NaN when converted to number
          }
        });
      }

      if (
        faceit_player_id === faceitCs2EmptyMetadataSteamId &&
        game === "cs2"
      ) {
        // CS2 stats for the extraordinary case
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.5", "75")
        );
      }

      if (
        faceit_player_id === faceitCs2EmptyMetadataSteamId &&
        game === "csgo"
      ) {
        // CSGO stats for the fallback case
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.8", "200")
        );
      }

      if (faceit_player_id === "11111111111111112" && game === "cs2") {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.35", "453")
        );
      }

      // E2E test Steam IDs - provide valid metadata for all
      if (faceit_player_id === heppajpgSteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.2", "150")
        );
      }

      if (faceit_player_id === HoolyzSteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.1", "120")
        );
      }

      if (faceit_player_id === RealPlayer1SteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.3", "200")
        );
      }

      if (faceit_player_id === RealPlayer2SteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.25", "180")
        );
      }

      if (faceit_player_id === RealPlayer3SteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.15", "160")
        );
      }

      if (faceit_player_id === AabeSteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.4", "250")
        );
      }

      if (faceit_player_id === QuattraSteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.35", "220")
        );
      }

      if (faceit_player_id === TrevSteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.1", "100")
        );
      }

      if (faceit_player_id === PrivateProfilePlayerSteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.2", "140")
        );
      }

      if (faceit_player_id === ValidWorkEmail1SteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.3", "190")
        );
      }

      if (faceit_player_id === ValidWorkEmail2SteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.4", "210")
        );
      }

      if (faceit_player_id === ValidWorkEmail3SteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.25", "170")
        );
      }

      if (faceit_player_id === ValidWorkEmail4SteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.45", "230")
        );
      }

      if (faceit_player_id === ValidWorkEmail5SteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.3", "200")
        );
      }

      if (faceit_player_id === EligiblePlayerForValidationSteamId) {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.5", "300")
        );
      }

      // Test Steam ID for partial data bug test (AppIdRank in DB, hours and FaceIT rank from API)
      if (faceit_player_id === "88888888888888888" && game === "cs2") {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.42", "285")
        );
      }

      // Test Steam ID for partial data bug test (FaceIT rank in DB, AppIdRank and hours from API)
      if (faceit_player_id === "77777777777777777" && game === "cs2") {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.42", "285")
        );
      }

      // Test Steam ID for partial data bug test (hours in DB, AppIdRank and FaceIT rank from API)
      if (faceit_player_id === "66666666666666666" && game === "cs2") {
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame("1.42", "285")
        );
      }

      // Default success response
      return HttpResponse.json(
        createFaceitMetadataPlayerStatsGame("1.35", "453")
      );
    }
  )
];
