import { type InsertSeason } from "@eggosystem/types";
import { buildInsertQueryParts } from "../db/utils";
import { runQuery } from "../db/mysqlRunQuery";
import { type ResultSetHeader } from "mysql2/promise";
import { validSignupData } from "@eggosystem/shared-msw";
import {
  deleteTestSeasonSignupSettings,
  insertTestSeasonSignupSettings
} from "./season-signup-settings-test";
import { insertTestCSSeasonSettings } from "./cs-season-settings-test";

export const insertTestSeason = async (
  data: InsertSeason,
  signupLimits?: { min_players: number; max_players: number },
  csSettings?: Parameters<typeof insertTestCSSeasonSettings>[1]
) => {
  const insertQuery = buildInsertQueryParts(data);
  const result = await runQuery<ResultSetHeader>(
    `INSERT IGNORE INTO Seasons (${insertQuery.columns.join(", ")}) VALUES (${insertQuery.placeholders})`,
    insertQuery.values
  );
  await insertTestSeasonSignupSettings(data.id, signupLimits);
  await insertTestCSSeasonSettings(data.id, csSettings);
  return result;
};

const insertAccountWithSteamId = async (
  accountId: number,
  steamId: string,
  nickname: string,
  fullName: string,
  workEmail: string
) => {
  const accountInsertQuery = buildInsertQueryParts({
    id: accountId,
    full_name: fullName,
    work_email: workEmail
  });
  const account = await runQuery<ResultSetHeader>(
    `INSERT INTO Accounts (${accountInsertQuery.columns.join(", ")}, work_email_verified) VALUES (${accountInsertQuery.placeholders}, ?)`,
    [...accountInsertQuery.values, true]
  );
  const steamPlayerInsert = buildInsertQueryParts({
    steam_id: steamId,
    nickname,
    account_id: accountId
  });
  await runQuery<ResultSetHeader>(
    `INSERT INTO SteamPlayers (${steamPlayerInsert.columns.join(", ")}) VALUES (${steamPlayerInsert.placeholders})`,
    steamPlayerInsert.values
  );
  await runQuery<ResultSetHeader>(
    "INSERT INTO LinkedAccounts (account_id, provider_id, provider) VALUES (?, ?, ?)",
    [account.insertId, steamId, "steam"]
  );
};

const insertAccountPrivacyPolicyAccepted = async (accountId: number) => {
  await runQuery<ResultSetHeader>(
    "INSERT INTO UserPolicyAcceptances (account_id, accepted_privacy_policy) VALUES (?, ?)",
    [accountId, true]
  );
};

export const insertOneTestUser = async (
  accountId: number,
  steamId: string,
  nickname: string
) => {
  await insertAccountWithSteamId(
    accountId,
    steamId,
    nickname,
    nickname,
    nickname.replace(" ", "_").concat("@kanaliiga.org")
  );
  await insertAccountPrivacyPolicyAccepted(accountId);
};

export const insertTestUsersForSignup = async () => {
  for (const player of validSignupData.players) {
    await insertAccountWithSteamId(
      player.accountId,
      player.steamId,
      player.nickname,
      player.nickname,
      player.nickname.replace(" ", "_").concat("@kanaliiga.org")
    );
    await insertAccountPrivacyPolicyAccepted(player.accountId);
  }
};

export const cleanupTestUsers = async () => {
  for (const player of validSignupData.players) {
    await cleanupTestUserApprovals(player.steamId);
    await cleanUpTestUser(player.accountId);
  }
};

const cleanupTestUserApprovals = async (steamId: string) => {
  await runQuery("DELETE FROM SeasonPlayerApprovals WHERE steam_id = ?", [
    steamId
  ]);
};

export const cleanUpTestUser = async (accountId: number) => {
  await runQuery("DELETE FROM SteamPlayers WHERE account_id = ?", [accountId]);
  await runQuery("DELETE FROM Accounts WHERE id = ?", [accountId]);
};

export const removeTestSeason = async (seasonId: number) => {
  await deleteTestSeasonSignupSettings(seasonId);
  await runQuery("DELETE FROM Seasons WHERE id = ?", [seasonId]);
};

export const removeTestOrg = async (orgId: number) => {
  await runQuery("DELETE FROM Organizations WHERE id = ?", [orgId]);
};

export const removeTestTeam = async (teamId: number) => {
  await runQuery("DELETE FROM Teams WHERE id = ?", [teamId]);
};

export const setSeasonTeamRegistration = async (
  seasonId?: number,
  teamId?: number
) => {
  await runQuery(
    "INSERT INTO SeasonTeamRegistrations (season_id, team_id, terms_and_conditions_approved) VALUES (?, ?, ?)",
    [seasonId ?? 1, teamId ?? validSignupData.teamId, true]
  );
};

export const unsetSeasonTeamRegistration = async (
  seasonId?: number,
  teamId?: number
) => {
  await runQuery(
    "DELETE FROM SeasonTeamRegistrations WHERE season_id = ? AND team_id = ?",
    [seasonId ?? 1, teamId ?? validSignupData.teamId]
  );
};

