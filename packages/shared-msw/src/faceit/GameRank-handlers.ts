import { http, HttpResponse } from "msw";
import {
  faceitInvalidGameDataSteamId,
  faceitInvalidJsonSteamId,
  faceitNetworkErrorSteamId,
  faceitNotFoundSteamId,
  faceitValidSteamId,
  faceitValidSteamIdDecayed,
  faceitCs2EmptyMetadataSteamId
} from "./test-ids.js";
import { FaceitPlayerDetails } from "@eggosystem/types";
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
  EligiblePlayerForValidationSteamId
} from "@eggosystem/types";

const createFaceitRank = (
  player_id: string,
  game: string,
  elo: number | undefined,
  level: number | undefined,
  nickname?: string
): FaceitPlayerDetails => {
  return {
    player_id,
    games: {
      [game]: {
        faceit_elo: Number(elo),
        skill_level: Number(level)
      }
    },
    faceit_url: `https://faceit.com/players/${player_id}`,
    nickname: nickname ?? "Test Player"
  };
};

export const faceitPlayerGameRankHandlers = [
  http.get("https://open.faceit.com/data/v4/players", ({ request }) => {
    const url = new URL(request.url);
    const gamePlayerId = url.searchParams.get("game_player_id");
    if (!gamePlayerId) {
      return new HttpResponse("Bad Request", { status: 400 });
    }
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

    if (gamePlayerId === faceitValidSteamIdDecayed) {
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

    if (gamePlayerId === faceitCs2EmptyMetadataSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1800, 8));
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
      return new HttpResponse("Not found", { status: 404 });
    }

    if (gamePlayerId === "11111111111111112") {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1301, 6));
    }

    if (gamePlayerId === "11111111111111114" && game === "csgo") {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "csgo", 2700, 9));
    }

    if (gamePlayerId === heppajpgSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }

    if (gamePlayerId === HoolyzSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }

    if (gamePlayerId === RealPlayer1SteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }

    if (gamePlayerId === RealPlayer2SteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }

    if (gamePlayerId === RealPlayer3SteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }

    if (gamePlayerId === AabeSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }

    if (gamePlayerId === QuattraSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }

    if (gamePlayerId === TrevSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }

    if (gamePlayerId === PrivateProfilePlayerSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }

    if (gamePlayerId === NoFaceitRankPlayerSteamId) {
      return HttpResponse.json(
        createFaceitRank(gamePlayerId, "cs2", undefined, undefined)
      );
    }

    if (gamePlayerId === ValidWorkEmail1SteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1400, 8));
    }

    if (gamePlayerId === ValidWorkEmail2SteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1600, 9));
    }

    if (gamePlayerId === ValidWorkEmail3SteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1300, 7));
    }

    if (gamePlayerId === ValidWorkEmail4SteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1700, 10));
    }

    if (gamePlayerId === ValidWorkEmail5SteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1450, 8));
    }
    if (gamePlayerId === EligiblePlayerForValidationSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1800, 10));
    }

    //Default success response CS2
    return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1301, 6));
  })
];
