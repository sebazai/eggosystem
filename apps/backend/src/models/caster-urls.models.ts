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

export const setCasterDefaultUrl = async (
  accountId: number,
  streamUrl: string
): Promise<CasterUrl> => {
  // Use ON DUPLICATE KEY UPDATE to handle both insert and update
  await runQuery(
    `INSERT INTO AccountCasterUrls (account_id, stream_url, is_default) 
     VALUES (?, ?, ?) 
     ON DUPLICATE KEY UPDATE stream_url = VALUES(stream_url)`,
    [accountId, streamUrl, true]
  );

  // Return the updated/created record
  const [result] = await runQuery<CasterUrl[]>(
    `SELECT * FROM AccountCasterUrls WHERE account_id = ? AND is_default = true`,
    [accountId]
  );

  return result;
};

export const deleteCasterDefaultUrl = async (
  accountId: number
): Promise<boolean> => {
  const result = await runQuery<{ affectedRows: number }>(
    `DELETE FROM AccountCasterUrls WHERE account_id = ? AND is_default = true`,
    [accountId]
  );

  return result.affectedRows > 0;
};
