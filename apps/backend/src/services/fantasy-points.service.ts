import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import type { PoolConnection } from "mysql2/promise";
import type { PlayerRole } from "../models/fantasy.models";
import { logger } from "../utils/app-logger";
import {
  calculateValueChangeFromMatch,
  calculatePlayerTier,
  calculateInitialPlayerValue
} from "@eggosystem/types";

// Point calculation constants
const AVERAGE_RATING = 0.7; // Rating baseline for 0 points
const BASELINE_KD = 1.0; // K/D baseline for 0 points
const RATING_MULTIPLIER = 30; // Multiplier for rating-based points
const KD_MULTIPLIER = 8; // Multiplier for K/D modifier
const KD_MIN_POINTS = -5; // Minimum K/D modifier points
const KD_MAX_POINTS = 8; // Maximum K/D modifier points

// Impact play constants - REDUCED for balance
const OPENING_KILL_POINTS = 1; // Points per opening kill (reduced from 3)
const OPENING_DEATH_PENALTY = 1; // Points penalty per opening death (reduced from 2)
const MULTI_KILL_3_POINTS = 1; // Points for 3K (reduced from 2)
const MULTI_KILL_4_POINTS = 2; // Points for 4K (reduced from 4)
const MULTI_KILL_5_POINTS = 3; // Points for 5K (reduced from 6)
const CLUTCH_POINTS = 2; // Points per clutch won (reduced from 5)
const MVP_POINTS = 2; // Points per MVP (reduced from 4)

// Performance bonus thresholds - REDUCED for balance
const ADR_THRESHOLD_90 = 90; // ADR threshold for +1 bonus
const ADR_THRESHOLD_95 = 95; // ADR threshold for +2 bonus
const ADR_BONUS_90 = 1;
const ADR_BONUS_95 = 2;

const KAST_THRESHOLD_MEDIUM = 75; // KAST threshold for +1 bonus
const KAST_THRESHOLD_HIGH = 80; // KAST threshold for +2 bonus
const KAST_BONUS_MEDIUM = 1;
const KAST_BONUS_HIGH = 2;

const HS_THRESHOLD_MEDIUM = 50; // Headshot% threshold for +1 bonus
const HS_THRESHOLD_HIGH = 60; // Headshot% threshold for +2 bonus
const HS_BONUS_MEDIUM = 1;
const HS_BONUS_HIGH = 2;

// Assist calculation - REDUCED for balance
const ASSIST_MULTIPLIER = 0.3; // Multiplier for assists (0.3 points per assist, reduced from 0.5)

// Point clamping limits
const MIN_INDIVIDUAL_POINTS = -30; // Minimum individual points per match
const MAX_INDIVIDUAL_POINTS = 30; // Maximum individual points per match

// Team result points
const TEAM_WIN_POINTS = 5; // Points for team win
const TEAM_LOSS_PENALTY = -5; // Points penalty for team loss

// Role bonus multipliers
const ROLE_MULTIPLIER_MAIN_AWP = 0.2; // 20% bonus for AWP kills
const AWP_KILL_BASE_POINTS = 5; // Base points per AWP kill (reduced from 10 for balance)
const ROLE_MULTIPLIER_LEADER = 0.2; // 20% multiplier to all points
const ROLE_MULTIPLIER_SUPPORT = 0.25; // 25% bonus for assists
const ROLE_MULTIPLIER_ENTRY_FRAGGER = 0.3; // 30% bonus for opening kills
const ROLE_MULTIPLIER_DEFENDER = 0.15; // 15% bonus for CT-side defense
const ROLE_MULTIPLIER_HS_MACHINE = 0.25; // 25% bonus for kills when HS% > 50%
const ROLE_MULTIPLIER_MULTI_FRAGGER = 0.3; // 30% bonus for multi-kills
const ROLE_MULTIPLIER_ATTACKER = 0.2; // 20% bonus for T-side performance
const ROLE_MULTIPLIER_CAMPER = 0.15; // 15% bonus for trades and site defense
const ROLE_MULTIPLIER_STATHUNTER = 0.2; // 20% bonus if rating > 1.0
const ROLE_MULTIPLIER_NOOB = 0.5; // 50% bonus if K/D < 0.8 and positive points
const _ROLE_MULTIPLIER_ECO_FRIENDLY = 0.15; // 15% bonus for kills (eco role removed)
const ROLE_MULTIPLIER_FLASH_MASTER = 0.3; // 30% bonus for flash assists
const FLASH_ASSIST_MINIMUM = 3; // Minimum flash assists for flash_master bonus
const ROLE_MULTIPLIER_CLUTCH_1V1 = 0.4; // 40% bonus for 1v1 clutches
const _ROLE_MULTIPLIER_CLUTCH_1V2PLUS = 0.6; // 60% bonus for 1v2+ clutches (not currently used)
const ROLE_MULTIPLIER_FIRST_BLOOD_KILLS = 0.35; // 35% bonus for first kills
const ROLE_MULTIPLIER_FIRST_BLOOD_DEATHS = 0.15; // 15% penalty for first deaths
const ROLE_MULTIPLIER_T_SPECIALIST = 0.25; // 25% bonus for T-side performance
const ROLE_MULTIPLIER_CT_SPECIALIST = 0.25; // 25% bonus for CT-side performance
const ROLE_MULTIPLIER_ANCHOR = 0.2; // 20% bonus for anchor play

