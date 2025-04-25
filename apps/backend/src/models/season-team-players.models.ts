import type { PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import type {
  InsertSeasonTeamPlayer,
  SeasonTeamPlayer
} from "@eggosystem/types";
import { buildInsertQueryParts } from "../db/utils";

export const insertSeasonTeamPlayer = async (
  seasonId: number,
  teamId: number,
  data: InsertSeasonTeamPlayer,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts(data);
  return runQuery<{ insertId: number }>(
    `INSERT INTO SeasonTeamPlayers (season_id, team_id, ${columns.join(", ")}) VALUES (?, ?, ${placeholders})`,
    [seasonId, teamId, ...values],
    connection
  );
};

export const isPlayerApprovedForSeasonTeamManually = async (
  season_id: number,
  team_id: number,
  steam_id: string
) => {
  const [result] = await runQuery<
    Array<
      | {
          employment_approved_by_organizer: SeasonTeamPlayer["employment_approved_by_organizer"];
        }
      | undefined
    >
  >(
    `SELECT employment_approved_by_organizer FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id = ?`,
    [season_id, team_id, steam_id]
  );
  if (!result) {
    return { employment_approved_by_organizer: false };
  }
  return {
    employment_approved_by_organizer: !!result.employment_approved_by_organizer
  };
};
