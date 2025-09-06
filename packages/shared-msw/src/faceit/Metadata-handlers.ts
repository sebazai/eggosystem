import { http, HttpResponse } from "msw";
import {
  faceitValidSteamId,
  faceitValidSteamIdDecayed,
  faceitCs2EmptyMetadataSteamId
} from "./test-ids.js";

export const faceitMetadataHandlers = [
  http.get<{ faceit_player_id: string; game: string }>(
    "https://open.faceit.com/data/v4/players/:faceit_player_id/games/:game/stats",
    ({ params }) => {
      const { faceit_player_id, game } = params;

      if (faceit_player_id === faceitValidSteamId) {
        const today = new Date();
        return HttpResponse.json({
          items: [
            {
              stats: {
                "Created At": today.getTime()
              }
            }
          ]
        });
      }

      if (faceit_player_id === faceitValidSteamIdDecayed) {
        const lastMatchSevenMonthsAgo = new Date(
          new Date().getTime() - 7 * 30 * 24 * 60 * 60 * 1000
        ).getTime();
        return HttpResponse.json({
          items: [
            {
              stats: {
                "Created At": lastMatchSevenMonthsAgo
              }
            }
          ]
        });
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
        return HttpResponse.json({
          items: [
            {
              stats: {
                "Created At": threeYearsAgo
              }
            }
          ]
        });
      }

      if (faceit_player_id === "11111111111111112" && game === "cs2") {
        return HttpResponse.json({
          items: [
            {
              stats: {
                "Created At": 1745078400000
              }
            }
          ]
        });
      }

      if (faceit_player_id === "11111111111111114" && game === "csgo") {
        return HttpResponse.json({
          items: [
            {
              stats: {
                "Created At": 1713542400000
              }
            }
          ]
        });
      }

      // Default success response
      return HttpResponse.json({
        items: [
          {
            stats: {
              "Created At": 1745078400000
            }
          }
        ]
      });
    }
  ),
  http.get<{ faceit_player_id: string; game: string }>(
    "https://open.faceit.com/data/v4/players/:faceit_player_id/stats/:game",
    ({ params }) => {
      const { faceit_player_id, game } = params;

      if (faceit_player_id === faceitValidSteamId) {
        return HttpResponse.json({
          lifetime: {
            "Average K/D Ratio": "1.2",
            Matches: "100"
          }
        });
      }

      if (
        faceit_player_id === faceitCs2EmptyMetadataSteamId &&
        game === "cs2"
      ) {
        // CS2 stats for the extraordinary case
        return HttpResponse.json({
          lifetime: {
            "Average K/D Ratio": "1.5",
            Matches: "75"
          }
        });
      }

      if (
        faceit_player_id === faceitCs2EmptyMetadataSteamId &&
        game === "csgo"
      ) {
        // CSGO stats for the fallback case
        return HttpResponse.json({
          lifetime: {
            "Average K/D Ratio": "1.8",
            Matches: "200"
          }
        });
      }

      if (faceit_player_id === "11111111111111112" && game === "cs2") {
        return HttpResponse.json({
          lifetime: {
            "Average K/D Ratio": "1.35",
            Matches: 453
          }
        });
      }

      // Default success response
      return HttpResponse.json({
        lifetime: {
          "Average K/D Ratio": "1.35",
          Matches: 453
        }
      });
    }
  )
];
