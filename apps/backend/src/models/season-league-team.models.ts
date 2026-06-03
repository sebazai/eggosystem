import {
  type TeamWithExternalData,
  type SeasonLeagueTeam
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const getSeasonLeagueTeamByExternalId = async (
  externalId: string,
  seasonId: number,
  connection?: PoolConnection
) => {
  const query = `SELECT * FROM SeasonLeagueTeams WHERE external_team_id = ? AND season_id = ?`;
  const [seasonLeagueTeam] = await runQuery<
    Array<SeasonLeagueTeam | undefined>
  >(query, [externalId, seasonId], connection);
  return seasonLeagueTeam;
};

export const getSeasonLeagueTeamsBySeasonLeagueExternalId = async (
  seasonLeagueExternalId: string,
  seasonId: number,
  leagueId: number,
  connection?: PoolConnection
) => {
  const query = `SELECT slt.external_team_id, t.name FROM SeasonLeagueTeams slt
    JOIN Teams t ON slt.team_id = t.id
    WHERE slt.external_team_id = ? AND slt.season_id = ? AND slt.league_id = ?`;
  const [seasonLeagueTeams] = await runQuery<
    Array<TeamWithExternalData | undefined>
  >(query, [seasonLeagueExternalId, seasonId, leagueId], connection);
  return seasonLeagueTeams;
};

/**
 * Returns a map of external_team_id -> team_id for the given season.
 * Used to resolve FaceIT faction_id to our Teams.id for bracket display.
 */
export const getTeamIdsByExternalIds = async (
  seasonId: number,
  externalIds: string[],
  connection?: PoolConnection
): Promise<Map<string, number>> => {
  if (externalIds.length === 0) return new Map();
  const placeholders = externalIds.map(() => "?").join(", ");
  const query = `
    SELECT team_id, external_team_id
    FROM SeasonLeagueTeams
    WHERE season_id = ? AND external_team_id IN (${placeholders})
  `;
  const rows = await runQuery<
    Array<{ team_id: number; external_team_id: string }>
  >(query, [seasonId, ...externalIds], connection);
  return new Map(rows.map((r) => [r.external_team_id, r.team_id]));
};

interface PlayoffSeedRow {
  team_id: number;
  team_name: string;
  playoff_seed: number | null;
}

/**
 * Get teams for a season+league with their playoff_seed (for dashboard and bracket ordering).
 */
export const getPlayoffSeedsBySeasonAndLeague = async (
  seasonId: number,
  leagueId: number
): Promise<PlayoffSeedRow[]> => {
  const query = `
    SELECT slt.team_id, t.name AS team_name, slt.playoff_seed
    FROM SeasonLeagueTeams slt
    JOIN Teams t ON t.id = slt.team_id
    WHERE slt.season_id = ? AND slt.league_id = ?
    ORDER BY slt.playoff_seed IS NULL, slt.playoff_seed ASC, slt.team_id ASC
  `;
  const rows = await runQuery<
    Array<{ team_id: number; team_name: string; playoff_seed: number | null }>
  >(query, [seasonId, leagueId]);
  return rows.map((r) => ({
    team_id: r.team_id,
    team_name: r.team_name,
    playoff_seed: r.playoff_seed
  }));
};

/**
 * Returns map of team_id -> playoff_seed for the given season+league (teams with playoff_seed set).
 */
export const getPlayoffSeedMapBySeasonAndLeague = async (
  seasonId: number,
  leagueId: number
): Promise<Map<number, number>> => {
  const query = `
    SELECT team_id, playoff_seed
    FROM SeasonLeagueTeams
    WHERE season_id = ? AND league_id = ? AND playoff_seed IS NOT NULL
  `;
  const rows = await runQuery<Array<{ team_id: number; playoff_seed: number }>>(
    query,
    [seasonId, leagueId]
  );
  return new Map(rows.map((r) => [r.team_id, r.playoff_seed]));
};

/**
 * Update playoff_seed for given teams in a season+league.
 */
export const updatePlayoffSeeds = async (
  seasonId: number,
  leagueId: number,
  updates: Array<{ team_id: number; playoff_seed: number }>
): Promise<void> => {
  if (updates.length === 0) return;
  for (const { team_id, playoff_seed } of updates) {
    await runQuery(
      `UPDATE SeasonLeagueTeams SET playoff_seed = ? WHERE season_id = ? AND league_id = ? AND team_id = ?`,
      [playoff_seed, seasonId, leagueId, team_id]
    );
  }
};

/**
 * Clears existing 1st/2nd/3rd placements for a season+league before grand-final
 * assignment is rewritten (replay, webhook, manual upload).
 */
export const clearPodiumPlacementsForSeasonLeague = async (
  seasonId: number,
  leagueId: number,
  connection?: PoolConnection
): Promise<void> => {
  await runQuery(
    `UPDATE SeasonLeagueTeams SET placement = NULL
     WHERE season_id = ? AND league_id = ? AND placement IN (1, 2, 3)`,
    [seasonId, leagueId],
    connection
  );
};

export const updateSeasonLeagueTeamPlacement = async (
  seasonId: number,
  leagueId: number,
  teamId: number,
  placement: number,
  connection?: PoolConnection
): Promise<void> => {
  await runQuery(
    `UPDATE SeasonLeagueTeams SET placement = ? WHERE season_id = ? AND league_id = ? AND team_id = ?`,
    [placement, seasonId, leagueId, teamId],
    connection
  );
};