// Role-specific thresholds
const NOOB_KD_THRESHOLD = 0.8; // K/D threshold for noob role bonus
const STATHUNTER_KD_THRESHOLD = 1.0; // K/D threshold for stathunter role bonus

export interface PlayerGameStats {
  steam_id: string;
  kana_rating: number;
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
  adr: number;
  kd: number;
  kast: number;
  hs_percent: number;
  team_won: boolean; // Whether the player's team won this match
}

export interface FantasyTeamPlayerInfo {
  fantasy_team_player_id: number;
  fantasy_team_id: number;
  steam_id: string;
  role: PlayerRole | null;
}

export interface PointsBreakdown {
  kills: number;
  deaths: number;
  assists: number;
  flash_assists: number;
  opening_kills: number;
  opening_deaths: number;
  multi_kills: number;
  clutches: number;
  mvps: number;
  team_result: number; // +10 for win, -5 for loss
  rating_base: number;
  adr_bonus: number;
  kd_bonus: number;
  kast_bonus: number;
  hs_bonus: number;
  role_multiplier: number;
}

/**
 * Calculate base fantasy points for a player's performance in a SINGLE MATCH
 *
 * DESIGN PHILOSOPHY:
 * - Points range: -30 to +30 (naturally, not clamped)
 * - Average performance (rating ~0.70, K/D ~1.0) = ~0 points
 * - Good performance (rating 1.0+, K/D 1.3+) = +10 to +20
 * - Excellent performance (rating 1.2+, K/D 1.5+, multi-kills) = +20 to +30
 * - Poor performance (rating < 0.5, K/D < 0.7) = -10 to -20
 * - Terrible performance (rating < 0.3) = -20 to -30
 *
 * Uses rating as primary metric since it already captures overall performance,
 * then adds modifiers for specific achievements and impact plays.
 */
