import { type SeasonPlayerApprovals } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getSeasonPlayerApproval = async (
  season_id: number,
  team_id: number,
  steam_id: string
) => {
  const query = `
    SELECT spa.* FROM SeasonPlayerApprovals spa
    LEFT JOIN Teams t ON spa.organization_id = t.organization_id
    WHERE spa.season_id = ?
    AND spa.steam_id = ?
    AND (spa.team_id = ? OR (spa.organization_id IS NOT NULL AND t.id = ?))
  `;
  const rows = await runQuery<SeasonPlayerApprovals[] | undefined>(query, [
    season_id,
    steam_id,
    team_id,
    team_id
  ]);
  return rows;
};
