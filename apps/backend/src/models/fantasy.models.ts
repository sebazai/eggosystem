import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import type { PoolConnection } from "mysql2/promise";
import type { PlayerTier, FantasyPlayerStats } from "@eggosystem/types";
import {
  calculateInitialPlayerValue,
  calculatePlayerTier
} from "@eggosystem/types";
import {
  getCurrentWeekNumberForSeason,
  getSeasonStartDate
} from "../utils/week-calculation";
import { redisClient } from "../utils/redisClient";
import { logger } from "../utils/app-logger";

export type PlayerRole =
  | "main_awp"
  | "leader"
  | "support"
  | "entry_fragger"
  | "defender"
  | "hs_machine"
  | "multi_fragger"
  | "attacker"
  | "camper"
  | "stathunter"
  | "noob"
  | "eco_friendly"
  | "flash_master"
  | "clutch_player"
  | "first_blood"
  | "t_specialist"
  | "ct_specialist"
  | "anchor";

export interface FantasyTeamPlayer {
  steam_id: string;
  role: PlayerRole | null;
  player_value: number;
}

export interface CreateFantasyTeamData {
  steam_id: string;
  season_id: number;
  league_id: number;
  team_name?: string;
  players: FantasyTeamPlayer[];
}

export interface FantasyTeam {
  id: number;
  steam_id: string;
  season_id: number;
  league_id: number;
  team_name: string | null;
  budget_remaining: number;
  total_points: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Calculate remaining role swaps for a fantasy team in the current week
 */
const getRemainingRoleSwaps = async (
  fantasyTeamId: number,
  weekNumber: number,
  connection?: PoolConnection
): Promise<number> => {
  const [swapCount] = await runQuery<Array<{ count: number }>>(
    `SELECT COUNT(*) as count FROM FantasyPlayerHistory 
     WHERE fantasy_team_id = ? AND action = 'role_changed' AND week_number = ?`,
    [fantasyTeamId, weekNumber],
    connection
  );
  return Math.max(0, 2 - (swapCount?.count || 0));
};

/**
 * Calculate remaining substitutions for a fantasy team in the current week
 */
const getRemainingSubstitutions = async (
  fantasyTeamId: number,
  weekNumber: number,
  connection?: PoolConnection
): Promise<number> => {
  const [subsCount] = await runQuery<Array<{ count: number }>>(
    `SELECT COUNT(*) as count FROM FantasyPlayerHistory 
     WHERE fantasy_team_id = ? AND action = 'removed' AND week_number = ?`,
    [fantasyTeamId, weekNumber],
    connection
  );
  return Math.max(0, 2 - (subsCount?.count || 0));
};

export interface FantasyTeamWithPlayers extends FantasyTeam {
  remaining_role_swaps?: number;
  remaining_substitutions?: number;
  current_week_number?: number;
  players: Array<{
    id: number;
    steam_id: string;
    nickname: string;
    team_name: string | null;
    team_logo: string | null;
    role: PlayerRole | null;
    player_value: number; // Current value (overridden from FantasyPlayerValues if available)
    tier?: PlayerTier; // Current tier (from FantasyPlayerValues if available)
    points_earned: number;
    individual_points: number;
    team_points: number;
    role_points: number;
    is_active: boolean;
    has_played_this_week?: boolean; // Whether player has played matches in current week
    kana_rating: number | null;
    kills: number | null;
    deaths: number | null;
    kd: number | null;
    adr: number | null;
    adr_t: number | null;
    adr_ct: number | null;
    headshots: number | null;
    headshot_percentage: number | null;
    flash_assists: number | null;
    first_kills: number | null;
    first_deaths: number | null;
    kast: number | null;
  }>;
}

export interface SubstitutionData {
  remove_steam_id: string;
  add_steam_id: string;
  new_player_value: number;
  week_number: number;
  role?: PlayerRole | null; // Optional role for the new player
}

export interface LeaderboardEntry {
  rank: number;
  fantasy_team_id: number;
  team_name: string | null;
  owner_name: string;
  total_points: number;
  is_current_user: boolean;
}

export interface PriceHistoryEntry {
  steam_id: string;
  nickname: string;
  team_name: string;
  current_value: number;
  current_tier: string;
  previous_value: number | null;
  value_change: number;
  value_change_percent: number;
  value_history: Array<{
    week_number: number;
    value: number;
    tier: string;
  }>;
}

/**
 * Get all players with their stats for a specific league and season
 * for fantasy league drafting
 * Returns current values from FantasyPlayerValues (or calculates from stats if not exists)
 */
export const getFantasyPlayersByLeague = async (
  seasonId: number,
  leagueId: number
): Promise<FantasyPlayerStats[]> => {
  const query = `
    WITH latest_values AS (
      SELECT 
        fpv.steam_id,
        fpv.value,
        fpv.tier
    FROM FantasyPlayerValues fpv
    INNER JOIN (
      SELECT steam_id, MAX(created_at) as max_created
      FROM FantasyPlayerValues
      WHERE season_id = ?
      GROUP BY steam_id
    ) latest ON latest.steam_id = fpv.steam_id AND latest.max_created = fpv.created_at
    )
    SELECT 
      p.steam_id,
      p.nickname,
      stp.team_id,
      t.name as team_name,
      t.team_logo,
      ROUND(AVG(ps.kana_rating), 2) as kana_rating,
      ROUND(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 2) as kd,
      SUM(ps.kills) as kills,
      SUM(ps.deaths) as deaths,
      ROUND(AVG(ps.adr), 1) as adr,
      ROUND(AVG(ps.adr_t), 1) as adr_t,
      ROUND(AVG(ps.adr_ct), 1) as adr_ct,
      SUM(ps.headshots) as headshots,
      ROUND((SUM(ps.headshots) / NULLIF(SUM(ps.kills), 0)) * 100, 1) as headshot_percentage,
      SUM(ps.flash_assists) as flash_assists,
      SUM(ps.first_kills) as first_kills,
      SUM(ps.first_deaths) as first_deaths,
      ROUND(AVG(ps.kast), 1) as kast,
      COUNT(DISTINCT ps.match_game_id) as maps_played,
      lv.value as db_value,
      lv.tier as db_tier
    FROM SeasonTeamPlayers stp
    INNER JOIN SteamPlayers p ON p.steam_id = stp.steam_id
    INNER JOIN Teams t ON t.id = stp.team_id
    INNER JOIN SeasonLeagueTeams slt ON slt.team_id = stp.team_id AND slt.season_id = stp.season_id
    LEFT JOIN MatchTeams mt ON mt.team_id = stp.team_id
    LEFT JOIN Matches m ON m.id = mt.match_id AND m.season_id = stp.season_id AND m.league_id = slt.league_id
    LEFT JOIN MatchGames mg ON mg.match_id = m.id
    LEFT JOIN PlayerStats ps ON ps.match_game_id = mg.id AND ps.steam_id = stp.steam_id
    LEFT JOIN latest_values lv ON lv.steam_id = p.steam_id
    WHERE stp.season_id = ? 
      AND slt.league_id = ?
    GROUP BY p.steam_id, p.nickname, stp.team_id, t.name, t.team_logo, lv.value, lv.tier
    HAVING maps_played > 0
    ORDER BY t.name ASC, kana_rating DESC
  `;

  const results = await runQuery<
    Array<{
      steam_id: string;
      nickname: string;
      team_id: number;
      team_name: string;
      team_logo: string | null;
      kana_rating: number;
      kd: number;
      kills: number;
      deaths: number;
      adr: number | null;
      adr_t: number | null;
      adr_ct: number | null;
      headshots: number;
      headshot_percentage: number;
      flash_assists: number;
      first_kills: number;
      first_deaths: number;
      kast: number | null;
      maps_played: number;
      db_value: number | null;
      db_tier: PlayerTier | null;
    }>
  >(query, [seasonId, seasonId, leagueId]);

  // Calculate values with Redis caching (same logic as top players)
  const playersWithValues = await Promise.all(
    results.map(async (row) => {
      // If we have a value in DB, use it
      if (row.db_value !== null && row.db_tier !== null) {
        return {
          steam_id: row.steam_id,
          nickname: row.nickname,
          team_id: row.team_id,
          team_name: row.team_name,
          team_logo: row.team_logo,
          kana_rating: row.kana_rating,
          kd: row.kd,
          kills: row.kills,
          deaths: row.deaths,
          adr: row.adr,
          adr_t: row.adr_t,
          adr_ct: row.adr_ct,
          headshots: row.headshots,
          headshot_percentage: row.headshot_percentage,
          flash_assists: row.flash_assists,
          first_kills: row.first_kills,
          first_deaths: row.first_deaths,
          kast: row.kast,
          maps_played: row.maps_played
        };
      }

      // Otherwise, calculate initial value from stats (with Redis cache)
      const cacheKey = `fantasy:initial_value:${seasonId}:${row.steam_id}`;

      // Try to get from cache
      const cachedValue = await redisClient.get(cacheKey);
      if (cachedValue) {
        // Cache hit - return the stats (value will be calculated on frontend from stats)
        return {
          steam_id: row.steam_id,
          nickname: row.nickname,
          team_id: row.team_id,
          team_name: row.team_name,
          team_logo: row.team_logo,
          kana_rating: row.kana_rating,
          kd: row.kd,
          kills: row.kills,
          deaths: row.deaths,
          adr: row.adr,
          adr_t: row.adr_t,
          adr_ct: row.adr_ct,
          headshots: row.headshots,
          headshot_percentage: row.headshot_percentage,
          flash_assists: row.flash_assists,
          first_kills: row.first_kills,
          first_deaths: row.first_deaths,
          kast: row.kast,
          maps_played: row.maps_played
        };
      }

      // Calculate and cache initial value
      const initialValue = calculateInitialPlayerValue(
        row.kana_rating,
        row.kd,
        row.kills
      );
      const initialTier = calculatePlayerTier(initialValue);

      // Cache for 30 days
      await redisClient
        .setex(
          cacheKey,
          30 * 24 * 60 * 60,
          JSON.stringify({ value: initialValue, tier: initialTier })
        )
        .catch((err) => {
          logger.error(
            `Failed to cache initial value for ${row.steam_id}:`,
            err
          );
        });

      return {
        steam_id: row.steam_id,
        nickname: row.nickname,
        team_id: row.team_id,
        team_name: row.team_name,
        team_logo: row.team_logo,
        kana_rating: row.kana_rating,
        kd: row.kd,
        kills: row.kills,
        deaths: row.deaths,
        adr: row.adr,
        adr_t: row.adr_t,
        adr_ct: row.adr_ct,
        headshots: row.headshots,
        headshot_percentage: row.headshot_percentage,
        flash_assists: row.flash_assists,
        first_kills: row.first_kills,
        first_deaths: row.first_deaths,
        kast: row.kast,
        maps_played: row.maps_played
      };
    })
  );

  return playersWithValues;
};

/**
 * Create a fantasy team for a user
 */
export const createFantasyTeam = async (
  data: CreateFantasyTeamData
): Promise<number> => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Validate: Must have exactly 5 players
    if (data.players.length !== 5) {
      throw new Error("Fantasy team must have exactly 5 players");
    }