export const calculateBasePoints = (
  stats: PlayerGameStats
): {
  individualPoints: number;
  teamPoints: number;
  breakdown: PointsBreakdown;
} => {
  const breakdown: PointsBreakdown = {
    kills: 0,
    deaths: 0,
    assists: 0,
    flash_assists: 0,
    opening_kills: 0,
    opening_deaths: 0,
    multi_kills: 0,
    clutches: 0,
    mvps: 0,
    team_result: 0,
    rating_base: 0,
    adr_bonus: 0,
    kd_bonus: 0,
    kast_bonus: 0,
    hs_bonus: 0,
    role_multiplier: 0
  };

  // 1. BASE POINTS FROM RATING (-15 to +15)
  // Rating 0.70 = 0 points (average), 1.20 = +15, 0.30 = -12
  const ratingBase = (stats.kana_rating - AVERAGE_RATING) * RATING_MULTIPLIER;
  // Store actual kills/deaths in breakdown for role calculations (but NOT as direct points)
  // Kills/deaths are already factored into rating, so they don't give additional points
  breakdown.kills = stats.kills; // Used for role bonuses only, not displayed as points
  breakdown.deaths = -stats.deaths; // Used for reference only, not displayed as points
  breakdown.rating_base = Math.floor(ratingBase);
  let points = breakdown.rating_base;

  // 2. K/D MODIFIER (-5 to +8)
  // K/D 1.0 = 0, K/D 1.5 = +4, K/D 0.5 = -4
  const kdModifier = (stats.kd - BASELINE_KD) * KD_MULTIPLIER;
  breakdown.kd_bonus = Math.floor(
    Math.max(KD_MIN_POINTS, Math.min(KD_MAX_POINTS, kdModifier))
  );
  points += breakdown.kd_bonus;

  // 3. IMPACT PLAYS (+0 to +12)
  // Opening kills/deaths (high impact)
  const openingImpact =
    stats.first_kills * OPENING_KILL_POINTS -
    stats.first_deaths * OPENING_DEATH_PENALTY;
  breakdown.opening_kills = stats.first_kills * OPENING_KILL_POINTS;
  breakdown.opening_deaths = stats.first_deaths * -OPENING_DEATH_PENALTY;
  points += openingImpact;

  // Multi-kills (2K is normal, 3K+ is special) - Reduced points
  const multiKillBonus =
    stats.kills_3 * MULTI_KILL_3_POINTS +
    stats.kills_4 * MULTI_KILL_4_POINTS +
    stats.kills_5 * MULTI_KILL_5_POINTS;
  breakdown.multi_kills = multiKillBonus;
  points += multiKillBonus;

  // Clutches (very high value)
  const clutchBonus = stats.clutches_won * CLUTCH_POINTS;
  breakdown.clutches = clutchBonus;
  points += clutchBonus;

  // MVPs
  const mvpBonus = stats.mvps * MVP_POINTS;
  breakdown.mvps = mvpBonus;
  points += mvpBonus;

  // 4. PERFORMANCE BONUSES (+0 to +4)
  // ADR bonus (damage output)
  if (stats.adr >= ADR_THRESHOLD_95) {
    breakdown.adr_bonus = ADR_BONUS_95;
    points += ADR_BONUS_95;
  } else if (stats.adr >= ADR_THRESHOLD_90) {
    breakdown.adr_bonus = ADR_BONUS_90;
    points += ADR_BONUS_90;
  }

  // KAST bonus (consistency)
  if (stats.kast > KAST_THRESHOLD_HIGH) {
    breakdown.kast_bonus = KAST_BONUS_HIGH;
    points += KAST_BONUS_HIGH;
  } else if (stats.kast > KAST_THRESHOLD_MEDIUM) {
    breakdown.kast_bonus = KAST_BONUS_MEDIUM;
    points += KAST_BONUS_MEDIUM;
  }

  // Headshot% bonus (accuracy)
  if (stats.hs_percent > HS_THRESHOLD_HIGH) {
    breakdown.hs_bonus = HS_BONUS_HIGH;
    points += HS_BONUS_HIGH;
  } else if (stats.hs_percent > HS_THRESHOLD_MEDIUM) {
    breakdown.hs_bonus = HS_BONUS_MEDIUM;
    points += HS_BONUS_MEDIUM;
  }

  // Assists/Flash assists (teamplay)
  const assistBonus =
    Math.floor(stats.assists * ASSIST_MULTIPLIER) + stats.flash_assists;
  breakdown.assists = Math.floor(stats.assists * ASSIST_MULTIPLIER);
  breakdown.flash_assists = stats.flash_assists;
  points += assistBonus;

  // 5. FINAL CLAMPING (should rarely hit limits with this system)
  // Only clamp at extreme values to prevent exploits
  const individualPoints = Math.floor(
    Math.max(MIN_INDIVIDUAL_POINTS, Math.min(MAX_INDIVIDUAL_POINTS, points))
  );

  // Team result (separate from individual performance)
  breakdown.team_result = stats.team_won ? TEAM_WIN_POINTS : TEAM_LOSS_PENALTY;
  const teamPoints = breakdown.team_result;

  return { individualPoints, teamPoints, breakdown };
};

/**
 * Apply role multipliers and bonuses to base points
 * Based on the role system in docs/fantasy-league.md
 */
