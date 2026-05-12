import { runQuery } from "../db/mysqlRunQuery";
import type { CasterUrl } from "@eggosystem/types";

export const getCasterDefaultUrl = async (
  accountId: number
): Promise<string | null> => {
  const [result] = await runQuery<
    Array<Pick<CasterUrl, "stream_url"> | undefined>
  >(
    `SELECT stream_url FROM AccountCasterUrls WHERE account_id = ? AND is_default = true`,
    [accountId]
  );

  return result?.stream_url ?? null;
};

export const getCasterUrls = async (
  accountId: number
): Promise<CasterUrl[]> => {
  const rows = await runQuery<CasterUrl[]>(
    `SELECT id, account_id, stream_url, is_default, created_at, updated_at
     FROM AccountCasterUrls
     WHERE account_id = ?
     ORDER BY is_default DESC, id ASC`,
    [accountId]
  );
  return rows ?? [];
};

export const addCasterUrl = async (
  accountId: number,
  streamUrl: string
): Promise<CasterUrl> => {
  await runQuery(
    `INSERT INTO AccountCasterUrls (account_id, stream_url, is_default)
     VALUES (?, ?, false)
     ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
    [accountId, streamUrl]
  );

  const [row] = await runQuery<CasterUrl[]>(
    `SELECT * FROM AccountCasterUrls WHERE account_id = ? AND stream_url = ?`,
    [accountId, streamUrl]
  );
  if (!row) {
    throw new Error("Failed to retrieve added caster URL");
  }
  return row;
};

export const deleteCasterUrlById = async (
  accountId: number,
  id: number
): Promise<boolean> => {
  const result = await runQuery<{ affectedRows: number }>(
    `DELETE FROM AccountCasterUrls WHERE account_id = ? AND id = ?`,
    [accountId, id]
  );
  return result.affectedRows > 0;
};

export const setCasterDefaultUrlById = async (
  accountId: number,
  id: number
): Promise<CasterUrl | null> => {
  await runQuery(
    `UPDATE AccountCasterUrls SET is_default = false WHERE account_id = ?`,
    [accountId]
  );
  await runQuery(
    `UPDATE AccountCasterUrls SET is_default = true WHERE account_id = ? AND id = ?`,
    [accountId, id]
  );

  const [row] = await runQuery<CasterUrl[]>(
    `SELECT * FROM AccountCasterUrls WHERE account_id = ? AND id = ?`,
    [accountId, id]
  );
  return row ?? null;
};

export const setCasterDefaultUrl = async (
  accountId: number,
  streamUrl: string
): Promise<CasterUrl> => {
  await runQuery(
    `UPDATE AccountCasterUrls SET is_default = false WHERE account_id = ?`,
    [accountId]
  );
  await runQuery(
    `INSERT INTO AccountCasterUrls (account_id, stream_url, is_default)
     VALUES (?, ?, true)
     ON DUPLICATE KEY UPDATE is_default = true, updated_at = CURRENT_TIMESTAMP`,
    [accountId, streamUrl]
  );

  const [result] = await runQuery<CasterUrl[]>(
    `SELECT * FROM AccountCasterUrls WHERE account_id = ? AND stream_url = ?`,
    [accountId, streamUrl]
  );
  if (!result) {
    throw new Error("Failed to retrieve caster default URL");
  }
  return result;
};

const clearCasterDefaultUrl = async (accountId: number): Promise<void> => {
  await runQuery(
    `UPDATE AccountCasterUrls SET is_default = false WHERE account_id = ?`,
    [accountId]
  );
};

export const deleteCasterDefaultUrl = async (
  accountId: number
): Promise<boolean> => {
  await clearCasterDefaultUrl(accountId);
  return true;
};
