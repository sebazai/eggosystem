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
  EligiblePlayerForValidationSteamId,
  DraftReturnUserSteamId,
  ApprovalOnlySubmitSteamId,
  ManualApprovalTargetSteamId,
  ManualRankTargetSteamId,
  AddTeamSignupSteamId1,
  AddTeamSignupSteamId2,
  AddTeamSignupSteamId3,
  AddTeamSignupSteamId4,
  AddTeamSignupSteamId5,
  ConfigurableReqsExternalRankMissingSteamId
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
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 7));
    }

    if (gamePlayerId === faceitValidSteamIdDecayed) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 7));
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
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
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

    // E2E critical-workflow IDs (S2, S3, A1, A2)
    if (gamePlayerId === DraftReturnUserSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }
    if (gamePlayerId === ApprovalOnlySubmitSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }
    if (gamePlayerId === ManualApprovalTargetSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }
    if (gamePlayerId === ManualRankTargetSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }
    // S1-AC-4 "Configurable signup requirements" – external rank missing.
    // Returning skill_level=0 mirrors a player who has signed up to FACEIT
    // but has not been levelled yet; the backend forwards faceit_level=0 to
    // the frontend and the form records externalRank=0.
    if (gamePlayerId === ConfigurableReqsExternalRankMissingSteamId) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 0, 0));
    }

    // A5 add-team signup only
    if (gamePlayerId === AddTeamSignupSteamId1) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }
    if (gamePlayerId === AddTeamSignupSteamId2) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }
    if (gamePlayerId === AddTeamSignupSteamId3) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }
    if (gamePlayerId === AddTeamSignupSteamId4) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }
    if (gamePlayerId === AddTeamSignupSteamId5) {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1500, 10));
    }

    // Test Steam ID for partial data bug test (AppIdRank in DB, hours and FaceIT rank from API)
    if (gamePlayerId === "88888888888888888") {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1600, 9));
    }

    // Test Steam ID for partial data bug test (FaceIT rank in DB, AppIdRank and hours from API)
    if (gamePlayerId === "77777777777777777") {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1600, 9));
    }

    // Test Steam ID for partial data bug test (hours in DB, AppIdRank and FaceIT rank from API)
    if (gamePlayerId === "66666666666666666") {
      return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1600, 9));
    }

    //Default success response CS2
    return HttpResponse.json(createFaceitRank(gamePlayerId, "cs2", 1301, 6));
  })
];
