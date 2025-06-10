import { http, HttpResponse } from "msw";
import {
  faceitInvalidGameDataSteamId,
  faceitInvalidJsonSteamId,
  faceitNetworkErrorSteamId,
  faceitNotFoundSteamId,
  faceitValidSteamId
} from "./test-ids";

export const faceitPlayerGameRankHandlers = [
  http.get("https://open.faceit.com/data/v4/players", ({ request }) => {
    const url = new URL(request.url);
    const gamePlayerId = url.searchParams.get("game_player_id");
    const game = url.searchParams.get("game");

    if (gamePlayerId === faceitValidSteamId) {
      return HttpResponse.json({
        games: {
          cs2: {
            faceit_elo: 1500,
            skill_level: 7
          }
        },
        player_id: gamePlayerId
      });
    }

    if (gamePlayerId === faceitNotFoundSteamId) {
      return new HttpResponse("Not found", { status: 404 });
    }

    if (gamePlayerId === faceitNetworkErrorSteamId) {
      return HttpResponse.error();
    }

    if (gamePlayerId === faceitInvalidJsonSteamId) {
      return HttpResponse.text("Invalid JSON");
    }

    if (gamePlayerId === faceitInvalidGameDataSteamId) {
      return HttpResponse.json({ games: { cs2: { invalid: "data" } } });
    }

    // Player with no app ranks
    if (
      gamePlayerId === "11111111111111111" ||
      gamePlayerId === "11111111111111113" ||
      (gamePlayerId === "11111111111111114" && game !== "csgo")
    ) {
      return HttpResponse.json({
        player_id: gamePlayerId,
        games: {}
      });
    }

    if (gamePlayerId === "11111111111111112") {
      return HttpResponse.json({
        // Used to call metadata handler
        player_id: gamePlayerId,
        games: {
          cs2: {
            faceit_elo: "1301",
            skill_level: "6"
          }
        }
      });
    }

    if (gamePlayerId === "11111111111111114" && game === "csgo") {
      return HttpResponse.json({
        player_id: gamePlayerId,
        games: {
          csgo: {
            faceit_elo: "2700",
            skill_level: "9"
          }
        }
      });
    }

    //Default success response CS2
    return HttpResponse.json({
      player_id: gamePlayerId,
      games: {
        cs2: {
          faceit_elo: "1301",
          skill_level: "6"
        }
      }
    });
  })
];
