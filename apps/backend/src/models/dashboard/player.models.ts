import { type PlayerDetailsForDashboardBySteamId } from "@eggosystem/types";
import { runQuery } from "../../db/mysqlRunQuery";

export const getPlayerDetailsForDashboardBySteamId = async (
  steam_id: string
) => {
  const results = await runQuery<PlayerDetailsForDashboardBySteamId[]>(
    `SELECT
        p.steam_id, 
        p.nickname,
        a.id as account_id,
        a.discord,
        a.work_email_verified,
        a.work_email,
        a.is_work_email_personal_email,
        CASE 
            WHEN a.work_email IS NULL THEN FALSE
            WHEN a.work_email LIKE '%@%' THEN TRUE
            ELSE FALSE
        END AS is_valid_work_email,
        CASE 
            WHEN a.full_name LIKE '% %' THEN TRUE 
            ELSE FALSE 
        END AS is_valid_full_name
      FROM SteamPlayers p 
      JOIN Accounts a ON a.id = p.account_id
      WHERE p.steam_id = ?`,
    [steam_id]
  );

  return results.length > 0 ? results[0] : undefined;
};
