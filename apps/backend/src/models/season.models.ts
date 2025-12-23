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

/**
 * Formats date fields in a Season object to ISO 8601 with UTC indicator
 */
const formatSeasonDates = (season: Season): Season => {
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
  const [data] = await runQuery<[Season | undefined]>(
    "SELECT * FROM Seasons WHERE id = ?",
    [id],
    connection
  );
  return data ? formatSeasonDates(data) : undefined;
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
    // SeasonDetails extends Season, so we can format it the same way
    return formatSeasonDates(data as unknown as Season) as SeasonDetails;
  }
  return undefined;
};

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
 * Get active season ID for CS2 (app_id 730, organizer_id 1)
 * Used as fallback when player has no season history
 * @returns Active season ID or null if not found
 */
export const getActiveSeasonId = async (): Promise<number | null> => {
  const activeSeason = await getActiveOrLatestSeasonForAppId(1, 730);
  return activeSeason?.season_id ?? null;
};

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

export const createSeason = async (
  seasonData: SeasonFormRaw,
  connection?: PoolConnection
): Promise<{ insertId: number }> => {
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
      early_bird_price_discount_end_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      seasonData.early_bird_price_discount_end_date
    ],
    connection
  );

  return result;
};

export const updateSeason = async (
  seasonId: number,
  seasonData: SeasonFormRaw,
  connection?: PoolConnection
): Promise<{ affectedRows: number }> => {
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
      early_bird_price_discount_end_date = ?
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
      seasonId
    ],
    connection
  );

  return result;
};
