import { type InsertSeason } from "@eggosystem/types";
import { buildInsertQueryParts } from "../db/utils";
import { runQuery } from "../db/mysqlRunQuery";
import { validSignupData } from "./fixtures/signupFormData";

export const insertTestSeason = (data: InsertSeason) => {
  const insertQuery = buildInsertQueryParts(data);
  return runQuery(
    `INSERT IGNORE INTO Seasons (${insertQuery.columns.join(", ")}) VALUES (${insertQuery.placeholders})`,
    insertQuery.values
  );
};

export const insertAccountWithSteamId = async (
  accountId: number,
  steamId: string,
  nickname: string,
  fullName: string,
  workEmail: string,
  discord?: string
) => {
  const accountInsertQuery = buildInsertQueryParts({
    id: accountId,
    full_name: fullName,
    work_email: workEmail,
    discord
  });
  const account = await runQuery<{ insertId: number }>(
    `INSERT INTO Accounts (${accountInsertQuery.columns.join(", ")}, work_email_verified) VALUES (${accountInsertQuery.placeholders}, ?)`,
    [...accountInsertQuery.values, true]
  );
  const steamPlayerInsert = buildInsertQueryParts({
    steam_id: steamId,
    nickname,
    account_id: accountId
  });
  await runQuery<{ insertId: number }>(
    `INSERT INTO SteamPlayers (${steamPlayerInsert.columns.join(", ")}) VALUES (${steamPlayerInsert.placeholders})`,
    steamPlayerInsert.values
  );
  await runQuery<{ insertId: number }>(
    "INSERT INTO LinkedAccounts (account_id, provider_id, provider) VALUES (?, ?, ?)",
    [account.insertId, steamId, "steam"]
  );
};

export const insertAccountPrivacyPolicyAccepted = async (accountId: number) => {
  await runQuery<{ insertId: number }>(
    "INSERT INTO UserPolicyAcceptances (account_id, accepted_privacy_policy) VALUES (?, ?)",
    [accountId, true]
  );
};

export const insertOneTestUser = async (
  accountId: number,
  steamId: string,
  nickname: string,
  discord?: string
) => {
  await insertAccountWithSteamId(
    accountId,
    steamId,
    nickname,
    nickname,
    nickname.replace(" ", "_").concat("@kanaliiga.org"),
    discord
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
      player.nickname.replace(" ", "_").concat("@kanaliiga.org"),
      player.discord
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

export const cleanupTestUserApprovals = async (steamId: string) => {
  await runQuery("DELETE FROM SeasonPlayerApprovals WHERE steam_id = ?", [
    steamId
  ]);
};

export const cleanUpTestUser = async (accountId: number) => {
  await runQuery("DELETE FROM SteamPlayers WHERE account_id = ?", [accountId]);
  await runQuery("DELETE FROM Accounts WHERE id = ?", [accountId]);
};

export const removeTestSeason = async (seasonId: number) => {
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
    await setSeasonTeamPlayer(player.steamId, seasonId, teamId);
  }
};

export const setSeasonTeamPlayer = async (
  steamId: string,
  seasonId?: number,
  teamId?: number
) => {
  await runQuery(
    "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id) VALUES (?, ?, ?)",
    [seasonId ?? 1, validSignupData.teamId ?? teamId, steamId]
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

export const setCaptainEditRegistrationForAccountId = async (
  accountId: number,
  seasonId?: number
) => {
  const [permission] = await runQuery<[{ id: number }]>(
    "SELECT id FROM Permissions WHERE permission_name = ?",
    ["edit-registration"]
  );
  const [role] = await runQuery<[{ id: number }]>(
    "SELECT id from Roles WHERE role_name = ?",
    ["captain"]
  );
  await runQuery(
    "INSERT INTO AccountPermissionScopes (season_id, team_id, account_id, permission_id) VALUES (?, ?, ?, ?)",
    [seasonId ?? 1, validSignupData.teamId, accountId, permission.id]
  );
  await runQuery(
    "INSERT IGNORE INTO AccountRoles (account_id, role_id, game_id) VALUES (?, ?, ?)",
    [accountId, role.id, 1]
  );
};

export const insertRogueTeam = (teamName?: string) => {
  return runQuery<{ insertId: number }>("INSERT INTO Teams (name) VALUES (?)", [
    teamName ?? "Testing team"
  ]);
};

export const clearRogueTeam = (teamName?: string) => {
  return runQuery<{ insertId: number }>("DELETE FROM Teams WHERE name = ?", [
    teamName ?? "Testing team"
  ]);
};

export const clearOrganization = (orgId?: number) => {
  if (orgId) {
    return runQuery("DELETE FROM Organizations WHERE id = ?", [orgId]);
  }
};
