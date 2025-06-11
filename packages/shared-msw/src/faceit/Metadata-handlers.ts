import { http, HttpResponse } from "msw";
import { faceitValidSteamId } from "./test-ids";

export const faceitMetadataHandlers = [
  http.get<{ faceit_player_id: string; game: string }>(
    "https://open.faceit.com/data/v4/players/:faceit_player_id/games/:game/stats",
    ({ params }) => {
      const { faceit_player_id, game } = params;

      if (faceit_player_id === faceitValidSteamId) {
        return HttpResponse.json({
          items: [
            {
              stats: {
                "Created At": "2024-01-01T00:00:00Z"
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