export const setSeasonTeamPlayers = async (
  seasonId?: number,
  teamId?: number
) => {
  for (const player of validSignupData.players) {
    await setSeasonTeamPlayer(
      player.steamId,
      Boolean(player.captain),
      Boolean(player.coCaptain),
      seasonId,
      teamId
    );
  }
};

export const setSeasonTeamPlayer = async (
  steamId: string,
  isCaptain: boolean,
  isCoCaptain: boolean,
  seasonId?: number,
  teamId?: number
) => {
  await runQuery(
    "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, ?, ?)",
    [
      seasonId ?? 1,
      validSignupData.teamId ?? teamId,
      steamId,
      Boolean(isCaptain),
      Boolean(isCoCaptain)
    ]
  );
};

export const clearSeasonPlayerRanks = async (seasonId?: number) => {
  for (const player of validSignupData.players) {
    await runQuery(
      "DELETE FROM SeasonPlayerRanks WHERE season_id = ? AND steam_id = ?",
      [seasonId ?? 1, player.steamId]
    );
  }
};

export const clearTestUserAndRanks = async (
  accountId: number,
  steamId: string,
  seasonId?: number
) => {
  // First, try to find the account_id from steam_id before deleting SteamPlayers
  let foundAccountId: number | undefined;
  try {
    const [steamPlayer] = await runQuery<Array<{ account_id: number }>>(
      "SELECT account_id FROM SteamPlayers WHERE steam_id = ? LIMIT 1",
      [steamId]
    );
    if (steamPlayer) {
      foundAccountId = steamPlayer.account_id;
    }
  } catch {
    // Ignore if query fails
  }

  // Clean up SeasonPlayerRanks for this steam_id and season
  if (seasonId !== undefined) {
    try {
      await runQuery(
        "DELETE FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ?",
        [steamId, seasonId]
      );
    } catch {
      // Ignore if cleanup fails
    }
  }

  // Clean up LinkedAccounts (do this before deleting SteamPlayers to avoid FK issues)
  try {
    await runQuery(
      "DELETE FROM LinkedAccounts WHERE provider_id = ? AND provider = ?",
      [`steam-${steamId}`, "steam"]
    );
  } catch {
    // Ignore if cleanup fails
  }

  // Clean up SteamPlayers
  try {
    await runQuery("DELETE FROM SteamPlayers WHERE steam_id = ?", [steamId]);
  } catch {
    // Ignore if cleanup fails
  }

  // Clean up account(s) - try both the provided accountId and the found accountId
  const accountIdsToClean = new Set([accountId]);
  if (foundAccountId !== undefined && foundAccountId !== accountId) {
    accountIdsToClean.add(foundAccountId);
  }

  for (const id of accountIdsToClean) {
    try {
      // Delete LinkedAccounts by account_id as well
      const linkedAccounts = await runQuery<Array<{ provider_id: string }>>(
        "SELECT provider_id FROM LinkedAccounts WHERE account_id = ? AND provider = ?",
        [id, "steam"]
      );
      for (const linkedAccount of linkedAccounts) {
        try {
          await runQuery(
            "DELETE FROM LinkedAccounts WHERE provider_id = ? AND provider = ?",
            [linkedAccount.provider_id, "steam"]
          );
        } catch {
          // Ignore if cleanup fails
        }
      }
      await cleanUpTestUser(id);
    } catch {
      // Ignore if cleanup fails
    }
  }
};

export const insertRogueTeam = (teamName?: string) => {
  return runQuery<ResultSetHeader>("INSERT INTO Teams (name) VALUES (?)", [
    teamName ?? "Testing team"
  ]);
};

export const clearRogueTeam = (teamName?: string) => {
  return runQuery<ResultSetHeader>("DELETE FROM Teams WHERE name = ?", [
    teamName ?? "Testing team"
  ]);
};

export const clearOrganization = (orgId?: number) => {
  if (orgId) {
    return runQuery("DELETE FROM Organizations WHERE id = ?", [orgId]);
  }
};

export const insertTestKanahautomoRegistration = async (
  steamId: string,
  organizationId: number,
  acceptedTerms: boolean = false
) => {
  return runQuery<ResultSetHeader>(
    "INSERT INTO KanahautomoRegistrations (steam_id, organization_id, accepted_terms) VALUES (?, ?, ?)",
    [steamId, organizationId, acceptedTerms]
  );
};

export const clearTestKanahautomoRegistrations = async () => {
  return runQuery("DELETE FROM KanahautomoRegistrations");
};

export const insertTestOrganization = async (
  name: string,
  organizationCode?: string
) => {
  const code =
    organizationCode ||
    `TEST-ORG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  // Use phash for nologo.png (c163141e6bd36e65) instead of filename
  return runQuery<ResultSetHeader>(
    "INSERT INTO Organizations (name, country, organization_code, logo, website) VALUES (?, ?, ?, ?, ?)",
    [name, "Finland", code, "c163141e6bd36e65", "http://test.org"]
  );
};

export const clearTestOrganization = async (name: string) => {
  return runQuery("DELETE FROM Organizations WHERE name = ?", [name]);
};
