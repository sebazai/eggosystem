/**
 * E2E Test Data for SignupForm and other tests
 * This data is used by both the backend seed files and MSW handlers
 */

import {
  AabeSteamId,
  AddTeamSignupSteamId1,
  AddTeamSignupSteamId2,
  AddTeamSignupSteamId3,
  AddTeamSignupSteamId4,
  AddTeamSignupSteamId5,
  ApprovalOnlySubmitSteamId,
  DraftReturnUserSteamId,
  EligiblePlayerForValidationSteamId,
  heppajpgSteamId,
  HoolyzSteamId,
  IncompleteDetailsPlayerSteamId,
  InsufficientHoursPlayerSteamId,
  ManualApprovalTargetSteamId,
  ManualRankTargetSteamId,
  NoFaceitRankPlayerSteamId,
  PrivateProfilePlayerSteamId,
  QuattraSteamId,
  RaceConditionPlayerSteamId,
  RealPlayer1SteamId,
  RealPlayer2SteamId,
  RealPlayer3SteamId,
  TrevSteamId,
  ValidationFailurePlayerSteamId,
  ValidWorkEmail1SteamId,
  ValidWorkEmail2SteamId,
  ValidWorkEmail3SteamId,
  ValidWorkEmail4SteamId,
  ValidWorkEmail5SteamId
} from "./fixtures";

export interface E2ESteamPlayerData {
  account_id: number;
  steam_id: string;
  nickname: string;
  discord?: string | null;
  work_email?: string | null;
  work_email_verified?: number;
  is_work_email_personal_email?: boolean;
}

/**
 * Steam player data used in e2e tests
 * This data represents players with different validation states for testing
 */