    // Validate: Roles must be unique (no duplicate roles)
    const roles = data.players.map((p) => p.role).filter(Boolean);
    const uniqueRoles = new Set(roles);
    if (roles.length !== uniqueRoles.size) {
      throw new Error("Each role can only be assigned to one player");
    }

    // Calculate total cost
    const totalCost = data.players.reduce((sum, p) => sum + p.player_value, 0);
    const budgetRemaining = 1000000 - totalCost;

    if (totalCost > 1000000) {
      throw new Error("Total player value exceeds budget of 1,000,000 €");
    }

    // Check if user already has a team for this season
    const [existingTeam] = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM FantasyTeams WHERE steam_id = ? AND season_id = ?",
      [data.steam_id, data.season_id],
      connection
    );

    if (existingTeam) {
      throw new Error("User already has a fantasy team for this season");
    }

    // Insert fantasy team
    const teamResult = await runQuery<{ insertId: number }>(
      `INSERT INTO FantasyTeams (steam_id, season_id, league_id, team_name, budget_remaining)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.steam_id,
        data.season_id,
        data.league_id,
        data.team_name || null,
        budgetRemaining
      ],
      connection
    );

    const fantasyTeamId = teamResult.insertId;

    // Insert players
    for (const player of data.players) {
      await runQuery(
        `INSERT INTO FantasyTeamPlayers
         (fantasy_team_id, steam_id, role, player_value, is_active)
         VALUES (?, ?, ?, ?, TRUE)`,
        [
          fantasyTeamId,
          player.steam_id,
          player.role || null,
          player.player_value
        ],
        connection
      );

      // Log to history
      await runQuery(
        `INSERT INTO FantasyPlayerHistory 
         (fantasy_team_id, steam_id, action, new_value)
         VALUES (?, ?, 'added', ?)`,
        [
          fantasyTeamId,
          player.steam_id,
          JSON.stringify({ value: player.player_value, role: player.role })
        ],
        connection
      );
    }

    await connection.commit();
    return fantasyTeamId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get a user's fantasy team for a season
 */
export const getFantasyTeamByUser = async (
  steamId: string,
  seasonId: number,
  connection?: PoolConnection
): Promise<FantasyTeamWithPlayers | null> => {
  const [team] = await runQuery<Array<FantasyTeam>>(
    `SELECT * FROM FantasyTeams 
     WHERE steam_id = ? AND season_id = ?`,
    [steamId, seasonId],
    connection
  );

  if (!team) {
    return null;
  }

  // Calculate current week number and remaining swaps/substitutions
  const weekNumber = await getCurrentWeekNumberForSeason(seasonId, connection);
  const remainingRoleSwaps = await getRemainingRoleSwaps(
    team.id,
    weekNumber,
    connection
  );
  const remainingSubstitutions = await getRemainingSubstitutions(
    team.id,
    weekNumber,
    connection
  );

  // Get season start date for week calculation
  const seasonStartDate = await getSeasonStartDate(seasonId, connection);
  const weekStartDays = (weekNumber - 1) * 7;
  const weekEndDays = weekNumber * 7;
  const weekStartDateObj = new Date(seasonStartDate);
  weekStartDateObj.setDate(weekStartDateObj.getDate() + weekStartDays);
  weekStartDateObj.setHours(0, 0, 0, 0);
  const weekEndDateObj = new Date(seasonStartDate);
  weekEndDateObj.setDate(weekEndDateObj.getDate() + weekEndDays);
  weekEndDateObj.setHours(23, 59, 59, 999);

  const players = await runQuery<
    Array<{
      id: number;
      steam_id: string;
      nickname: string;
      team_name: string | null;
      team_logo: string | null;
      role: PlayerRole | null;
      player_value: number; // Snapshot value when added
      current_value: number | null; // Current value from FantasyPlayerValues
      current_tier: PlayerTier | null;
      points_earned: number;
      individual_points: number;
      team_points: number;
      role_points: number;
      is_active: boolean;
      has_played_this_week: number; // 0 or 1 from COUNT
      kana_rating: number | null;
      kills: number | null;
      deaths: number | null;
      kd: number | null;
      adr: number | null;
      adr_t: number | null;
      adr_ct: number | null;
      headshots: number | null;
      headshot_percentage: number | null;
      flash_assists: number | null;
      first_kills: number | null;
      first_deaths: number | null;
      kast: number | null;
    }>
  >(
    `SELECT 
       ftp.id,
       ftp.steam_id,
       sp.nickname,
       t.name as team_name,
       t.team_logo,
       ftp.role,
       ftp.player_value,
       lv.value as current_value,
       lv.tier as current_tier,
       ftp.points_earned,
       ftp.individual_points,
       ftp.team_points,
       ftp.role_points,
       ftp.is_active,
       COALESCE((
         SELECT COUNT(*) > 0
         FROM PlayerStats ps_week
         INNER JOIN MatchGames mg_week ON mg_week.id = ps_week.match_game_id
         INNER JOIN Matches m_week ON m_week.id = mg_week.match_id
         WHERE ps_week.steam_id = ftp.steam_id
           AND m_week.season_id = ?
           AND m_week.match_date >= ?
           AND m_week.match_date <= ?
           AND m_week.status = 'finished'
       ), 0) as has_played_this_week,
       AVG(ps.kana_rating) as kana_rating,
       SUM(ps.kills) as kills,
       SUM(ps.deaths) as deaths,
       ROUND(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 2) as kd,
       AVG(ps.adr) as adr,
       AVG(ps.adr_t) as adr_t,
       AVG(ps.adr_ct) as adr_ct,
       SUM(ps.headshots) as headshots,
       AVG(ps.hs_percent) as headshot_percentage,
       SUM(ps.flash_assists) as flash_assists,
       SUM(ps.first_kills) as first_kills,
       SUM(ps.first_deaths) as first_deaths,
       AVG(ps.kast) as kast
     FROM FantasyTeamPlayers ftp
     INNER JOIN SteamPlayers sp ON sp.steam_id = ftp.steam_id
     LEFT JOIN SeasonTeamPlayers latest_stp ON latest_stp.steam_id = ftp.steam_id AND latest_stp.season_id = ?
       AND latest_stp.created_at = (
         SELECT MAX(created_at)
         FROM SeasonTeamPlayers
         WHERE steam_id = ftp.steam_id AND season_id = ?
       )
     LEFT JOIN Teams t ON t.id = latest_stp.team_id
     LEFT JOIN PlayerStats ps ON ps.steam_id = ftp.steam_id 
       AND ps.match_game_id IN (
         SELECT mg.id FROM MatchGames mg
         INNER JOIN Matches m ON m.id = mg.match_id
         WHERE m.season_id = ?
       )
     LEFT JOIN (
       SELECT 
         fpv.steam_id,
         fpv.value,
         fpv.tier
       FROM FantasyPlayerValues fpv
       INNER JOIN (
         SELECT steam_id, MAX(created_at) as max_created
         FROM FantasyPlayerValues
         WHERE season_id = ?
         GROUP BY steam_id
       ) latest ON latest.steam_id = fpv.steam_id AND latest.max_created = fpv.created_at
     ) lv ON lv.steam_id = ftp.steam_id
     WHERE ftp.fantasy_team_id = ? AND ftp.is_active = TRUE
     GROUP BY ftp.id, ftp.steam_id, sp.nickname, t.name, t.team_logo, ftp.role,
              ftp.player_value, lv.value, lv.tier, ftp.points_earned, ftp.individual_points,
              ftp.team_points, ftp.role_points, ftp.is_active
     ORDER BY ftp.added_at ASC`,
    [
      seasonId, // for week calculation
      weekStartDateObj,
      weekEndDateObj,
      seasonId, // for stp join
      seasonId, // for stp subquery MAX(created_at)
      seasonId, // for PlayerStats subquery
      seasonId, // for FantasyPlayerValues subquery
      team.id
    ],
    connection
  );

  // Calculate current values for players (use FantasyPlayerValues if exists, otherwise calculate from stats)
  const playersWithCurrentValues = await Promise.all(
    players.map(async (p) => {
      // If we have a current value from FantasyPlayerValues, use it
      if (p.current_value !== null && p.current_tier !== null) {
        return {
          ...p,
          player_value: p.current_value, // Override snapshot with current value for display
          tier: p.current_tier, // Use current tier from FantasyPlayerValues
          has_played_this_week: p.has_played_this_week === 1
        };
      }

      // Otherwise, calculate from stats (with Redis cache)
      if (p.kana_rating !== null && p.kd !== null && p.kills !== null) {
        const cacheKey = `fantasy:initial_value:${seasonId}:${p.steam_id}`;

        // Try to get from cache
        const cachedValue = await redisClient.get(cacheKey);
        if (cachedValue) {
          const parsed = JSON.parse(cachedValue) as {
            value: number;
            tier: PlayerTier;
          };
          return {
            ...p,
            player_value: parsed.value, // Use cached calculated value
            tier: parsed.tier, // Use cached tier
            has_played_this_week: p.has_played_this_week === 1
          };
        }

        // Calculate and cache
        const initialValue = calculateInitialPlayerValue(
          p.kana_rating,
          p.kd,
          p.kills
        );

        // Cache for 30 days
        await redisClient
          .setex(
            cacheKey,
            30 * 24 * 60 * 60,
            JSON.stringify({
              value: initialValue,
              tier: calculatePlayerTier(initialValue)
            })
          )
          .catch((err) => {
            logger.error(
              `Failed to cache initial value for ${p.steam_id}:`,
              err
            );
          });

        const calculatedTier = calculatePlayerTier(initialValue);
        return {
          ...p,
          player_value: initialValue, // Use calculated value
          tier: calculatedTier, // Use calculated tier
          has_played_this_week: p.has_played_this_week === 1
        };
      }

      // Fallback: use original player_value if no stats available
      return {
        ...p,
        has_played_this_week: p.has_played_this_week === 1
      };
    })
  );

  return {
    ...team, // Includes steam_id from FantasyTeam interface
    players: playersWithCurrentValues,
    remaining_role_swaps: remainingRoleSwaps,
    remaining_substitutions: remainingSubstitutions,
    current_week_number: weekNumber
  };
};

/**
 * Check if a player has played matches in the current week
 */
const hasPlayerPlayedInWeek = async (
  steamId: string,
  seasonId: number,
  weekNumber: number,
  connection?: PoolConnection
): Promise<boolean> => {
  // Get season start date to calculate week boundaries
  const seasonStartDate = await getSeasonStartDate(seasonId, connection);

  // Calculate week boundaries (week 1 = days 0-6, week 2 = days 7-13, etc.)
  const weekStartDays = (weekNumber - 1) * 7;
  const weekEndDays = weekNumber * 7;

  const weekStartDate = new Date(seasonStartDate);
  weekStartDate.setDate(weekStartDate.getDate() + weekStartDays);
  weekStartDate.setHours(0, 0, 0, 0);

  const weekEndDate = new Date(seasonStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + weekEndDays);
  weekEndDate.setHours(23, 59, 59, 999);

  // Check if player has any PlayerStats entries for matches in this week
  const [result] = await runQuery<Array<{ count: number }>>(
    `SELECT COUNT(*) as count
     FROM PlayerStats ps
     INNER JOIN MatchGames mg ON mg.id = ps.match_game_id
     INNER JOIN Matches m ON m.id = mg.match_id
     WHERE ps.steam_id = ?
       AND m.season_id = ?
       AND m.match_date >= ?
       AND m.match_date <= ?
       AND m.status = 'finished'`,
    [steamId, seasonId, weekStartDate, weekEndDate],
    connection
  );

  return (result?.count || 0) > 0;
};

/**
 * Substitute a player in a fantasy team
 */
export const substitutePlayer = async (
  fantasyTeamId: number,
  data: SubstitutionData
): Promise<{ success: boolean; remaining_substitutions: number }> => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Get current team info
    const [team] = await runQuery<Array<FantasyTeam>>(
      "SELECT * FROM FantasyTeams WHERE id = ?",
      [fantasyTeamId],
      connection
    );

    if (!team) {
      throw new Error("Fantasy team not found");
    }

    // Check substitution limit (2 per week)
    const [subsCount] = await runQuery<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM FantasyPlayerHistory 
       WHERE fantasy_team_id = ? AND action = 'removed' AND week_number = ?`,
      [fantasyTeamId, data.week_number],
      connection
    );

    if (subsCount && subsCount.count >= 2) {
      throw new Error("Maximum 2 substitutions per week allowed");
    }

    // Get player being removed
    const [removedPlayer] = await runQuery<
      Array<{ player_value: number; role: PlayerRole | null }>
    >(
      "SELECT player_value, role FROM FantasyTeamPlayers WHERE fantasy_team_id = ? AND steam_id = ? AND is_active = TRUE",
      [fantasyTeamId, data.remove_steam_id],
      connection
    );

    if (!removedPlayer) {
      throw new Error("Player to remove not found in team");
    }

    // Check if the player being removed has already played in the current week
    const hasPlayed = await hasPlayerPlayedInWeek(
      data.remove_steam_id,
      team.season_id,
      data.week_number,
      connection
    );

    if (hasPlayed) {
      throw new Error(
        "Cannot substitute a player who has already played matches this week. Players are locked after their first match."
      );
    }

    // Calculate budget impact (sell at current value, buy at current value)
    const budgetChange = removedPlayer.player_value - data.new_player_value;
    const newBudget = team.budget_remaining + budgetChange;

    if (newBudget < 0) {
      throw new Error("Insufficient budget for substitution");
    }

    // Deactivate old player
    await runQuery(
      `UPDATE FantasyTeamPlayers 
       SET is_active = FALSE, removed_at = NOW()
       WHERE fantasy_team_id = ? AND steam_id = ?`,
      [fantasyTeamId, data.remove_steam_id],
      connection
    );

    // Determine role for new player (use provided role or keep old player's role)
    const newPlayerRole =
      data.role !== undefined ? data.role : removedPlayer.role;

    // Add new player
    await runQuery(
      `INSERT INTO FantasyTeamPlayers 
       (fantasy_team_id, steam_id, role, player_value, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [
        fantasyTeamId,
        data.add_steam_id,
        newPlayerRole || null,
        data.new_player_value
      ],
      connection
    );

    // Update team budget
    await runQuery(
      "UPDATE FantasyTeams SET budget_remaining = ?, updated_at = NOW() WHERE id = ?",
      [newBudget, fantasyTeamId],
      connection
    );

    // Log to history
    await runQuery(
      `INSERT INTO FantasyPlayerHistory 
       (fantasy_team_id, steam_id, action, old_value, week_number)
       VALUES (?, ?, 'removed', ?, ?)`,
      [
        fantasyTeamId,
        data.remove_steam_id,
        JSON.stringify({ value: removedPlayer.player_value }),
        data.week_number
      ],
      connection
    );

    await runQuery(
      `INSERT INTO FantasyPlayerHistory 
       (fantasy_team_id, steam_id, action, new_value, week_number)
       VALUES (?, ?, 'added', ?, ?)`,
      [
        fantasyTeamId,
        data.add_steam_id,
        JSON.stringify({ value: data.new_player_value, role: newPlayerRole }),
        data.week_number
      ],
      connection
    );

    // Calculate remaining substitutions
    const [finalSubsCount] = await runQuery<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM FantasyPlayerHistory 
       WHERE fantasy_team_id = ? AND action = 'removed' AND week_number = ?`,
      [fantasyTeamId, data.week_number],
      connection
    );

    const remainingSubstitutions = 2 - (finalSubsCount?.count || 0);

    await connection.commit();
    return { success: true, remaining_substitutions: remainingSubstitutions };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Update player roles in a fantasy team
 */