export const applyRoleBonus = (
  individualPoints: number,
  teamPoints: number,
  breakdown: PointsBreakdown,
  role: PlayerRole | null,
  stats: PlayerGameStats
): {
  totalPoints: number;
  roleBonus: number;
  updatedBreakdown: PointsBreakdown;
} => {
  if (!role) {
    return {
      totalPoints: individualPoints + teamPoints,
      roleBonus: 0,
      updatedBreakdown: breakdown
    };
  }

  let roleBonus = 0;
  const updatedBreakdown = { ...breakdown };
  const basePoints = individualPoints + teamPoints;

  switch (role) {
    case "main_awp":
      // +20% bonus for AWP kills
      roleBonus = Math.floor(
        stats.awp_kills * AWP_KILL_BASE_POINTS * ROLE_MULTIPLIER_MAIN_AWP
      );
      break;

    case "leader":
      // +20% bonus to individual points
      roleBonus = Math.floor(individualPoints * ROLE_MULTIPLIER_LEADER);
      break;

    case "support": {
      // +25% bonus for assists and flash assists
      const assistPoints = breakdown.assists + breakdown.flash_assists;
      roleBonus = Math.floor(assistPoints * ROLE_MULTIPLIER_SUPPORT);
      break;
    }

    case "entry_fragger":
      // +30% bonus for opening kills
      roleBonus = Math.floor(
        breakdown.opening_kills * ROLE_MULTIPLIER_ENTRY_FRAGGER
      );
      break;

    case "defender": {
      // +15% bonus for defensive play (assists, KAST)
      const defensiveBonus =
        stats.assists + (stats.kast > 70 ? stats.kast - 70 : 0);
      roleBonus = Math.floor(defensiveBonus * ROLE_MULTIPLIER_DEFENDER);
      break;
    }

    case "hs_machine":
      // +25% bonus when headshot % > 50%
      if (stats.hs_percent > HS_THRESHOLD_MEDIUM) {
        roleBonus = Math.floor(breakdown.kills * ROLE_MULTIPLIER_HS_MACHINE);
      }
      break;

    case "multi_fragger":
      // +30% bonus for multi-kill rounds
      roleBonus = Math.floor(
        breakdown.multi_kills * ROLE_MULTIPLIER_MULTI_FRAGGER
      );
      break;

    case "attacker": {
      // +20% bonus for aggressive play (high kills, ADR)
      const aggressiveBonus =
        stats.kills + (stats.adr > 80 ? (stats.adr - 80) * 0.3 : 0);
      roleBonus = Math.floor(aggressiveBonus * ROLE_MULTIPLIER_ATTACKER);
      break;
    }

    case "camper": {
      // +15% bonus for defensive/trade play
      const camperKastBonus = stats.kast > 75 ? stats.kast - 75 : 0;
      roleBonus = Math.floor(
        (stats.assists + camperKastBonus) * ROLE_MULTIPLIER_CAMPER
      );
      break;
    }

    case "stathunter":
      // +20% bonus if rating > threshold (using actual performance metric)
      if (stats.kana_rating > STATHUNTER_KD_THRESHOLD) {
        roleBonus = Math.floor(basePoints * ROLE_MULTIPLIER_STATHUNTER);
      }
      break;

    case "noob":
      // +50% bonus if K/D < 0.8 but positive points (underdog)
      if (stats.kd < NOOB_KD_THRESHOLD && basePoints > 0) {
        roleBonus = Math.floor(basePoints * ROLE_MULTIPLIER_NOOB);
      }
      break;

    // Eco Friendly role removed - eco detection not implemented

    case "flash_master":
      // +30% bonus for flash assists (minimum 3 per map)
      if (stats.flash_assists >= FLASH_ASSIST_MINIMUM) {
        roleBonus = Math.floor(
          breakdown.flash_assists * ROLE_MULTIPLIER_FLASH_MASTER
        );
      }
      break;

    case "clutch_player":
      // +40% bonus for clutch performance
      roleBonus = Math.floor(breakdown.clutches * ROLE_MULTIPLIER_CLUTCH_1V1);
      break;

    case "first_blood": {
      // +35% bonus for first kills, -15% penalty for first deaths
      roleBonus = Math.floor(
        breakdown.opening_kills * ROLE_MULTIPLIER_FIRST_BLOOD_KILLS
      );
      // Note: opening_deaths is already negative
      roleBonus += Math.floor(
        Math.abs(breakdown.opening_deaths) * ROLE_MULTIPLIER_FIRST_BLOOD_DEATHS
      );
      break;
    }

    case "t_specialist": {
      // +25% bonus for T-side performance (high ADR, kills)
      const tBonus =
        stats.kills + (stats.adr > 75 ? (stats.adr - 75) * 0.4 : 0);
      roleBonus = Math.floor(tBonus * ROLE_MULTIPLIER_T_SPECIALIST);
      break;
    }

    case "ct_specialist": {
      // +25% bonus for CT-side performance (high assists, KAST)
      const ctBonus =
        stats.assists + (stats.kast > 70 ? (stats.kast - 70) * 0.5 : 0);
      roleBonus = Math.floor(ctBonus * ROLE_MULTIPLIER_CT_SPECIALIST);
      break;
    }

    case "anchor": {
      // +20% bonus for anchor/defensive positioning
      const anchorKastBonus =
        stats.kast > 70 ? Math.floor((stats.kast - 70) * 0.3) : 0;
      roleBonus = Math.floor(
        (stats.assists + anchorKastBonus) * ROLE_MULTIPLIER_ANCHOR
      );
      break;
    }

    default:
      roleBonus = 0;
  }

  updatedBreakdown.role_multiplier = roleBonus;

  return {
    totalPoints: basePoints + roleBonus,
    roleBonus,
    updatedBreakdown
  };
};

