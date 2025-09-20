/**
 * E2E Test Data for SignupForm and other tests
 * This data is used by both the backend seed files and MSW handlers
 */

import {
  AabeSteamId,
  EligiblePlayerForValidationSteamId,
  heppajpgSteamId,
  HoolyzSteamId,
  IncompleteDetailsPlayerSteamId,
  InsufficientHoursPlayerSteamId,
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