export const updatePlayerRoles = async (
  fantasyTeamId: number,
  roleUpdates: Array<{ steam_id: string; role: PlayerRole | null }>,
  weekNumber: number,
  skipSwapLimit: boolean = false
): Promise<{ success: boolean; remaining_swaps: number }> => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Fetch current roles for all players being updated
    const steamIds = roleUpdates.map((u) => u.steam_id);
    const placeholders = steamIds.map(() => "?").join(",");
    const currentPlayers = await runQuery<
      Array<{ steam_id: string; role: PlayerRole | null }>
    >(
      `SELECT steam_id, role FROM FantasyTeamPlayers 
       WHERE fantasy_team_id = ? AND steam_id IN (${placeholders}) AND is_active = TRUE`,
      [fantasyTeamId, ...steamIds],
      connection
    );

    // Create a map for easy lookup
    const currentRolesMap = new Map(
      currentPlayers.map((p) => [p.steam_id, p.role])
    );

    // Check if all players exist
    for (const update of roleUpdates) {
      if (!currentRolesMap.has(update.steam_id)) {
        throw new Error(`Player ${update.steam_id} not found in team`);
      }
    }

    // Validate: Roles must be unique across the entire team
    // Get all currently assigned roles for other players (not in this update)
    const allTeamRoles = await runQuery<
      Array<{ steam_id: string; role: PlayerRole | null }>
    >(
      `SELECT steam_id, role FROM FantasyTeamPlayers 
       WHERE fantasy_team_id = ? AND is_active = TRUE`,
      [fantasyTeamId],
      connection
    );

    // Build a map of role -> steam_id for currently assigned roles
    const roleAssignments = new Map<PlayerRole, string>();
    for (const player of allTeamRoles) {
      if (player.role !== null && !steamIds.includes(player.steam_id)) {
        // Only include roles from players NOT being updated
        roleAssignments.set(player.role, player.steam_id);
      }
    }

    // Check if any new role assignments conflict with existing ones
    for (const update of roleUpdates) {
      if (update.role !== null) {
        const existingPlayer = roleAssignments.get(update.role);
        if (existingPlayer) {
          throw new Error(
            `Role "${update.role}" is already assigned to another player`
          );
        }
        // Add this role to prevent duplicates within the update batch
        roleAssignments.set(update.role, update.steam_id);
      }
    }

    // Check role swap limit (2 per week) unless skipping
    if (!skipSwapLimit) {
      const [swapCount] = await runQuery<Array<{ count: number }>>(
        `SELECT COUNT(*) as count FROM FantasyPlayerHistory 
         WHERE fantasy_team_id = ? AND action = 'role_changed' AND week_number = ?`,
        [fantasyTeamId, weekNumber],
        connection
      );

      const currentSwaps = swapCount?.count || 0;

      // Count how many are actual swaps (player already has a role)
      const actualSwaps = roleUpdates.filter((update) => {
        const currentRole = currentRolesMap.get(update.steam_id);
        return currentRole !== null && currentRole !== undefined;
      }).length;

      if (currentSwaps + actualSwaps > 2) {
        throw new Error(
          `Maximum 2 role swaps per week allowed. You have ${2 - currentSwaps} remaining.`
        );
      }
    }

    // Update roles
    for (const update of roleUpdates) {
      const currentRole = currentRolesMap.get(update.steam_id);

      await runQuery(
        "UPDATE FantasyTeamPlayers SET role = ? WHERE fantasy_team_id = ? AND steam_id = ? AND is_active = TRUE",
        [update.role || null, fantasyTeamId, update.steam_id],
        connection
      );

      // Only log to history if it's an actual role change (not initial assignment)
      // Initial assignments have currentRole === null
      if (currentRole !== null) {
        await runQuery(
          `INSERT INTO FantasyPlayerHistory 
           (fantasy_team_id, steam_id, action, old_value, new_value, week_number)
           VALUES (?, ?, 'role_changed', ?, ?, ?)`,
          [
            fantasyTeamId,
            update.steam_id,
            JSON.stringify({ role: currentRole }),
            JSON.stringify({ role: update.role }),
            weekNumber
          ],
          connection
        );
      }
    }

    await runQuery(
      "UPDATE FantasyTeams SET updated_at = NOW() WHERE id = ?",
      [fantasyTeamId],
      connection
    );

    // Calculate remaining swaps
    const [finalSwapCount] = await runQuery<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM FantasyPlayerHistory 
       WHERE fantasy_team_id = ? AND action = 'role_changed' AND week_number = ?`,
      [fantasyTeamId, weekNumber],
      connection
    );

    const remainingSwaps = 2 - (finalSwapCount?.count || 0);

    await connection.commit();
    return { success: true, remaining_swaps: remainingSwaps };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get fantasy league leaderboard
 */
/**
 * Get overall leaderboard across all leagues in a season
 */
export const getFantasyOverallLeaderboard = async (
  seasonId: number,
  currentUserSteamId?: string,
  connection?: PoolConnection
): Promise<{
  leaderboard: Array<LeaderboardEntry & { league_name: string }>;
  currentUserRank: number | null;
}> => {
  const query = `
    WITH ranked_teams AS (
      SELECT 
        ft.id as fantasy_team_id,
        ft.steam_id,
        ft.team_name,
        sp.nickname as owner_name,
        ft.total_points,
        l.name as league_name,
        RANK() OVER (ORDER BY ft.total_points DESC) as rank
      FROM FantasyTeams ft
      INNER JOIN SteamPlayers sp ON sp.steam_id = ft.steam_id
      INNER JOIN Leagues l ON l.id = ft.league_id
      WHERE ft.season_id = ?
    )
    SELECT * FROM ranked_teams
    ORDER BY rank ASC
    LIMIT 50
  `;

  const topTeams = await runQuery<
    Array<{
      fantasy_team_id: number;
      steam_id: string;
      team_name: string | null;
      owner_name: string;
      total_points: number;
      league_name: string;
      rank: number;
    }>
  >(query, [seasonId], connection);

  const leaderboard = topTeams.map((team) => ({
    rank: team.rank,
    fantasy_team_id: team.fantasy_team_id,
    steam_id: team.steam_id,
    team_name: team.team_name,
    owner_name: team.owner_name,
    total_points: team.total_points,
    league_name: team.league_name,
    is_current_user: currentUserSteamId
      ? team.steam_id === currentUserSteamId
      : false
  }));

  // Find current user's rank if they're outside top 50
  let currentUserRank: number | null = null;
  if (currentUserSteamId) {
    const userInTop50 = leaderboard.find((entry) => entry.is_current_user);
    if (!userInTop50) {
      const [userTeam] = await runQuery<Array<{ rank: number }>>(
        `WITH ranked_teams AS (
          SELECT 
            ft.steam_id,
            RANK() OVER (ORDER BY ft.total_points DESC) as rank
          FROM FantasyTeams ft
          WHERE ft.season_id = ?
        )
        SELECT rank FROM ranked_teams
        WHERE steam_id = ?`,
        [seasonId, currentUserSteamId],
        connection
      );
      currentUserRank = userTeam?.rank || null;
    } else {
      currentUserRank = userInTop50.rank;
    }
  }

  return { leaderboard, currentUserRank };
};

export const getFantasyLeaderboard = async (
  seasonId: number,
  leagueId: number,
  currentUserSteamId?: string,
  connection?: PoolConnection
): Promise<{
  leaderboard: LeaderboardEntry[];
  currentUserRank: number | null;
  totalTeams: number;
}> => {
  const query = `
    WITH ranked_teams AS (
      SELECT 
        ft.id as fantasy_team_id,
        ft.steam_id,
        ft.team_name,
        sp.nickname as owner_name,
        ft.total_points,
        RANK() OVER (ORDER BY ft.total_points DESC) as rank
      FROM FantasyTeams ft
      INNER JOIN SteamPlayers sp ON sp.steam_id = ft.steam_id
      WHERE ft.season_id = ? AND ft.league_id = ?
    )
    SELECT * FROM ranked_teams
    ORDER BY rank ASC
    LIMIT 50
  `;

  const topTeams = await runQuery<
    Array<{
      fantasy_team_id: number;
      steam_id: string;
      team_name: string | null;
      owner_name: string;
      total_points: number;
      rank: number;
    }>
  >(query, [seasonId, leagueId], connection);

  const leaderboard: LeaderboardEntry[] = topTeams.map((team) => ({
    rank: team.rank,
    fantasy_team_id: team.fantasy_team_id,
    steam_id: team.steam_id,
    team_name: team.team_name,
    owner_name: team.owner_name,
    total_points: team.total_points,
    is_current_user: currentUserSteamId
      ? team.steam_id === currentUserSteamId
      : false
  }));

  // If user is not in top 50, get their rank separately
  let currentUserRank: number | null = null;
  if (currentUserSteamId) {
    const userInTop50 = topTeams.find((t) => t.steam_id === currentUserSteamId);

    if (!userInTop50) {
      const [userTeam] = await runQuery<Array<{ rank: number }>>(
        `SELECT 
          RANK() OVER (ORDER BY ft.total_points DESC) as rank
         FROM FantasyTeams ft
         WHERE ft.season_id = ? AND ft.league_id = ? AND ft.steam_id = ?`,
        [seasonId, leagueId, currentUserSteamId],
        connection
      );

      if (userTeam) {
        currentUserRank = userTeam.rank;
      }
    } else {
      currentUserRank = userInTop50.rank;
    }
  }

  // Get total count of teams in this division
  const [totalCountResult] = await runQuery<Array<{ count: number }>>(
    `SELECT COUNT(*) as count FROM FantasyTeams WHERE season_id = ? AND league_id = ?`,
    [seasonId, leagueId],
    connection
  );
  const totalTeams = totalCountResult?.count || 0;

  return { leaderboard, currentUserRank, totalTeams };
};

/**
 * Get price history for all players in a league
 */
export const getFantasyPriceHistory = async (
  seasonId: number,
  leagueId: number,
  connection?: PoolConnection
): Promise<PriceHistoryEntry[]> => {
  const query = `
    WITH latest_values AS (
      SELECT 
        fpv.steam_id,
        fpv.value as current_value,
        fpv.tier as current_tier,
        fpv.week_number,
        ROW_NUMBER() OVER (PARTITION BY fpv.steam_id ORDER BY fpv.created_at DESC) as rn
      FROM FantasyPlayerValues fpv
      WHERE fpv.season_id = ? AND fpv.league_id = ?
    ),
    previous_values AS (
      SELECT 
        fpv.steam_id,
        fpv.value as previous_value,
        fpv.week_number,
        ROW_NUMBER() OVER (PARTITION BY fpv.steam_id ORDER BY fpv.created_at DESC) as rn
      FROM FantasyPlayerValues fpv
      WHERE fpv.season_id = ? AND fpv.league_id = ?
    ),
    all_values AS (
      SELECT 
        fpv.steam_id,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'week_number', fpv.week_number,
            'value', fpv.value,
            'tier', fpv.tier,
            'created_at', fpv.created_at
          ) ORDER BY fpv.created_at DESC
        ) as value_history
      FROM FantasyPlayerValues fpv
      WHERE fpv.season_id = ? AND fpv.league_id = ?
      GROUP BY fpv.steam_id
    )
    SELECT 
      lv.steam_id,
      sp.nickname,
      COALESCE(t.name, 'Free Agent') as team_name,
      lv.current_value,
      lv.current_tier,
      pv.previous_value,
      COALESCE(lv.current_value - pv.previous_value, 0) as value_change,
      CASE 
        WHEN pv.previous_value > 0 
        THEN ROUND(((lv.current_value - pv.previous_value) / pv.previous_value) * 100, 2)
        ELSE 0 
      END as value_change_percent,
      av.value_history
    FROM latest_values lv
    LEFT JOIN previous_values pv ON pv.steam_id = lv.steam_id AND pv.rn = 2
    INNER JOIN all_values av ON av.steam_id = lv.steam_id
    INNER JOIN SteamPlayers sp ON sp.steam_id = lv.steam_id
    LEFT JOIN SeasonTeamPlayers stp ON stp.steam_id = lv.steam_id AND stp.season_id = ?
    LEFT JOIN Teams t ON t.id = stp.team_id
    WHERE lv.rn = 1
    ORDER BY ABS(lv.current_value - COALESCE(pv.previous_value, lv.current_value)) DESC
  `;

  const results = await runQuery<
    Array<{
      steam_id: string;
      nickname: string;
      team_name: string;
      current_value: number;
      current_tier: string;
      previous_value: number | null;
      value_change: number;
      value_change_percent: number;
      value_history: string; // JSON string
    }>
  >(
    query,
    [seasonId, leagueId, seasonId, leagueId, seasonId, leagueId, seasonId],
    connection
  );

  return results.map((row) => ({
    steam_id: row.steam_id,
    nickname: row.nickname,
    team_name: row.team_name,
    current_value: row.current_value,
    current_tier: row.current_tier,
    previous_value: row.previous_value,
    value_change: row.value_change,
    value_change_percent: row.value_change_percent,
    value_history: JSON.parse(row.value_history)
  }));
};

/**
 * Get top performing players in a league for fantasy
 * Shows players sorted by total fantasy points earned
 */
export const getTopPerformingPlayers = async (
  seasonId: number,
  leagueId: number,
  limit: number = 50,
  connection?: PoolConnection
): Promise<
  Array<{
    steam_id: string;
    nickname: string;
    team_name: string;
    team_logo: string | null;
    total_points: number;
    current_value: number;
    tier: PlayerTier;
    kana_rating: number;
    kd: number;
    is_on_fantasy_team: boolean;
  }>
> => {
  const query = `
    WITH player_points AS (
      SELECT 
        ftp.steam_id,
        SUM(fpl.points_earned) as total_points
      FROM FantasyTeamPlayers ftp
      INNER JOIN FantasyPointsLog fpl ON fpl.fantasy_team_player_id = ftp.id
      INNER JOIN FantasyTeams ft ON ft.id = ftp.fantasy_team_id
      WHERE ft.season_id = ? AND ft.league_id = ?
      GROUP BY ftp.steam_id
    ),
    latest_values AS (
      SELECT 
        fpv.steam_id,
        fpv.value,
        fpv.tier
    FROM FantasyPlayerValues fpv
    INNER JOIN (
      SELECT steam_id, MAX(created_at) as max_created
      FROM FantasyPlayerValues
      WHERE season_id = ?
      GROUP BY steam_id
    ) latest ON latest.steam_id = fpv.steam_id AND latest.max_created = fpv.created_at
    ),
    avg_stats AS (
      SELECT 
        ps.steam_id,
        AVG(ps.kana_rating) as avg_rating,
        SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0) as kd,
        SUM(ps.kills) as total_kills
      FROM PlayerStats ps
      INNER JOIN MatchGames mg ON mg.id = ps.match_game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      WHERE m.season_id = ? AND m.league_id = ?
      GROUP BY ps.steam_id
    )
    SELECT 
      sp.steam_id,
      sp.nickname,
      COALESCE(t.name, 'Free Agent') as team_name,
      t.team_logo,
      COALESCE(pp.total_points, 0) as total_points,
      COALESCE(lv.value, NULL) as db_value,
      COALESCE(lv.tier, NULL) as db_tier,
      COALESCE(astats.avg_rating, 0) as kana_rating,
      COALESCE(astats.kd, 0) as kd,
      COALESCE(astats.total_kills, 0) as total_kills,
      CASE WHEN ftp_check.steam_id IS NOT NULL THEN 1 ELSE 0 END as is_on_fantasy_team
    FROM SteamPlayers sp
    INNER JOIN SeasonTeamPlayers stp ON stp.steam_id = sp.steam_id AND stp.season_id = ?
    INNER JOIN SeasonLeagueTeams slt ON slt.team_id = stp.team_id AND slt.season_id = stp.season_id AND slt.league_id = ?
    INNER JOIN Teams t ON t.id = stp.team_id
    LEFT JOIN player_points pp ON pp.steam_id = sp.steam_id
      LEFT JOIN latest_values lv ON lv.steam_id = sp.steam_id
    LEFT JOIN avg_stats astats ON astats.steam_id = sp.steam_id
      LEFT JOIN (
        SELECT DISTINCT ftp.steam_id
        FROM FantasyTeamPlayers ftp
        INNER JOIN FantasyTeams ft ON ft.id = ftp.fantasy_team_id
        WHERE ft.season_id = ? AND ft.league_id = ? AND ftp.is_active = TRUE
      ) ftp_check ON ftp_check.steam_id = sp.steam_id
    ORDER BY COALESCE(pp.total_points, 0) DESC, COALESCE(astats.avg_rating, 0) DESC
    LIMIT ?
  `;

  const results = await runQuery<
    Array<{
      steam_id: string;
      nickname: string;
      team_name: string;
      team_logo: string | null;
      total_points: number;
      db_value: number | null;
      db_tier: PlayerTier | null;
      kana_rating: number;
      kd: number;
      total_kills: number;
      is_on_fantasy_team: number;
    }>
  >(
    query,
    [
      // player_points CTE: seasonId, leagueId
      seasonId,
      leagueId,
      // latest_values CTE: seasonId
      seasonId,
      // avg_stats CTE: seasonId, leagueId
      seasonId,
      leagueId,
      // Main query: seasonId (stp), leagueId (slt), seasonId (ftp_check), leagueId (ftp_check), limit
      seasonId,
      leagueId,
      seasonId,
      leagueId,
      limit
    ],
    connection
  );

  // Calculate values with Redis caching for initial values
  const playersWithValues = await Promise.all(
    results.map(async (row) => {
      // If we have a value in DB, use it
      if (row.db_value !== null && row.db_tier !== null) {
        return {
          ...row,
          current_value: row.db_value,
          tier: row.db_tier,
          is_on_fantasy_team: row.is_on_fantasy_team === 1
        };
      }

      // Otherwise, calculate initial value from stats (with Redis cache)
      const cacheKey = `fantasy:initial_value:${seasonId}:${row.steam_id}`;

      // Try to get from cache
      const cachedValue = await redisClient.get(cacheKey);
      if (cachedValue) {
        const parsed = JSON.parse(cachedValue) as {
          value: number;
          tier: PlayerTier;
        };
        return {
          ...row,
          current_value: parsed.value,
          tier: parsed.tier,
          is_on_fantasy_team: row.is_on_fantasy_team === 1
        };
      }

      // Calculate initial value from stats (same logic as drafting page)
      const initialValue = calculateInitialPlayerValue(
        row.kana_rating,
        row.kd,
        row.total_kills
      );
      const initialTier = calculatePlayerTier(initialValue);

      // Cache for 30 days
      await redisClient
        .setex(
          cacheKey,
          30 * 24 * 60 * 60,
          JSON.stringify({ value: initialValue, tier: initialTier })
        )
        .catch((err) => {
          // Log but don't fail if Redis is unavailable
          logger.error(
            `Failed to cache initial value for ${row.steam_id}:`,
            err
          );
        });

      return {
        steam_id: row.steam_id,
        nickname: row.nickname,
        team_name: row.team_name,
        team_logo: row.team_logo,
        total_points: row.total_points,
        current_value: initialValue,
        tier: initialTier,
        kana_rating: row.kana_rating,
        kd: row.kd,
        is_on_fantasy_team: row.is_on_fantasy_team === 1
      };
    })
  );

  return playersWithValues;
};

/**
 * Get point history for a specific fantasy team player
 * Shows detailed breakdown of points earned per match
 */
export const getPlayerPointHistory = async (
  steamId: string,
  seasonId: number,
  connection?: PoolConnection
): Promise<
  Array<{
    match_game_id: number;
    match_date: Date;
    opponent: string;
    map_name: string;
    points_earned: number;
    individual_points: number;
    team_points: number;
    role_points: number;
    stats_breakdown: {
      kills: number;
      deaths: number;
      assists: number;
      flash_assists: number;
      first_kills: number;
      first_deaths: number;
      kills_3: number;
      kills_4: number;
      kills_5: number;
      clutches_won: number;
      awp_kills: number;
      mvps: number;
      kana_rating: number;
      kd: number;
      adr: number;
      kast: number;
      hs_percent: number;
      team_won: boolean;
    };
    points_breakdown: {
      kills: number;
      deaths: number;
      assists: number;
      flash_assists: number;
      opening_kills: number;
      opening_deaths: number;
      multi_kills: number;
      clutches: number;
      mvps: number;
      team_result: number;
      adr_bonus: number;
      kd_bonus: number;
      kast_bonus: number;
      hs_bonus: number;
      role_multiplier: number;
    };
  }>
> => {
  const query = `
    SELECT 
      fpl.match_game_id,
      m.match_date,
      map.name as map_name,
      opponent_team.name as opponent,
      NULL as opponent_logo,
      fpl.points_earned,
      fpl.individual_points,
      fpl.team_points,
      fpl.role_points,
      fpl.stats_breakdown,
      fpl.points_breakdown
    FROM FantasyPointsLog fpl
    INNER JOIN FantasyTeamPlayers ftp ON ftp.id = fpl.fantasy_team_player_id
    INNER JOIN FantasyTeams ft ON ft.id = ftp.fantasy_team_id
    INNER JOIN MatchGames mg ON mg.id = fpl.match_game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    INNER JOIN Maps map ON map.id = mg.map_id
    LEFT JOIN SeasonTeamPlayers stp ON stp.steam_id = ftp.steam_id AND stp.season_id = ?
    LEFT JOIN MatchTeams player_match_team ON player_match_team.match_id = m.id AND player_match_team.team_id = stp.team_id
    LEFT JOIN MatchTeams opponent_match_team ON opponent_match_team.match_id = m.id AND opponent_match_team.team_id != stp.team_id
    LEFT JOIN Teams opponent_team ON opponent_team.id = opponent_match_team.team_id
    WHERE ftp.steam_id = ?
      AND ft.season_id = ?
      AND ftp.is_active = TRUE
    ORDER BY m.match_date DESC, fpl.match_game_id DESC
  `;

  const results = await runQuery<
    Array<{
      match_game_id: number;
      match_date: Date;
      map_name: string;
      opponent: string;
      opponent_logo: string | null;
      points_earned: number;
      individual_points: number;
      team_points: number;
      role_points: number;
      stats_breakdown: string; // JSON string
      points_breakdown: string; // JSON string
    }>
  >(query, [seasonId, steamId, seasonId], connection);

  return results.map((row) => ({
    match_game_id: row.match_game_id,
    match_date: row.match_date,
    opponent: row.opponent,
    opponent_logo: row.opponent_logo,
    map_name: row.map_name,
    points_earned: row.points_earned,
    individual_points: row.individual_points,
    team_points: row.team_points,
    role_points: row.role_points,
    stats_breakdown: JSON.parse(row.stats_breakdown),
    points_breakdown: JSON.parse(row.points_breakdown)
  }));
};
