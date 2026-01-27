import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

/**
 * Get all maps from the active map pool for the given seasons (id + name).
 * Use when complementing stats with the full map pool, e.g. for team map stats or veto stats.
 *
 * @param seasonIds - Array of season IDs to get active map pool for
 * @returns Promise resolving to an array of { map_id, map_name } objects
 */
export const getActiveMapPoolMaps = async (
  seasonIds?: number[] | null
): Promise<Array<{ map_id: number; map_name: string }>> => {
  if (!seasonIds || seasonIds.length === 0) {
    return [];
  }

  const placeholders = seasonIds.map(() => "?").join(", ");
  const query = `
    SELECT DISTINCT m.id as map_id, m.name as map_name
    FROM SeasonActiveMapPool samp
    JOIN Maps m ON samp.map_id = m.id
    WHERE samp.season_id IN (${placeholders})
    ORDER BY m.name ASC
  `;

  return runQuery<Array<{ map_id: number; map_name: string }>>(
    query,
    seasonIds
  );
};

/**
 * Get the active map pool for a season
 * @param seasonId - The season ID
 * @param connection - Optional database connection for transactions
 * @returns Array of map IDs that are active for the season
 */
export const getActiveMapPoolBySeasonId = async (
  seasonId: number,
  connection?: PoolConnection
): Promise<number[]> => {
  const query = `
    SELECT map_id
    FROM SeasonActiveMapPool
    WHERE season_id = ?
    ORDER BY map_id ASC
  `;
  const results = await runQuery<Array<{ map_id: number }>>(
    query,
    [seasonId],
    connection
  );
  return results.map((row) => row.map_id);
};

/**
 * Set the active map pool for a season
 * Deletes existing entries and inserts new ones
 * @param seasonId - The season ID
 * @param mapIds - Array of map IDs to set as active
 * @param connection - Optional database connection for transactions
 * @throws Error if mapIds is empty
 */
export const setActiveMapPoolForSeason = async (
  seasonId: number,
  mapIds: number[],
  connection?: PoolConnection
): Promise<void> => {
  if (mapIds.length === 0) {
    throw new Error("Active map pool must contain at least one map");
  }

  const deleteQuery = `DELETE FROM SeasonActiveMapPool WHERE season_id = ?`;
  await runQuery(deleteQuery, [seasonId], connection);

  if (mapIds.length > 0) {
    const insertQuery = `
      INSERT INTO SeasonActiveMapPool (season_id, map_id)
      VALUES ${mapIds.map(() => "(?, ?)").join(", ")}
    `;
    const insertParams: number[] = [];
    for (const mapId of mapIds) {
      insertParams.push(seasonId, mapId);
    }
    await runQuery(insertQuery, insertParams, connection);
  }
};