/**
 * Get player stats for a specific match game
 * Queries PlayerStats directly - this is the source of truth for player performance
 */
const getPlayerStatsForGame = async (
  matchGameId: number,
  connection?: PoolConnection
): Promise<PlayerGameStats[]> => {
  const query = `
    SELECT 
      ps.steam_id,
      ps.kana_rating,
      ps.kills,
      ps.deaths,
      ps.assists,
      ps.flash_assists,
      ps.first_kills,
      ps.first_deaths,
      ps.kills_3,
      ps.kills_4,
      ps.kills_5,
      ps.clutches_won,
      ps.awp_kills,
      ps.mvps,
      ps.adr,
      ROUND(ps.kills / NULLIF(ps.deaths, 0), 2) as kd,
      ps.kast,
      ps.hs_percent,
      CASE 
        WHEN player_team.score > opponent_team.score THEN TRUE
        ELSE FALSE
      END as team_won
    FROM PlayerStats ps
    INNER JOIN SeasonTeamPlayers stp ON stp.steam_id = ps.steam_id 
      AND stp.season_id = (SELECT season_id FROM MatchGames WHERE id = ?)
    INNER JOIN TeamGameScores player_team ON player_team.match_game_id = ps.match_game_id 
      AND player_team.team_id = stp.team_id
    INNER JOIN TeamGameScores opponent_team ON opponent_team.match_game_id = ps.match_game_id 
      AND opponent_team.team_id != stp.team_id
    WHERE ps.match_game_id = ?
  `;

  return runQuery<PlayerGameStats[]>(
    query,
    [matchGameId, matchGameId],
    connection
  );
};

/**
 * Get all fantasy team players who have a specific player in their roster
 */
const getFantasyTeamPlayersForGame = async (
  steamIds: string[],
  connection?: PoolConnection
): Promise<FantasyTeamPlayerInfo[]> => {
  if (steamIds.length === 0) {
    return [];
  }

  const placeholders = steamIds.map(() => "?").join(",");
  const query = `
    SELECT 
      ftp.id as fantasy_team_player_id,
      ftp.fantasy_team_id,
      ftp.steam_id,
      ftp.role
    FROM FantasyTeamPlayers ftp
    WHERE ftp.steam_id IN (${placeholders})
      AND ftp.is_active = TRUE
  `;

  return runQuery<FantasyTeamPlayerInfo[]>(query, steamIds, connection);
};

/**
 * Main function: Calculate and save fantasy points for all players in a match game
 * This should be called after demo processing is complete
 */
/**
 * Store global player points (without role bonuses) for leaderboard
 */