export const e2eSteamPlayerData: E2ESteamPlayerData[] = [
  {
    account_id: 15003,
    steam_id: AabeSteamId,
    nickname: "Aabe",
    discord: "aabe#1234"
  },
  {
    account_id: 15004,
    steam_id: heppajpgSteamId,
    nickname: "heppajpg",
    discord: "heppajpg#1234"
  },
  {
    account_id: 15005,
    steam_id: QuattraSteamId,
    nickname: "Quattra",
    work_email: "test+15005@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false, // Changed to false so validation passes
    discord: "quattra#1234"
  },
  {
    account_id: 15006,
    steam_id: TrevSteamId,
    nickname: "Trev",
    work_email_verified: 0,
    discord: "trev#1234"
  },
  {
    account_id: 15008,
    steam_id: HoolyzSteamId,
    nickname: "Hoolyz",
    discord: "hoolyz#1234"
  },
  {
    account_id: 15009,
    steam_id: RealPlayer1SteamId,
    nickname: "RealPlayer1",
    discord: "realplayer1#1234"
  },
  {
    account_id: 15010,
    steam_id: RealPlayer2SteamId,
    nickname: "RealPlayer2",
    discord: "realplayer2#1234"
  },
  {
    account_id: 15011,
    steam_id: RealPlayer3SteamId,
    nickname: "RealPlayer3",
    discord: "realplayer3#1234"
  },
  {
    account_id: 15001,
    steam_id: PrivateProfilePlayerSteamId,
    nickname: "PrivateProfilePlayer",
    discord: "privateprofileplayer#1234"
  },
  {
    account_id: 15002,
    steam_id: InsufficientHoursPlayerSteamId,
    nickname: "InsufficientHoursPlayer"
  },
  {
    account_id: 15012,
    steam_id: IncompleteDetailsPlayerSteamId,
    nickname: "IncompleteDetailsPlayer"
  },
  {
    account_id: 15013,
    steam_id: RaceConditionPlayerSteamId,
    nickname: "RaceConditionPlayer"
  },
  {
    account_id: 15014,
    steam_id: NoFaceitRankPlayerSteamId,
    nickname: "NoFaceitRankPlayer"
  },
  // New players with valid work emails for signup form tests
  {
    account_id: 15007,
    steam_id: ValidWorkEmail1SteamId,
    nickname: "ValidWorkEmail1",
    work_email: "test+15007@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "validworkemail1#1234"
  },
  {
    account_id: 15015,
    steam_id: ValidWorkEmail2SteamId,
    nickname: "ValidWorkEmail2",
    work_email: "test+15015@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "validworkemail2#1234"
  },
  {
    account_id: 15016,
    steam_id: ValidWorkEmail3SteamId,
    nickname: "ValidWorkEmail3",
    work_email: "test+15016@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "validworkemail3#1234"
  },
  {
    account_id: 15017,
    steam_id: ValidWorkEmail4SteamId,
    nickname: "ValidWorkEmail4",
    work_email: "test+15017@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "validworkemail4#1234"
  },
  {
    account_id: 15018,
    steam_id: ValidWorkEmail5SteamId,
    nickname: "ValidWorkEmail5",
    work_email: "test+15018@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "validworkemail5#1234"
  },
  // New players for add player validation tests
  {
    account_id: 15020,
    steam_id: EligiblePlayerForValidationSteamId,
    nickname: "EligiblePlayerForValidation",
    discord: "eligibleplayer#1234"
  },
  {
    account_id: 15021,
    steam_id: ValidationFailurePlayerSteamId,
    nickname: "ValidationFailurePlayer",
    // NOTE: This player will have intentionally incomplete/invalid data for testing multiple validation failures
    work_email: null, // Missing work email
    work_email_verified: 0, // Not verified
    discord: null // Missing discord
  },
  // E2E critical-workflow IDs (S2, S3, A1, A2)
  {
    account_id: 15022,
    steam_id: DraftReturnUserSteamId,
    nickname: "DraftReturnUser",
    work_email: "test+15022@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "draftreturn#1234"
  },
  {
    account_id: 15023,
    steam_id: ApprovalOnlySubmitSteamId,
    nickname: "ApprovalOnlySubmit",
    work_email: null,
    work_email_verified: 0,
    discord: "approvalonly#1234"
  },
  {
    account_id: 15024,
    steam_id: ManualApprovalTargetSteamId,
    nickname: "ManualApprovalTarget",
    work_email: "test+15024@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "manualapproval#1234"
  },
  {
    account_id: 15025,
    steam_id: ManualRankTargetSteamId,
    nickname: "ManualRankTarget",
    work_email: "test+15025@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "manualrank#1234"
  },
  // A5 add-team signup only – dedicated IDs to avoid SeasonPlayerRanks race with other tests
  {
    account_id: 15026,
    steam_id: AddTeamSignupSteamId1,
    nickname: "AddTeam One",
    work_email: "test+15026@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "a5signup1#1234"
  },
  {
    account_id: 15027,
    steam_id: AddTeamSignupSteamId2,
    nickname: "AddTeam Two",
    work_email: "test+15027@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "a5signup2#1234"
  },
  {
    account_id: 15028,
    steam_id: AddTeamSignupSteamId3,
    nickname: "AddTeam Three",
    work_email: "test+15028@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "a5signup3#1234"
  },
  {
    account_id: 15029,
    steam_id: AddTeamSignupSteamId4,
    nickname: "AddTeam Four",
    work_email: "test+15029@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "a5signup4#1234"
  },
  {
    account_id: 15030,
    steam_id: AddTeamSignupSteamId5,
    nickname: "AddTeam Five",
    work_email: "test+15030@kanaliiga.fi",
    work_email_verified: 1,
    is_work_email_personal_email: false,
    discord: "a5signup5#1234"
  }
];

/**
 * Helper function to get Steam player data by Steam ID
 */
export function getE2ESteamPlayerBySteamId(
  steamId: string
): E2ESteamPlayerData | undefined {
  return e2eSteamPlayerData.find((player) => player.steam_id === steamId);
}

/**
 * Helper function to get Steam player data by account ID
 */
export function getE2ESteamPlayerByAccountId(
  accountId: number
): E2ESteamPlayerData | undefined {
  return e2eSteamPlayerData.find((player) => player.account_id === accountId);
}
