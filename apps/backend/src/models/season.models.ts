import type {
  SeasonDetails,
  SeasonWithSettings,
  ActiveSignupOrSeasonForAppId,
  PastSeason,
  SeasonFormRaw,
  SeasonPlatform
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection, type ResultSetHeader } from "mysql2/promise";
import { getConnection } from "../db/mysqlConnection";
import { expireInOneDay, redisClient } from "../utils/redisClient";
import {
  setActiveMapPoolForSeason,
  getActiveMapPoolBySeasonId
} from "./season-active-map-pool.models";
import { upsertSeasonSignupSettings } from "./season-signup-settings.models";
import { upsertCSSeasonSettings } from "./cs-season-settings.models";

const SEASON_PLAYER_LIMITS_SQL = `
  sss.min_players AS min_players,
  sss.max_players AS max_players
`;

const SEASON_CS_SETTINGS_SQL = `
  COALESCE(css.is_round_robin_bo2_as_2xbo1, false) AS is_round_robin_bo2_as_2xbo1,
  COALESCE(css.grand_final_round_one_only, true)    AS grand_final_round_one_only,
  COALESCE(css.faceit_rank_required, false)         AS faceit_rank_required,
  COALESCE(css.premier_rank_required, false)        AS premier_rank_required,
  COALESCE(css.hours_played_required, false)        AS hours_played_required
`;

export const getSeasons = async () => {
  const seasons = await runQuery<SeasonWithSettings[]>(`
    SELECT s.*, ${SEASON_PLAYER_LIMITS_SQL}, ${SEASON_CS_SETTINGS_SQL}
    FROM Seasons s
    INNER JOIN SeasonSignupSettings sss ON sss.season_id = s.id
    LEFT JOIN CSSeasonSettings css ON css.season_id = s.id
  `);
  return seasons;
};

/** Stage id for playoff (double elimination) in SeasonLeagueExternalIds. */
const STAGE_ID_PLAYOFF = 2;

type RawPastSeason = Omit<
  PastSeason,
  "has_standings" | "has_fantasy" | "has_playoff" | "has_captains"
> & {
  has_standings: 0 | 1;
  has_fantasy: 0 | 1;
  has_playoff: 0 | 1;
  has_captains: 0 | 1;
};

export const getPastSeasons = async (): Promise<PastSeason[]> => {
  const rows = await runQuery<Array<RawPastSeason>>(
    `SELECT s.id, s.game_id, s.game_type_id, s.organizer_id, s.name, s.full_name,
       s.signup_start_date, s.signup_end_date, s.platform,
       s.start_date, s.end_date,
       s.payment_link, s.registration_price, s.has_vat,
       s.early_bird_price_discount, s.early_bird_price_discount_end_date,
       s.rulebook_url, s.discord_link,
       (SELECT DATE(MIN(m.start_timestamp)) FROM Matches m WHERE m.season_id = s.id) AS first_match_date,
       EXISTS(SELECT 1 FROM SeasonLeagueTeams slt WHERE slt.season_id = s.id AND slt.playoff_seed IS NOT NULL) AS has_standings,
       EXISTS(SELECT 1 FROM FantasyTeams ft WHERE ft.season_id = s.id) AS has_fantasy,
       EXISTS(SELECT 1 FROM SeasonLeagueExternalIds slei WHERE slei.season_id = s.id AND slei.stage_id = ?) AS has_playoff,
       EXISTS(SELECT 1 FROM SeasonTeamPlayers stp WHERE stp.season_id = s.id AND stp.is_captain = 1 AND stp.discarded_at IS NULL) AS has_captains
     FROM Seasons s
     WHERE s.end_date IS NOT NULL AND s.end_date < CURDATE()
     ORDER BY s.id DESC`,
    [STAGE_ID_PLAYOFF]
  );
  return rows.map((r) => ({
    ...r,
    has_standings: Boolean(r.has_standings),
    has_fantasy: Boolean(r.has_fantasy),
    has_playoff: Boolean(r.has_playoff),
    has_captains: Boolean(r.has_captains)
  }));
};

