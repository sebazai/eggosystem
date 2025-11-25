import { runQuery } from "../db/mysqlRunQuery";
import type { PoolConnection } from "mysql2/promise";

/**
 * Calculate current week number based on season start date
 * Week 1 starts from the season start date
 * Weeks reset on Monday (Sunday night/Monday morning transition)
 *
 * The week number increments every Monday at 00:00 (Helsinki time)
 */
export const calculateCurrentWeekNumber = (seasonStartDate: Date): number => {
  const now = new Date();
  const start = new Date(seasonStartDate);

  // Set both dates to Helsinki timezone for consistent week calculation
  // Monday = 1, Sunday = 0
  const startDayOfWeek = start.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate days since season start (not used but kept for clarity)
  const _diffTime = now.getTime() - start.getTime();

  // Calculate how many Mondays have passed
  // If season started on Monday, week increments every 7 days
  // If season started on another day, we need to adjust

  // Find the first Monday after or on the start date
  const daysUntilFirstMonday =
    startDayOfWeek === 0 ? 1 : (8 - startDayOfWeek) % 7;
  const firstMonday = new Date(start);
  firstMonday.setUTCDate(start.getUTCDate() + daysUntilFirstMonday);
  firstMonday.setUTCHours(0, 0, 0, 0);

  // Calculate weeks since first Monday
  const weeksSinceFirstMonday = Math.floor(
    (now.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  // Week 1 is the week containing the season start date
  return Math.max(1, weeksSinceFirstMonday + 1);
};

/**
 * Get season start date from database
 */
export const getSeasonStartDate = async (
  seasonId: number,
  connection?: PoolConnection
): Promise<Date> => {
  const [season] = await runQuery<Array<{ start_date: Date }>>(
    "SELECT start_date FROM Seasons WHERE id = ?",
    [seasonId],
    connection
  );

  if (!season) {
    throw new Error(`Season ${seasonId} not found`);
  }

  return new Date(season.start_date);
};

/**
 * Calculate current week number for a season
 */
export const getCurrentWeekNumberForSeason = async (
  seasonId: number,
  connection?: PoolConnection
): Promise<number> => {
  const startDate = await getSeasonStartDate(seasonId, connection);
  return calculateCurrentWeekNumber(startDate);
};