const storeGlobalPlayerPoints = async (
  steamId: string,
  matchGameId: number,
  individualPoints: number,
  teamPoints: number,
  playerStats: PlayerGameStats,
  pointsBreakdown: PointsBreakdown,
  connection: PoolConnection
): Promise<void> => {
  const totalPoints = individualPoints + teamPoints;

  // Create stats breakdown (raw player stats from the match)
  const statsBreakdown = {
    kills: playerStats.kills,
    deaths: playerStats.deaths,
    assists: playerStats.assists,
    flash_assists: playerStats.flash_assists,
    first_kills: playerStats.first_kills,
    first_deaths: playerStats.first_deaths,
    kills_3: playerStats.kills_3,
    kills_4: playerStats.kills_4,
    kills_5: playerStats.kills_5,
    clutches_won: playerStats.clutches_won,
    awp_kills: playerStats.awp_kills,
    mvps: playerStats.mvps,
    kana_rating: playerStats.kana_rating,
    kd: playerStats.kd,
    adr: playerStats.adr,
    kast: playerStats.kast,
    hs_percent: playerStats.hs_percent,
    team_won: playerStats.team_won
  };

  try {
    // Insert into GlobalPlayerPointsLog
    await runQuery(
      `INSERT INTO GlobalPlayerPointsLog
       (steam_id, match_game_id, points_earned, individual_points, team_points, stats_breakdown, points_breakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        steamId,
        matchGameId,
        totalPoints,
        individualPoints,
        teamPoints,
        JSON.stringify(statsBreakdown),
        JSON.stringify(pointsBreakdown)
      ],
      connection
    );

    // Update or insert GlobalPlayerPoints (aggregated totals)
    await runQuery(
      `INSERT INTO GlobalPlayerPoints
       (steam_id, season_id, total_points, individual_points, team_points, updated_at)
       VALUES (?, (SELECT season_id FROM MatchGames mg INNER JOIN Matches m ON m.id = mg.match_id WHERE mg.id = ?), ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         total_points = total_points + VALUES(total_points),
         individual_points = individual_points + VALUES(individual_points),
         team_points = team_points + VALUES(team_points),
         updated_at = NOW()`,
      [steamId, matchGameId, totalPoints, individualPoints, teamPoints],
      connection
    );
  } catch (error: unknown) {
    // Handle race condition: if another process already logged points for this match
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      logger.info(
        `Global points already logged for player ${steamId} in match ${matchGameId}`
      );
      return;
    }
    // Re-throw other errors
    throw error;
  }
};

export const calculateFantasyPointsForGame = async (
  matchGameId: number
): Promise<void> => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Get all player stats for this game
    const playerStats = await getPlayerStatsForGame(matchGameId, connection);

    if (playerStats.length === 0) {
      logger.info(`No player stats found for match game ${matchGameId}`);
      await connection.commit();
      return;
    }

    // Get all fantasy team players who have these players
    const steamIds = playerStats.map((ps) => ps.steam_id);
    const fantasyTeamPlayers = await getFantasyTeamPlayersForGame(
      steamIds,
      connection
    );

    // Calculate points for ALL players (global leaderboard) and fantasy team players
    for (const playerStat of playerStats) {
      // Calculate base points (same for all players)
      const { individualPoints, teamPoints, breakdown } =
        calculateBasePoints(playerStat);

      // Store global points (no role bonuses)
      await storeGlobalPlayerPoints(
        playerStat.steam_id,
        matchGameId,
        individualPoints,
        teamPoints,
        playerStat,
        breakdown,
        connection
      );

      // Check if this player is on a fantasy team
      const fantasyPlayer = fantasyTeamPlayers.find(
        (ftp) => ftp.steam_id === playerStat.steam_id
      );

      if (fantasyPlayer) {
        // Apply role bonuses for fantasy team players
        const { totalPoints, roleBonus, updatedBreakdown } = applyRoleBonus(
          individualPoints,
          teamPoints,
          breakdown,
          fantasyPlayer.role,
          playerStat
        );

        // Create stats breakdown (raw player stats from the match)
        const statsBreakdown = {
          kills: playerStat.kills,
          deaths: playerStat.deaths,
          assists: playerStat.assists,
          flash_assists: playerStat.flash_assists,
          first_kills: playerStat.first_kills,
          first_deaths: playerStat.first_deaths,
          kills_3: playerStat.kills_3,
          kills_4: playerStat.kills_4,
          kills_5: playerStat.kills_5,
          clutches_won: playerStat.clutches_won,
          awp_kills: playerStat.awp_kills,
          mvps: playerStat.mvps,
          kana_rating: playerStat.kana_rating,
          kd: playerStat.kd,
          adr: playerStat.adr,
          kast: playerStat.kast,
          hs_percent: playerStat.hs_percent,
          team_won: playerStat.team_won
        };

        // Try to insert points log - handle race condition via unique constraint
        // The unique constraint on (fantasy_team_player_id, match_game_id) prevents duplicates
        try {
          // Save to FantasyPointsLog
          await runQuery(
            `INSERT INTO FantasyPointsLog
           (fantasy_team_player_id, match_game_id, points_earned, individual_points, team_points, role_points, stats_breakdown, points_breakdown)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              fantasyPlayer.fantasy_team_player_id,
              matchGameId,
              totalPoints,
              individualPoints,
              teamPoints,
              roleBonus,
              JSON.stringify(statsBreakdown),
              JSON.stringify(updatedBreakdown)
            ],
            connection
          );

          // Update FantasyTeamPlayers points
          // Note: points_earned should be the sum of individual + team + role
          await runQuery(
            `UPDATE FantasyTeamPlayers
           SET individual_points = individual_points + ?,
               team_points = team_points + ?,
               role_points = role_points + ?,
               points_earned = individual_points + team_points + role_points
           WHERE id = ?`,
            [
              individualPoints,
              teamPoints,
              roleBonus,
              fantasyPlayer.fantasy_team_player_id
            ],
            connection
          );

          // Update FantasyTeams total points (only if new log entry was created)
          await runQuery(
            `UPDATE FantasyTeams
           SET total_points = total_points + ?
           WHERE id = ?`,
            [totalPoints, fantasyPlayer.fantasy_team_id],
            connection
          );
        } catch (error: unknown) {
          // Handle race condition: if another process already logged points for this match
          if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            (error as { code?: string }).code === "ER_DUP_ENTRY"
          ) {
            logger.info(
              `Points already logged for player ${fantasyPlayer.fantasy_team_player_id} in match ${matchGameId}`
            );
            // Skip processing - points were already logged by another process
            continue;
          }
          // Re-throw other errors
          throw error;
        }

        // Log to history
        await runQuery(
          `INSERT INTO FantasyPlayerHistory
         (fantasy_team_id, steam_id, action, new_value)
         VALUES (?, ?, 'points_updated', ?)`,
          [
            fantasyPlayer.fantasy_team_id,
            fantasyPlayer.steam_id,
            JSON.stringify({ match_game_id: matchGameId, points: totalPoints })
          ],
          connection
        );
      }
    }

    // Update player values for ALL players who played in this match
    // Value is based on actual match performance (rating, K/D, kills), NOT fantasy points
    // This ensures values reflect player skill, not fantasy team composition or roles
    const uniquePlayers = new Map<string, PlayerGameStats>();
    for (const ps of playerStats) {
      uniquePlayers.set(ps.steam_id, ps);
    }

    // Get season and league info from match
    const [matchInfo] = await runQuery<
      Array<{ season_id: number; league_id: number }>
    >(
      `SELECT m.season_id, m.league_id 
       FROM MatchGames mg
       INNER JOIN Matches m ON m.id = mg.match_id
       WHERE mg.id = ?`,
      [matchGameId],
      connection
    );

    if (matchInfo) {
      for (const [steamId, stats] of uniquePlayers.entries()) {
        // Priority order for getting current value:
        // 1. Current value from FantasyPlayerValues (if exists) - LATEST VALUE AFTER PREVIOUS MATCHES
        // 2. Snapshot value from FantasyTeamPlayers (if player is on a team) - INITIAL VALUE WHEN ADDED
        // 3. Calculate from historical stats
        // 4. Calculate from current match stats (last resort)

        let currentValue: number;

        // FIRST: Check FantasyPlayerValues for the latest value (after previous matches)
        // This ensures incremental updates work correctly - each match builds on the previous value
        const currentValueRows = await runQuery<Array<{ value: number }>>(
          `SELECT value FROM FantasyPlayerValues 
           WHERE steam_id = ? AND season_id = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [steamId, matchInfo.season_id],
          connection
        );

        if (
          currentValueRows &&
          currentValueRows.length > 0 &&
          currentValueRows[0]?.value
        ) {
          // Use the latest value from FantasyPlayerValues (value after previous matches)
          currentValue = currentValueRows[0].value;
        } else {
          // No value exists in FantasyPlayerValues, check snapshot value from FantasyTeamPlayers
          const snapshotValueRows = await runQuery<
            Array<{ player_value: number }>
          >(
            `SELECT player_value FROM FantasyTeamPlayers
             WHERE steam_id = ? AND is_active = TRUE
             ORDER BY added_at DESC
             LIMIT 1`,
            [steamId],
            connection
          );

          if (
            snapshotValueRows &&
            snapshotValueRows.length > 0 &&
            snapshotValueRows[0]?.player_value
          ) {
            // Use snapshot value (value when player was added to team) - initial base value
            currentValue = snapshotValueRows[0].player_value;
          } else {
            // No snapshot value, calculate from HISTORICAL stats (not current match)
            const historicalStatsRows = await runQuery<
              Array<{
                kana_rating: number;
                kd: number;
                kills: number;
              }>
            >(
              `SELECT 
                COALESCE(AVG(ps.kana_rating), 0.7) as kana_rating,
                COALESCE(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 1.0) as kd,
                COALESCE(SUM(ps.kills), 0) as kills
              FROM PlayerStats ps
              INNER JOIN MatchGames mg ON mg.id = ps.match_game_id
              INNER JOIN Matches m ON m.id = mg.match_id
              WHERE ps.steam_id = ?
                AND m.season_id = ?
                AND mg.id < ?
                AND m.status = 'finished'`,
              [steamId, matchInfo.season_id, matchGameId],
              connection
            );

            if (
              historicalStatsRows &&
              historicalStatsRows.length > 0 &&
              historicalStatsRows[0]
            ) {
              const hist = historicalStatsRows[0];
              currentValue = calculateInitialPlayerValue(
                hist.kana_rating || 0.7,
                hist.kd || 1.0,
                hist.kills || 0
              );
            } else {
              // No historical stats, use current match stats as last resort
              currentValue = calculateInitialPlayerValue(
                stats.kana_rating || 0.7,
                stats.kd || 1.0,
                stats.kills || 0
              );
            }
          }
        }

        // Get fantasy team reference (if player is on a team)
        const playerFantasyTeams = fantasyTeamPlayers.filter(
          (fp) => fp.steam_id === steamId
        );

        // Calculate individual points for this player in this match
        // Use actual points from FantasyPointsLog if available, otherwise calculate
        let individualPoints = 0;
        if (playerFantasyTeams.length > 0) {
          // Player is on a fantasy team, get their points from FantasyPointsLog
          const [pointsRow] = await runQuery<
            Array<{ individual_points: number }>
          >(
            `SELECT fpl.individual_points FROM FantasyPointsLog fpl
             INNER JOIN FantasyTeamPlayers ftp ON ftp.id = fpl.fantasy_team_player_id
             WHERE ftp.steam_id = ? AND fpl.match_game_id = ?
             LIMIT 1`,
            [steamId, matchGameId],
            connection
          );
          individualPoints = pointsRow?.individual_points || 0;
        } else {
          // Player not on a fantasy team, calculate their would-be points
          const { individualPoints: calculatedPoints } =
            calculateBasePoints(stats);
          individualPoints = calculatedPoints;
        }

        // Calculate value change based on individual performance points
        // This applies a percentage change to current value, capped at ±5%
        const { newValue, changeBasisPoints, valueChange } =
          calculateValueChangeFromMatch(currentValue, individualPoints);
        const newTier = calculatePlayerTier(newValue);

        // Insert or update value record (match-based updates, always get latest)
        // Note: We use INSERT with ON DUPLICATE KEY UPDATE to always have one current value per player per season
        // The unique constraint is (steam_id, season_id) - not including week_number
        await runQuery(
          `INSERT INTO FantasyPlayerValues 
           (steam_id, season_id, league_id, value, tier, week_number, performance_stats)
           VALUES (?, ?, ?, ?, ?, 0, ?)
           ON DUPLICATE KEY UPDATE
             value = VALUES(value),
             tier = VALUES(tier),
             performance_stats = VALUES(performance_stats),
             created_at = NOW()`,
          [
            steamId,
            matchInfo.season_id,
            matchInfo.league_id,
            newValue,
            newTier,
            JSON.stringify({
              match_game_id: matchGameId,
              individual_points: individualPoints,
              change_basis_points: changeBasisPoints, // Integer: 100 = 1%, 1000 = 10%
              value_change: valueChange,
              old_value: currentValue
            })
          ],
          connection
        );

        // Log value change to history (only if player is on a fantasy team)
        if (valueChange !== 0 && playerFantasyTeams.length > 0) {
          const fantasyTeamId = playerFantasyTeams[0].fantasy_team_id;
          await runQuery(
            `INSERT INTO FantasyPlayerHistory 
           (fantasy_team_id, steam_id, action, old_value, new_value, week_number)
           VALUES (?, ?, 'points_updated', ?, ?, 0)`,
            [
              fantasyTeamId,
              steamId,
              JSON.stringify({
                value: currentValue,
                individual_points: individualPoints
              }),
              JSON.stringify({
                value: newValue,
                change_basis_points: changeBasisPoints, // Integer: 100 = 1%, 1000 = 10%
                match_game_id: matchGameId
              })
            ],
            connection
          );
        }
      }

      logger.info(
        `Updated values for ${uniquePlayers.size} players based on match ${matchGameId} performance (using rating, K/D, kills - NOT fantasy points)`
      );
    }

    await connection.commit();
    logger.info(
      `Successfully calculated fantasy points for match game ${matchGameId}, updated ${fantasyTeamPlayers.length} fantasy team players`
    );
  } catch (error) {
    await connection.rollback();
    logger.error(
      `Error calculating fantasy points for game ${matchGameId}:`,
      error
    );
    throw error;
  } finally {
    connection.release();
  }
};
