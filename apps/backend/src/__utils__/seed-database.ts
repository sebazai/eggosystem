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
    `INSERT INTO Accounts (${accountInsertQuery.columns.join(", ")}) VALUES (${accountInsertQuery.placeholders})`,
    accountInsertQuery.values
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
    await runQuery("DELETE FROM Accounts WHERE id = ?", [player.accountId]);
  }
};
export const removeTestSeason = async (seasonId: number) => {
  await runQuery("DELETE FROM Seasons WHERE id = ?", [seasonId]);
};
