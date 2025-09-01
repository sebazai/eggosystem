import { runQuery } from "../db/mysqlRunQuery";
import type { CasterUrl } from "@eggosystem/types";

export const getCasterDefaultUrl = async (
  accountId: number
): Promise<string | null> => {
  const result = await runQuery<Pick<CasterUrl, "default_stream_url">[]>(
    `SELECT default_stream_url FROM AccountCasterUrls WHERE account_id = ?`,
    [accountId]
  );

  return result.length > 0 ? result[0].default_stream_url : null;
};

export const setCasterDefaultUrl = async (
  accountId: number,
  streamUrl: string
): Promise<CasterUrl> => {
  // Use ON DUPLICATE KEY UPDATE to handle both insert and update
  await runQuery(
    `INSERT INTO AccountCasterUrls (account_id, default_stream_url) 
     VALUES (?, ?) 
     ON DUPLICATE KEY UPDATE default_stream_url = VALUES(default_stream_url)`,
    [accountId, streamUrl]
  );

  // Return the updated/created record
  const [result] = await runQuery<CasterUrl[]>(
    `SELECT * FROM AccountCasterUrls WHERE account_id = ?`,
    [accountId]
  );

  return result;
};

export const deleteCasterDefaultUrl = async (
  accountId: number
): Promise<boolean> => {
  const result = await runQuery<{ affectedRows: number }>(
    `DELETE FROM AccountCasterUrls WHERE account_id = ?`,
    [accountId]
  );

  return result.affectedRows > 0;
};
