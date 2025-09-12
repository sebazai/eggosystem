import { http, HttpResponse } from "msw";
import {
  faceitValidSteamId,
  faceitValidSteamIdDecayed,
  faceitCs2EmptyMetadataSteamId
} from "./test-ids.js";

import { NoFaceitRankPlayerSteamId } from "@eggosystem/types";

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
        return HttpResponse.json(createFaceitMetadataLastGame(1713542400000));
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
        return HttpResponse.json(
          createFaceitMetadataPlayerStatsGame(undefined, undefined)
        );
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

      // Default success response
      return HttpResponse.json(
        createFaceitMetadataPlayerStatsGame("1.35", "453")
      );
    }
  )
];