export const getSeasonById = async (
  id: number,
  connection?: PoolConnection
) => {
  const [data] = await runQuery<Array<SeasonWithSettings | undefined>>(
    `
    SELECT s.*, ${SEASON_PLAYER_LIMITS_SQL}, ${SEASON_CS_SETTINGS_SQL}
    FROM Seasons s
    INNER JOIN SeasonSignupSettings sss ON sss.season_id = s.id
    LEFT JOIN CSSeasonSettings css ON css.season_id = s.id
    WHERE s.id = ?
    `,
    [id],
    connection
  );
  if (!data) {
    return undefined;
  }

  // Get active map pool
  const activeMapPool = await getActiveMapPoolBySeasonId(id, connection);

  // Express res.json() will automatically serialize Date objects to ISO strings
  return {
    ...data,
    is_round_robin_bo2_as_2xbo1: Boolean(data.is_round_robin_bo2_as_2xbo1),
    grand_final_round_one_only: Boolean(data.grand_final_round_one_only),
    faceit_rank_required: Boolean(data.faceit_rank_required),
    premier_rank_required: Boolean(data.premier_rank_required),
    hours_played_required: Boolean(data.hours_played_required),
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

export const getOrganizerIdBySeasonId = async (
  seasonId: number,
  connection?: PoolConnection
): Promise<number | undefined> => {
  const [row] = await runQuery<Array<{ organizer_id: number }>>(
    "SELECT organizer_id FROM Seasons WHERE id = ?",
    [seasonId],
    connection
  );
  return row?.organizer_id;
};

export const getSeasonDetailsById = async (id: number) => {
  const [data] = await runQuery<Array<SeasonDetails | undefined>>(
    `
    SELECT s.*, g.app_id, ${SEASON_PLAYER_LIMITS_SQL}, ${SEASON_CS_SETTINGS_SQL}
    FROM Seasons s
    JOIN Games g ON s.game_id = g.id
    INNER JOIN SeasonSignupSettings sss ON sss.season_id = s.id
    LEFT JOIN CSSeasonSettings css ON css.season_id = s.id
    WHERE s.id = ?
    `,
    [id]
  );
  // Express res.json() will automatically serialize Date objects to ISO strings
  return data;
};

/**
 * Gets season platform and app_id for a given season ID.
 * Useful for operations that need to know the game platform and app ID.
 *
 * @param seasonId The season ID
 * @param connection Optional database connection for transactions
 * @returns Object with platform and app_id, or undefined if season not found
 */
export const getSeasonGrandFinalRoundOneOnly = async (
  seasonId: number,
  connection?: PoolConnection
): Promise<boolean> => {
  const [row] = await runQuery<
    Array<{ grand_final_round_one_only: boolean | null }>
  >(
    `SELECT grand_final_round_one_only FROM CSSeasonSettings WHERE season_id = ?`,
    [seasonId],
    connection
  );
  return Boolean(row?.grand_final_round_one_only);
};

export const getSeasonPlatformAndAppId = async (
  seasonId: number,
  connection?: PoolConnection
): Promise<{ platform: SeasonPlatform; app_id: number } | undefined> => {
  const [data] = await runQuery<
    Array<{ platform: SeasonPlatform; app_id: number } | undefined>
  >(
    "SELECT s.platform, g.app_id FROM Seasons s JOIN Games g ON s.game_id = g.id WHERE s.id = ?",
    [seasonId],
    connection
  );
  return data;
};

/**
 * Gets the active or active signup season for a given organizer, app, and game type.
 *
 * @param organizer_id - The organizer ID
 * @param app_id - The app ID
 * @param gametype - The game type (default: "comp")
 * @returns The active or signup-open season for the given app and organizer, or undefined if none found
 */
export const getOrganizerActiveSeasonForAppId = async (
  organizer_id: number,
  app_id: number,
  gametype?: string
) => {
  const redisKey = `${organizer_id}-${app_id}-${(gametype ?? "comp").toLowerCase()}-active-season`;
  const cachedData = await redisClient.get(redisKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const [activeSeason] = await runQuery<
    Array<ActiveSignupOrSeasonForAppId | undefined>
  >(
    `SELECT s.id AS season_id, s.platform, s.signup_start_date, s.signup_end_date, s.start_date, s.end_date, s.full_name
     FROM Seasons s
     JOIN Games g ON s.game_id = g.id
     JOIN GameTypes gt ON s.game_type_id = gt.id
     JOIN Organizers o ON s.organizer_id = o.id
     WHERE g.app_id = ? AND o.id = ? AND LOWER(gt.name) = LOWER(?)
       AND (
         (s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW()))
         OR
         (s.start_date > NOW() AND s.signup_start_date <= NOW() AND (s.signup_end_date IS NULL OR s.signup_end_date >= NOW()))
       )
     ORDER BY s.id DESC
     LIMIT 1;`,
    [app_id, organizer_id, gametype ?? "comp"]
  );

  if (activeSeason) {
    await redisClient.set(
      redisKey,
      JSON.stringify(activeSeason),
      "EX",
      expireInOneDay
    );
  }

  return activeSeason;
};

/**
 * Gets the currently running season for a given organizer, app, and game type,
 * falling back to the most recently finished season when none is running.
 *
 * Unlike {@link getOrganizerActiveSeasonForAppId} (which matches a running *or*
 * signup-open season and prefers the newest), this prefers the running season
 * and never returns a not-yet-started signup-only season; when nothing is
 * running it returns the most recent finished season.
 *
 * It backs the "what season's data do we display" surfaces (`/seasons/active`,
 * the calendar, the kana-elo leaderboard, the filters cache guard) so they keep
 * showing the last finished season between seasons instead of 404ing, and never
 * jump to an upcoming season that has no matches yet.
 *
 * @param organizer_id - The organizer ID
 * @param app_id - The app ID
 * @param gametype - The game type (default: "comp")
 * @returns The running or most recent finished season, or undefined if none exists
 */
export const getOrganizerActiveOrLatestSeasonForAppId = async (
  organizer_id: number,
  app_id: number,
  gametype?: string
) => {
  const redisKey = `${organizer_id}-${app_id}-${(gametype ?? "comp").toLowerCase()}-active-or-latest-season`;
  const cachedData = await redisClient.get(redisKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const [season] = await runQuery<
    Array<ActiveSignupOrSeasonForAppId | undefined>
  >(
    `SELECT s.id AS season_id, s.platform, s.signup_start_date, s.signup_end_date, s.start_date, s.end_date, s.full_name
     FROM Seasons s
     JOIN Games g ON s.game_id = g.id
     JOIN GameTypes gt ON s.game_type_id = gt.id
     JOIN Organizers o ON s.organizer_id = o.id
     WHERE g.app_id = ? AND o.id = ? AND LOWER(gt.name) = LOWER(?)
       AND (
         (s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW()))
         OR
         s.id = (
           SELECT MAX(s2.id)
           FROM Seasons s2
           JOIN Games g2 ON s2.game_id = g2.id
           JOIN GameTypes gt2 ON s2.game_type_id = gt2.id
           JOIN Organizers o2 ON s2.organizer_id = o2.id
           WHERE g2.app_id = ? AND o2.id = ? AND LOWER(gt2.name) = LOWER(?)
             AND s2.end_date IS NOT NULL AND s2.end_date < NOW()
         )
       )
     ORDER BY
       CASE
         WHEN s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW()) THEN 0
         ELSE 1
       END,
       s.id DESC
     LIMIT 1;`,
    [
      app_id,
      organizer_id,
      gametype ?? "comp",
      app_id,
      organizer_id,
      gametype ?? "comp"
    ]
  );

  if (season) {
    await redisClient.set(
      redisKey,
      JSON.stringify(season),
      "EX",
      expireInOneDay
    );
  }

  return season;
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
): Promise<ResultSetHeader> => {
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
      payment_link,
      registration_price,
      has_vat,
      early_bird_price_discount,
      early_bird_price_discount_end_date,
      rulebook_url,
      discord_link
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await runQuery<ResultSetHeader>(
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
  await upsertSeasonSignupSettings(
    result.insertId,
    {
      min_players: seasonData.min_players,
      max_players: seasonData.max_players
    },
    connection
  );

  if (seasonData.active_map_pool.length > 0) {
    await setActiveMapPoolForSeason(
      result.insertId,
      seasonData.active_map_pool,
      connection
    );

    await upsertCSSeasonSettings(
      result.insertId,
      {
        is_round_robin_bo2_as_2xbo1: seasonData.is_round_robin_bo2_as_2xbo1,
        grand_final_round_one_only:
          seasonData.grand_final_round_one_only ?? true,
        faceit_rank_required: seasonData.faceit_rank_required ?? false,
        premier_rank_required: seasonData.premier_rank_required ?? false,
        hours_played_required: seasonData.hours_played_required ?? false
      },
      connection
    );
  }

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
): Promise<ResultSetHeader> => {
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
): Promise<ResultSetHeader> => {
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
      payment_link = ?,
      registration_price = ?,
      has_vat = ?,
      early_bird_price_discount = ?,
      early_bird_price_discount_end_date = ?,
      rulebook_url = ?,
      discord_link = ?
    WHERE id = ?
  `;

  const result = await runQuery<ResultSetHeader>(
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

  await upsertSeasonSignupSettings(
    seasonId,
    {
      min_players: seasonData.min_players,
      max_players: seasonData.max_players
    },
    connection
  );

  if (seasonData.active_map_pool.length > 0) {
    await setActiveMapPoolForSeason(
      seasonId,
      seasonData.active_map_pool,
      connection
    );

    await upsertCSSeasonSettings(
      seasonId,
      {
        is_round_robin_bo2_as_2xbo1: seasonData.is_round_robin_bo2_as_2xbo1,
        grand_final_round_one_only:
          seasonData.grand_final_round_one_only ?? true,
        faceit_rank_required: seasonData.faceit_rank_required ?? false,
        premier_rank_required: seasonData.premier_rank_required ?? false,
        hours_played_required: seasonData.hours_played_required ?? false
      },
      connection
    );
  }

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
): Promise<ResultSetHeader> => {
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
