import type {
  SeasonDetails,
  Season,
  ActiveSeasonSignupForAppId,
  ActiveSignupOrSeasonForAppId,
  SeasonFormRaw
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";
import { formatDateFromDatabase } from "../utils/date-utils";
import { getConnection } from "../db/mysqlConnection";
import {
  setActiveMapPoolForSeason,
  getActiveMapPoolBySeasonId
} from "./season-active-map-pool.models";

/**
 * Formats date fields in a Season object to ISO 8601 with UTC indicator
 */
const formatSeasonDates = <T extends Season | SeasonDetails>(season: T): T => {
  return {
    ...season,
    signup_start_date: formatDateFromDatabase(season.signup_start_date),
    signup_end_date: formatDateFromDatabase(season.signup_end_date),
    early_bird_price_discount_end_date: formatDateFromDatabase(
      season.early_bird_price_discount_end_date
    )
  };
};

export const getSeasons = async () => {
  const seasons = await runQuery<Season[]>("SELECT * FROM Seasons");
  return seasons.map(formatSeasonDates);
};

export const getSeasonById = async (
  id: number,
  connection?: PoolConnection
) => {
  const [data] = await runQuery<Array<Season | undefined>>(
    "SELECT * FROM Seasons WHERE id = ?",
    [id],
    connection
  );
  if (!data) {
    return undefined;
  }
  const season = formatSeasonDates(data);
  // Get active map pool
  const activeMapPool = await getActiveMapPoolBySeasonId(id, connection);
  return {
    ...season,
    active_map_pool: activeMapPool
  };
};

export const getSeasonByIdOrThrow = async (
  id: number,
  connection?: PoolConnection
) => {
  const season = await getSeasonById(id, connection);
  if (!season) {
    throw new Error(`Season ${id} not found`);
  }
  return season;
};

export const getSeasonDetailsById = async (id: number) => {
  const [data] = await runQuery<Array<SeasonDetails | undefined>>(
    "SELECT s.*, g.app_id FROM Seasons s JOIN Games g ON s.game_id = g.id WHERE s.id = ?",
    [id]
  );
  if (data) {
    return formatSeasonDates(data);
  }
  return undefined;
};

/**
 * @deprecated This function should not be used in new code. Instead, always pass season_id as a parameter
 * from which app_id, game, organizer, etc. can be inferred if needed. This function relies on finding
 * an "active" or "latest" season which creates implicit dependencies and makes the code less explicit.
 *
 * For REST API endpoints, season_id should be explicitly required from the frontend (via URL params or request body).
 * The season_id can then be used to fetch season details including app_id, game, organizer, etc.
 * This approach is essential for multi-organizer support and follows REST API best practices.
 *
 * @param organizer_id - The organizer ID
 * @param app_id - The app ID
 * @returns Active or latest season for the given app and organizer, or undefined if none found
 */
export const getActiveOrLatestSeasonForAppId = async (
  organizer_id: number,
  app_id: number
) => {
  const [activeSeason] = await runQuery<
    Array<{ season_id: number } | undefined>
  >(
    `SELECT s.id AS season_id
     FROM Seasons s
     JOIN Games g ON s.game_id = g.id
     JOIN Organizers o ON s.organizer_id = o.id
     WHERE g.app_id = ? AND o.id = ?
     AND (
         (s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW()))
         OR s.id = (
            SELECT MAX(s2.id)
            FROM Seasons s2 
            JOIN Games g2 ON s2.game_id = g2.id 
            WHERE g2.app_id = ?
            AND s2.end_date IS NOT NULL
            AND s2.end_date < NOW()
         )
     )
     ORDER BY s.id DESC
     LIMIT 1;`,
    [app_id, organizer_id, app_id]
  );
  return activeSeason;
};

/**
 * @deprecated This function should not be used in new code. Instead, always pass season_id as a parameter
 * from which app_id, game, organizer, etc. can be inferred if needed. This function relies on finding
 * an "active" season which creates implicit dependencies and makes the code less explicit.
 *
 * For REST API endpoints, season_id should be explicitly required from the frontend (via URL params or request body).
 * The season_id can then be used to fetch season details including app_id, game, organizer, etc.
 * This approach is essential for multi-organizer support and follows REST API best practices.
 *
 * @param organizer_id - The organizer ID
 * @param app_id - The app ID
 * @returns Active season for the given app and organizer, or undefined if none found
 */
export const getActiveSeasonForAppId = async (
  organizer_id: number,
  app_id: number
) => {
  const [activeSeason] = await runQuery<
    Array<{ season_id: number } | undefined>
  >(
    `SELECT s.id AS season_id
     FROM Seasons s
     JOIN Games g ON s.game_id = g.id
     JOIN Organizers o ON s.organizer_id = o.id
     WHERE g.app_id = ? AND o.id = ?
     AND s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW())
     ORDER BY s.id DESC
     LIMIT 1;`,
    [app_id, organizer_id]
  );
  return activeSeason;
};

/**
 * @deprecated This function should not be used in new code. Instead, always pass season_id as a parameter
 * from which app_id, game, organizer, etc. can be inferred if needed. This function relies on finding
 * an "active signup" season which creates implicit dependencies and makes the code less explicit.
 *
 * For REST API endpoints, season_id should be explicitly required from the frontend (via URL params or request body).
 * The season_id can then be used to fetch season details including app_id, game, organizer, etc.
 * This approach is essential for multi-organizer support and follows REST API best practices.
 *
 * @param organizer_id - The organizer ID
 * @param app_id - The app ID
 * @returns Active signup season for the given app and organizer, or undefined if none found
 */
export const getActiveSignupSeasonForAppId = async (
  organizer_id: number,
  app_id: number
) => {
  const [activeSignupSeason] = await runQuery<
    Array<ActiveSeasonSignupForAppId | undefined>
  >(
    `SELECT s.id AS season_id, s.platform, s.signup_end_date, s.full_name
     FROM Seasons s
     JOIN Games g ON s.game_id = g.id
     JOIN Organizers o ON s.organizer_id = o.id
     WHERE g.app_id = ? AND o.id = ? AND s.start_date >= NOW() AND s.signup_start_date <= NOW() AND (s.signup_end_date IS NULL OR s.signup_end_date >= NOW())
     ORDER BY s.id DESC
     LIMIT 1;`,
    [app_id, organizer_id]
  );
  if (activeSignupSeason) {
    return {
      ...activeSignupSeason,
      signup_end_date: formatDateFromDatabase(
        activeSignupSeason.signup_end_date
      )
    };
  }
  return activeSignupSeason;
};

/**
 * @deprecated This function should not be used in new code. Instead, always pass season_id as a parameter
 * from which app_id, game, organizer, etc. can be inferred if needed. This function relies on finding
 * an "active" season which creates implicit dependencies and makes the code less explicit and harder to test.
 *
 * For dashboard endpoints, season_id should be explicitly required from the frontend (via URL params or request body).
 * The season_id can then be used to fetch season details including app_id, game, organizer, etc.
 *
 * @param organizer_id - The organizer ID
 * @param app_id - The app ID
 * @returns Active signup or active season for the given app and organizer, or undefined if none found
 */
export const getActiveSignupOrActiveSeasonForAppId = async (
  organizer_id: number,
  app_id: number
) => {
  const [activeSignupOrActiveSeason] = await runQuery<
    Array<ActiveSignupOrSeasonForAppId | undefined>
  >(
    `SELECT s.id AS season_id, s.platform, s.signup_start_date, s.signup_end_date, s.start_date, s.end_date, s.full_name
     FROM Seasons s
     JOIN Games g ON s.game_id = g.id
     JOIN Organizers o ON s.organizer_id = o.id
     WHERE g.app_id = ? AND o.id = ?
     AND (
       (s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW()))
       OR
       (s.signup_start_date <= NOW() AND (s.signup_end_date IS NULL OR s.signup_end_date >= NOW()) AND s.start_date > NOW())
     )
     ORDER BY 
       CASE 
         WHEN s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW()) THEN 0
         ELSE 1
       END,
       s.id DESC
     LIMIT 1;`,
    [app_id, organizer_id]
  );
  if (activeSignupOrActiveSeason) {
    return {
      ...activeSignupOrActiveSeason,
      signup_start_date: formatDateFromDatabase(
        activeSignupOrActiveSeason.signup_start_date
      ),
      signup_end_date: formatDateFromDatabase(
        activeSignupOrActiveSeason.signup_end_date
      )
    };
  }
  return activeSignupOrActiveSeason;
};

/**
 * Internal function to create a season with active map pool.
 * Requires a connection and does not manage transactions.
 * @param seasonData - Season data including active_map_pool
 * @param connection - Database connection (required)
 * @returns Insert result with season ID
 */
const createSeasonWithMapPool = async (
  seasonData: SeasonFormRaw,
  connection: PoolConnection
): Promise<{ insertId: number }> => {
  // Validate active_map_pool
  if (!seasonData.active_map_pool || seasonData.active_map_pool.length === 0) {
    throw new Error("Active map pool must contain at least one map");
  }

  const query = `
    INSERT INTO Seasons (
      game_id,
      game_type_id,
      organizer_id,
      name,
      full_name,
      signup_start_date,
      signup_end_date,
      start_date,
      end_date,
      platform,
      is_round_robin_bo2_as_2xbo1,
      payment_link,
      registration_price,
      has_vat,
      early_bird_price_discount,
      early_bird_price_discount_end_date,
      rulebook_url,
      discord_link
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await runQuery<{ insertId: number }>(
    query,
    [
      seasonData.game_id,
      seasonData.game_type_id,
      seasonData.organizer_id,
      seasonData.name,
      seasonData.full_name,
      seasonData.signup_start_date,
      seasonData.signup_end_date,
      seasonData.start_date,
      seasonData.end_date,
      seasonData.platform,
      seasonData.is_round_robin_bo2_as_2xbo1,
      seasonData.payment_link,
      seasonData.registration_price,
      seasonData.has_vat,
      seasonData.early_bird_price_discount,
      seasonData.early_bird_price_discount_end_date,
      seasonData.rulebook_url,
      seasonData.discord_link
    ],
    connection
  );

  // Set active map pool
  await setActiveMapPoolForSeason(
    result.insertId,
    seasonData.active_map_pool,
    connection
  );

  return result;
};

/**
 * Create a new season with active map pool.
 * Manages its own database transaction.
 * @param seasonData - Season data including active_map_pool
 * @returns Insert result with season ID
 */
export const createSeason = async (
  seasonData: SeasonFormRaw
): Promise<{ insertId: number }> => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    const result = await createSeasonWithMapPool(seasonData, connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Internal function to update a season with active map pool.
 * Requires a connection and does not manage transactions.
 * @param seasonId - Season ID to update
 * @param seasonData - Season data including active_map_pool
 * @param connection - Database connection (required)
 * @returns Update result with affected rows
 */
const updateSeasonWithMapPool = async (
  seasonId: number,
  seasonData: SeasonFormRaw,
  connection: PoolConnection
): Promise<{ affectedRows: number }> => {
  // Validate active_map_pool
  if (!seasonData.active_map_pool || seasonData.active_map_pool.length === 0) {
    throw new Error("Active map pool must contain at least one map");
  }

  const query = `
    UPDATE Seasons SET
      game_id = ?,
      game_type_id = ?,
      organizer_id = ?,
      name = ?,
      full_name = ?,
      signup_start_date = ?,
      signup_end_date = ?,
      start_date = ?,
      end_date = ?,
      platform = ?,
      is_round_robin_bo2_as_2xbo1 = ?,
      payment_link = ?,
      registration_price = ?,
      has_vat = ?,
      early_bird_price_discount = ?,
      early_bird_price_discount_end_date = ?,
      rulebook_url = ?,
      discord_link = ?
    WHERE id = ?
  `;

  const result = await runQuery<{ affectedRows: number }>(
    query,
    [
      seasonData.game_id,
      seasonData.game_type_id,
      seasonData.organizer_id,
      seasonData.name,
      seasonData.full_name,
      seasonData.signup_start_date,
      seasonData.signup_end_date,
      seasonData.start_date,
      seasonData.end_date,
      seasonData.platform,
      seasonData.is_round_robin_bo2_as_2xbo1,
      seasonData.payment_link,
      seasonData.registration_price,
      seasonData.has_vat,
      seasonData.early_bird_price_discount,
      seasonData.early_bird_price_discount_end_date,
      seasonData.rulebook_url,
      seasonData.discord_link,
      seasonId
    ],
    connection
  );

  // Set active map pool
  await setActiveMapPoolForSeason(
    seasonId,
    seasonData.active_map_pool,
    connection
  );

  return result;
};

/**
 * Update an existing season with active map pool.
 * Manages its own database transaction.
 * @param seasonId - Season ID to update
 * @param seasonData - Season data including active_map_pool
 * @returns Update result with affected rows
 */
export const updateSeason = async (
  seasonId: number,
  seasonData: SeasonFormRaw
): Promise<{ affectedRows: number }> => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    const result = await updateSeasonWithMapPool(
      seasonId,
      seasonData,
      connection
    );
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
