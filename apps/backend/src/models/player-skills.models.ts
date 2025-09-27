import { runQuery } from "../db/mysqlRunQuery";
import { type PlayerSkillDiagram, type ParsedParams } from "@eggosystem/types";
import { generateQueryWithFilters, type Filter } from "../utils/queryFilter";

/**
 * Get player skill diagram data - comprehensive 5-section skill analysis
 * @param steam_id Steam ID of the player
 * @param params Optional filter parameters (season_ids, map_ids, stages)
 * @returns PlayerSkillDiagram object with scores (0-100) for 5 skill categories
 */
export const getPlayerSkillDiagram = async (
  steam_id: string,
  params?: ParsedParams
): Promise<PlayerSkillDiagram | null> => {
  // Fetch player's basic info
  const playerInfo = await runQuery<{ steam_id: string; nickname: string }[]>(
    "SELECT steam_id, nickname FROM SteamPlayers WHERE steam_id = ?",
    [steam_id]
  );

  if (!playerInfo.length) {
    return null;
  }

  // Define interface for player stats
  interface PlayerStatsSummary {
    steam_id: string;
    nickname: string;
    maps_played: number;
    rounds_played: number;
    hs_percent: number;
    kd: number;
    adr: number;
    ttd: number;
    counter_strafing: number;
    crosshair_placement: number;
    first_kill_death_ratio: number;
    first_death_trade_percentage: number;
    first_death_trade_attempts_ratio: number;
    trade_death_ratio: number;
    kast: number;
    clutches_won_percentage: number;
    multikills_weighted: number;
    kana_rating: number;
    flash_assists_per_round: number;
    enemies_flashed_per_round: number;
    avg_enemy_flash_duration: number;
    utility_damage_per_round: number;
    teammates_flashed_inverse: number;
    ct_t_kill_imbalance: number;
    rating_variance: number;
    clutch_entry_imbalance: number;
    one_v_one_win_ratio: number;
    first_kills_per_round: number;
    // New Leetify-style metrics
    flash_assists_per_flash: number;
    enemies_flashed_per_flash: number;
    teammates_flashed_per_flash: number;
    adr_t: number;
    adr_ct: number;
    kd_t: number;
    kd_ct: number;
    kills_variance: number;
    deaths_variance: number;
    adr_variance: number;
    first_kill_death_ratio_t: number;
    first_kill_death_ratio_ct: number;
    accuracy: number;
    first_kill_success_ratio: number;
    trades_per_round: number;
    he_damage_per_round: number;
    molotov_damage_per_round: number;
  }

  // Generate filter conditions for all queries
  const { query: filterQuery, queryParams: filterParams } =
    generateQueryWithFilters([
      { column: "m.season_id", value: params?.season_ids || null },
      { column: "mg.map_id", value: params?.map_ids || null },
      { column: "m.stage_id", value: params?.stages || null }
    ]);

  // Generate filter conditions for subqueries with different table aliases
  const { query: filterQueryM2, queryParams: filterParamsM2 } =
    generateQueryWithFilters([
      { column: "m2.season_id", value: params?.season_ids || null },
      { column: "mg2.map_id", value: params?.map_ids || null },
      { column: "m2.stage_id", value: params?.stages || null }
    ]);

  const { query: filterQueryM3, queryParams: filterParamsM3 } =
    generateQueryWithFilters([
      { column: "m3.season_id", value: params?.season_ids || null },
      { column: "mg3.map_id", value: params?.map_ids || null },
      { column: "m3.stage_id", value: params?.stages || null }
    ]);

  const { query: filterQueryM4, queryParams: filterParamsM4 } =
    generateQueryWithFilters([
      { column: "m4.season_id", value: params?.season_ids || null },
      { column: "mg4.map_id", value: params?.map_ids || null },
      { column: "m4.stage_id", value: params?.stages || null }
    ]);

  const { query: filterQueryM5, queryParams: filterParamsM5 } =
    generateQueryWithFilters([
      { column: "m5.season_id", value: params?.season_ids || null },
      { column: "mg5.map_id", value: params?.map_ids || null },
      { column: "m5.stage_id", value: params?.stages || null }
    ]);

  // Get aggregate player stats
  const playerStats = await runQuery<PlayerStatsSummary[]>(
    `
    SELECT 
      p.steam_id,
      p.nickname,
      COUNT(DISTINCT ps.match_game_id) as maps_played,
      COUNT(DISTINCT mrs.match_game_id) as rounds_played,
      
      -- Aim metrics
      AVG(ps.hs_percent) as hs_percent,
      SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0) as kd,
      AVG(ps.adr) as adr,
      AVG(ps.ttd) as ttd,
      SUM(ps.good_strafing_shots) / NULLIF(SUM(ps.total_strafing_shots), 0) as counter_strafing,
      AVG(ps.crosshair_placement) as crosshair_placement,
      SUM(ps.shots_hit) / NULLIF(SUM(ps.shots), 0) as accuracy,
      
      -- Positioning metrics
      SUM(ps.first_kills) / NULLIF(SUM(ps.first_deaths), 0) as first_kill_death_ratio,
      SUM(ps.first_death_trades) / NULLIF(SUM(ps.first_death_trade_opportunities), 0) as first_death_trade_percentage,
      SUM(ps.first_death_trade_attempts) / NULLIF(SUM(ps.first_death_trade_opportunities), 0) as first_death_trade_attempts_ratio,
      SUM(ps.traded) / NULLIF(SUM(ps.deaths), 0) as trade_death_ratio,
      
      -- Impact metrics
      AVG(ps.kast) as kast,
      SUM(ps.clutches_won) / NULLIF(SUM(ps.clutches), 0) as clutches_won_percentage,
      SUM(ps.kills_2) * 0.2 + SUM(ps.kills_3) * 0.5 + SUM(ps.kills_4) * 0.8 + SUM(ps.kills_5) * 1.0 as multikills_weighted,
      AVG(ps.kana_rating) as kana_rating,
      SUM(ps.one_v_one_won) / NULLIF(SUM(ps.one_v_one_won) + SUM(ps.one_v_one_lost), 0) as one_v_one_win_ratio,
      
      -- First kill success ratio (first_kills / (first_kills + first_deaths))
      SUM(ps.first_kills) / NULLIF(SUM(ps.first_kills) + SUM(ps.first_deaths), 0) as first_kill_success_ratio,
      
      -- Get proper total rounds from TeamGameScores like in leaderboards.models.ts
      SUM(ps.first_kills) / NULLIF(SUM(game_rounds.total_rounds), 0) as first_kills_per_round,
      
      -- Trade kills per round
      SUM(ps.trades) / NULLIF(SUM(game_rounds.total_rounds), 0) as trades_per_round,
      
      -- Utility metrics with proper round counts
      SUM(ps.flash_assists) / NULLIF(SUM(game_rounds.total_rounds), 0) as flash_assists_per_round,
      SUM(ps.enemies_flashed) / NULLIF(SUM(game_rounds.total_rounds), 0) as enemies_flashed_per_round,
      SUM(ps.total_ef_duration) / NULLIF(SUM(ps.enemies_flashed), 0) as avg_enemy_flash_duration,
      SUM(ps.utility_damage) / NULLIF(SUM(game_rounds.total_rounds), 0) as utility_damage_per_round,
      SUM(ps.he_damage) / NULLIF(SUM(game_rounds.total_rounds), 0) as he_damage_per_round,
      SUM(ps.molotov_damage) / NULLIF(SUM(game_rounds.total_rounds), 0) as molotov_damage_per_round,
      1 - (SUM(ps.mates_flashed) / NULLIF(SUM(ps.flashes_thrown), 0)) as teammates_flashed_inverse,
      
      -- New Leetify-style utility metrics
      SUM(ps.flash_assists) / NULLIF(SUM(ps.flashes_thrown), 0) as flash_assists_per_flash,
      SUM(ps.enemies_flashed) / NULLIF(SUM(ps.flashes_thrown), 0) as enemies_flashed_per_flash,
      SUM(ps.mates_flashed) / NULLIF(SUM(ps.flashes_thrown), 0) as teammates_flashed_per_flash,
      
      -- Consistency metrics
      ABS(0.5 - (SUM(ps.kills_ct) / NULLIF(SUM(ps.kills), 0))) as ct_t_kill_imbalance,
      STDDEV(ps.kana_rating) as rating_variance,
      ABS(
        (SUM(ps.first_kills) / NULLIF(SUM(game_rounds.total_rounds), 0)) - 
        (SUM(ps.clutches_won) / NULLIF(SUM(game_rounds.total_rounds), 0))
      ) as clutch_entry_imbalance,
      
      -- Side-specific performance metrics for consistency
      -- For old data, these might be null, so we'll handle that in the code
      AVG(ps.adr_t) as adr_t,
      AVG(ps.adr_ct) as adr_ct,
      SUM(ps.kills_t) / NULLIF(SUM(ps.deaths_t), 0) as kd_t,
      SUM(ps.kills_ct) / NULLIF(SUM(ps.deaths_ct), 0) as kd_ct,
      
      -- Map variance metrics
      STDDEV(ps.kills) as kills_variance,
      STDDEV(ps.deaths) as deaths_variance,
      STDDEV(ps.adr) as adr_variance,
      
      -- First kill consistency
      SUM(ps.first_kills_t) / NULLIF(SUM(ps.first_deaths_t), 0) as first_kill_death_ratio_t,
      SUM(ps.first_kills_ct) / NULLIF(SUM(ps.first_deaths_ct), 0) as first_kill_death_ratio_ct
      
    FROM SteamPlayers p
    JOIN PlayerStats ps ON ps.steam_id = p.steam_id
    JOIN MatchGames mg ON mg.id = ps.match_game_id
    JOIN MapRoundStats mrs ON mrs.match_game_id = mg.id
    JOIN Matches m ON m.id = mg.match_id
    -- Join with total rounds calculation like in leaderboards.models.ts
    INNER JOIN (
      SELECT match_game_id, SUM(score + overtime_score) AS total_rounds
      FROM TeamGameScores
      GROUP BY match_game_id
    ) AS game_rounds ON game_rounds.match_game_id = mg.id
    WHERE p.steam_id = ? AND ${filterQuery}
    GROUP BY p.steam_id, p.nickname
  `,
    [steam_id, ...filterParams]
  );

  // Get first death trade data from PlayerTrades table
  const firstDeathTradeStats = await runQuery<
    {
      total_first_deaths: number;
      attempted_trades: number;
      successful_trades: number;
    }[]
  >(
    `
    SELECT 
      SUM(first_death) as total_first_deaths,
      SUM(attempted) as attempted_trades,
      SUM(traded) as successful_trades
    FROM PlayerTrades pt
    JOIN MatchGames mg ON mg.id = pt.match_game_id
    ${params ? "JOIN Matches m ON m.id = mg.match_id" : ""}
    WHERE victim_steam_id = ? AND first_death = 1 AND ${filterQuery}
    `,
    [steam_id, ...filterParams]
  );

  // Get trade opportunity data from PlayerTrades table
  const tradeOpportunityStats = await runQuery<
    {
      total_opportunities: number;
      attempted_trades: number;
      successful_trades: number;
      rounds_played: number;
    }[]
  >(
    `
    SELECT 
      COUNT(*) as total_opportunities,
      SUM(attempted) as attempted_trades,
      SUM(traded) as successful_trades,
      (SELECT COUNT(DISTINCT mrs.match_game_id) FROM MapRoundStats mrs 
       JOIN MatchGames mg2 ON mg2.id = mrs.match_game_id
       ${params ? "JOIN Matches m2 ON m2.id = mg2.match_id" : ""}
       WHERE mrs.match_game_id IN (
         SELECT DISTINCT pt2.match_game_id FROM PlayerTrades pt2 
         WHERE pt2.trader_steam_id = ?
         AND pt2.match_game_id IN (SELECT mg3.id FROM MatchGames mg3 
                            JOIN Matches m3 ON m3.id = mg3.match_id 
                            WHERE ${filterQueryM3})
       )
      ) as rounds_played
    FROM PlayerTrades pt
    JOIN MatchGames mg ON mg.id = pt.match_game_id
    ${params ? "JOIN Matches m ON m.id = mg.match_id" : ""}
    WHERE trader_steam_id = ? AND ${filterQuery}
    `,
    [steam_id, ...filterParamsM3, steam_id, ...filterParams]
  );

  /**
   * Get good deaths (tradeable deaths) data
   * This calculates:
   * - total_deaths: All deaths from PlayerStats
   * - tradeable_deaths: Deaths where the player is in the PlayerTrades table as a victim
   *   and their death was either traded or attempted to be traded
   * - tradeable_first_deaths: First deaths that are tradeable
   * - total_first_deaths: All first deaths from PlayerStats
   * - total_trade_opportunities: All trade opportunities for this player
   *
   * The ratio tradeable_deaths/total_deaths represents "good positioning" -
   * a death that happens in a position where teammates can trade the kill
   */
  const goodDeathsStats = await runQuery<
    {
      total_deaths: number;
      tradeable_deaths: number;
      tradeable_first_deaths: number;
      total_first_deaths: number;
      total_trade_opportunities: number;
      rounds_played: number;
    }[]
  >(
    `
    SELECT
      (SELECT SUM(deaths) FROM PlayerStats ps2 
       JOIN MatchGames mg2 ON mg2.id = ps2.match_game_id
       ${params ? "JOIN Matches m2 ON m2.id = mg2.match_id" : ""}
       WHERE ps2.steam_id = ? AND ${filterQueryM2}
      ) as total_deaths,
      COUNT(DISTINCT CASE WHEN pt.attempted = 1 OR pt.traded = 1 THEN pt.id END) as tradeable_deaths,
      SUM(IF(pt.first_death = 1 AND (pt.attempted = 1 OR pt.traded = 1), 1, 0)) as tradeable_first_deaths,
      (SELECT SUM(first_deaths) FROM PlayerStats ps3 
       JOIN MatchGames mg3 ON mg3.id = ps3.match_game_id
       ${params ? "JOIN Matches m3 ON m3.id = mg3.match_id" : ""}
       WHERE ps3.steam_id = ? AND ${filterQueryM3}
      ) as total_first_deaths,
      (SELECT COUNT(*) FROM PlayerTrades pt2 
       JOIN MatchGames mg4 ON mg4.id = pt2.match_game_id
       ${params ? "JOIN Matches m4 ON m4.id = mg4.match_id" : ""}
       WHERE pt2.victim_steam_id = ? AND ${filterQueryM4}
      ) as total_trade_opportunities,
      (SELECT COUNT(DISTINCT mrs.round_number) FROM MapRoundStats mrs
       JOIN MatchGames mg5 ON mrs.match_game_id = mg5.id
       JOIN PlayerStats ps5 ON ps5.match_game_id = mg5.id
       ${params ? "JOIN Matches m5 ON m5.id = mg5.match_id" : ""}
       WHERE ps5.steam_id = ? AND ${filterQueryM5}
      ) as rounds_played
    FROM PlayerTrades pt
    JOIN MatchGames mg ON mg.id = pt.match_game_id
    ${params ? "JOIN Matches m ON m.id = mg.match_id" : ""}
    WHERE pt.victim_steam_id = ? AND ${filterQuery}
    `,
    [
      steam_id,
      ...filterParamsM2,
      steam_id,
      ...filterParamsM3,
      steam_id,
      ...filterParamsM4,
      steam_id,
      ...filterParamsM5,
      steam_id,
      ...filterParams
    ]
  );

  // Get side-specific opening duel stats
  const openingDuelStats = await runQuery<
    {
      t_first_kills: number;
      t_first_deaths: number;
      ct_first_kills: number;
      ct_first_deaths: number;
    }[]
  >(
    `
    SELECT
      SUM(first_kills_t) as t_first_kills,
      SUM(first_deaths_t) as t_first_deaths,
      SUM(first_kills_ct) as ct_first_kills,
      SUM(first_deaths_ct) as ct_first_deaths
    FROM PlayerStats ps
    JOIN MatchGames mg ON mg.id = ps.match_game_id
    ${params ? "JOIN Matches m ON m.id = mg.match_id" : ""}
    WHERE ps.steam_id = ? AND ${filterQuery}
    `,
    [steam_id, ...filterParams]
  );

  if (!playerStats.length) {
    return null;
  }

  const stats = playerStats[0];

  // Calculate trade metrics from PlayerTrades table
  const firstDeathStats =
    firstDeathTradeStats.length > 0
      ? firstDeathTradeStats[0]
      : { total_first_deaths: 0, attempted_trades: 0, successful_trades: 0 };
  const tradeStats =
    tradeOpportunityStats.length > 0
      ? tradeOpportunityStats[0]
      : {
          total_opportunities: 0,
          attempted_trades: 0,
          successful_trades: 0,
          rounds_played: 0
        };
  const goodDeaths =
    goodDeathsStats.length > 0
      ? goodDeathsStats[0]
      : {
          total_deaths: 0,
          tradeable_deaths: 0,
          tradeable_first_deaths: 0,
          total_first_deaths: 0,
          total_trade_opportunities: 0,
          rounds_played: 0
        };
  const openingDuels =
    openingDuelStats.length > 0
      ? openingDuelStats[0]
      : {
          t_first_kills: 0,
          t_first_deaths: 0,
          ct_first_kills: 0,
          ct_first_deaths: 0
        };

  // Calculate derived metrics with improved handling for zero values
  const firstDeathTradedRatio =
    firstDeathStats.total_first_deaths > 0
      ? firstDeathStats.successful_trades / firstDeathStats.total_first_deaths
      : 0.25; // Default value when no first deaths (better than 0)
  const firstDeathTradeAttemptsRatio =
    firstDeathStats.total_first_deaths > 0
      ? firstDeathStats.attempted_trades / firstDeathStats.total_first_deaths
      : 0.7; // Default value when no first deaths
  const tradeOpportunitiesConverted =
    tradeStats.successful_trades / Math.max(tradeStats.total_opportunities, 1);

  /**
   * Calculate good deaths percentage
   * This metric shows the percentage of deaths where the player was in a position
   * that could be traded by teammates (tradeable_deaths/total_deaths)
   * Higher values indicate better positioning when dying (player dies in positions
   * where teammates can trade the kill)
   */
  const goodDeathsPercentage =
    goodDeaths.total_deaths > 0
      ? goodDeaths.tradeable_deaths / goodDeaths.total_deaths
      : 0.5; // Default value when no deaths

  /**
   * Calculate tradeable first deaths percentage
   * This shows what percentage of the player's first deaths (opening deaths)
   * occurred in positions where teammates could trade
   * Higher values indicate the player takes calculated risks when entry fragging
   */
  const tradeableFirstDeathsPercentage =
    goodDeaths.total_first_deaths > 0
      ? goodDeaths.tradeable_first_deaths / goodDeaths.total_first_deaths
      : 0.5; // Default value when no first deaths

  /**
   * Calculate new positioning metrics
   */
  // Traded Deaths Success Percentage - What % of all deaths were successfully traded
  const tradedDeathsSuccessPercentage =
    goodDeaths.total_deaths > 0
      ? stats.trade_death_ratio // Use the trade_death_ratio from PlayerStats
      : 0.15; // Default value

  // Traded Death Attempts Percentage - What % of all deaths had trade attempts
  const tradedDeathAttemptsPercentage =
    goodDeaths.total_deaths > 0
      ? goodDeaths.tradeable_deaths / goodDeaths.total_deaths
      : 0.3; // Default value

  // Trade Kill Opportunities per Round - How many opportunities player had to trade per round
  const tradeKillOpportunitiesPerRound =
    tradeStats.rounds_played > 0
      ? tradeStats.total_opportunities / tradeStats.rounds_played
      : 0.5; // Default value

  // Trade Kill Success Percentage - What % of trade opportunities were successful
  const tradeKillSuccessPercentage =
    tradeStats.total_opportunities > 0
      ? tradeStats.successful_trades / tradeStats.total_opportunities
      : 0.4; // Default value

  // Trade Kill Attempts Percentage - What % of trade opportunities were attempted
  const tradeKillAttemptsPercentage =
    tradeStats.total_opportunities > 0
      ? tradeStats.attempted_trades / tradeStats.total_opportunities
      : 0.6; // Default value

  // Trade Death Opportunities per Round - How many times player died in tradeable positions per round
  const tradeDeathOpportunitiesPerRound =
    goodDeaths.rounds_played > 0
      ? goodDeaths.tradeable_deaths / goodDeaths.rounds_played
      : 0.3; // Default value

  // T Opening Duel Success Percentage - Success rate in T-side opening duels
  const tOpeningDuelSuccessPercentage =
    openingDuels.t_first_kills + openingDuels.t_first_deaths > 0
      ? openingDuels.t_first_kills /
        (openingDuels.t_first_kills + openingDuels.t_first_deaths)
      : 0.5; // Default value

  // CT Opening Duel Success Percentage - Success rate in CT-side opening duels
  const ctOpeningDuelSuccessPercentage =
    openingDuels.ct_first_kills + openingDuels.ct_first_deaths > 0
      ? openingDuels.ct_first_kills /
        (openingDuels.ct_first_kills + openingDuels.ct_first_deaths)
      : 0.5; // Default value

  // Normalize values to 0-100 scale
  const normalizeValue = (value: number, min: number, max: number): number => {
    if (value === null || value === undefined || isNaN(value)) return 50; // Default to middle if no data
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  };

  // Calculate aim score (0-100)
  const aimScore = Math.round(
    // Headshot percentage (headshots/kills)
    // For hs_percent, 40-60 is excellent, 20-30 is average
    normalizeValue(stats.hs_percent, 30, 50) * 0.1 +
      // Time to damage - lower is better, so normalize inversely
      // For ttd, 200-230 is excellent, 250-300 is good, 332 is average
      // We use 500-ttd to invert the scale (lower ttd = higher score)
      normalizeValue(Math.max(0, 500 - (stats.ttd || 332)), 200, 300) * 0.25 +
      // Crosshair placement - lower is better, so normalize inversely
      // For crosshair_placement, 2-3 is excellent, 3-4 is very good, 5.7 is average
      // We use 10-crosshair_placement to invert the scale (lower placement = higher score)
      normalizeValue(
        Math.max(0, 10 - (stats.crosshair_placement || 5.7)),
        6,
        8
      ) *
        0.275 +
      // Counter-strafing (good strafing shots / total strafing shots)
      // For counter_strafing, 0.95-1.00 is excellent, 0.90-0.95 is very good, 0.84 is average
      normalizeValue((stats.counter_strafing || 0.84) * 100, 84, 96) * 0.275 +
      // Accuracy (shots_hit / shots)
      // For accuracy, 0.25-0.35 is excellent, 0.15-0.20 is average
      normalizeValue((stats.accuracy || 0.18) * 100, 15, 25) * 0.1 // 10% weight because this is smoke spams etc
  );

  // Apply a scaling factor to bring aim scores for top players into the 90-100 range
  // But make it more strict so that only truly exceptional players get 95+
  // Jonzki's raw score is around 40, we want it to be around 92
  const scaledAimScore = Math.round(
    Math.min(100, Math.max(0, aimScore * 1.2 + 45))
  );

  // Calculate positioning score (0-100)
  // Now includes goodDeathsPercentage as part of the positioning score
  const positioningScore = Math.round(
    normalizeValue(stats.first_kill_death_ratio, 0.5, 1.5) * 0.15 +
      normalizeValue(firstDeathTradedRatio, 0.2, 0.8) * 0.1 +
      normalizeValue(stats.trade_death_ratio, 0.3, 0.7) * 0.1 +
      normalizeValue(tradeOpportunitiesConverted, 0.1, 0.5) * 0.1 +
      normalizeValue(goodDeathsPercentage, 0.05, 0.3) * 0.15 + // Adjusted range from (0.3, 0.8) to (0.05, 0.3)
      normalizeValue(tradeableFirstDeathsPercentage, 0.05, 0.3) * 0.1 + // Adjusted range from (0.3, 0.8) to (0.05, 0.3)
      // New metrics
      normalizeValue(tradedDeathsSuccessPercentage, 0.1, 0.3) * 0.05 +
      normalizeValue(tradedDeathAttemptsPercentage, 0.1, 0.4) * 0.05 +
      normalizeValue(tradeKillSuccessPercentage, 0.3, 0.7) * 0.05 +
      normalizeValue(tOpeningDuelSuccessPercentage, 0.3, 0.7) * 0.05 +
      normalizeValue(ctOpeningDuelSuccessPercentage, 0.4, 0.8) * 0.1
  );

  // Calculate impact score (0-100)
  const impactScore = Math.round(
    normalizeValue(stats.kast, 60, 75) * 0.15 +
      normalizeValue(stats.clutches_won_percentage || 0, 0.1, 0.5) * 0.15 +
      normalizeValue(stats.multikills_weighted || 0, 10, 30) * 0.15 +
      normalizeValue(stats.kana_rating, 0.8, 1.3) * 0.15 +
      normalizeValue(stats.one_v_one_win_ratio || 0, 0.4, 0.7) * 0.1 +
      // New impact metrics
      normalizeValue(stats.first_kills_per_round || 0, 0.05, 0.15) * 0.1 +
      normalizeValue(stats.first_kill_success_ratio || 0, 0.4, 0.7) * 0.1 +
      normalizeValue(stats.trades_per_round || 0, 0.1, 0.3) * 0.05 +
      normalizeValue(stats.utility_damage_per_round || 0, 2.0, 8.0) * 0.05
  );

  // Calculate utility score (0-100) with Leetify-style metrics
  const utilityScore = Math.round(
    normalizeValue(stats.flash_assists_per_round || 0, 0.01, 0.09) * 0.15 + // Reduced weight from 0.25
      normalizeValue(stats.enemies_flashed_per_round || 0, 0.2, 0.9) * 0.1 +
      normalizeValue(stats.avg_enemy_flash_duration || 0, 1.0, 2.7) * 0.15 + // Reduced weight from 0.15
      normalizeValue(stats.he_damage_per_round || 0, 1.0, 5.0) * 0.2 + // New metric
      normalizeValue(stats.molotov_damage_per_round || 0, 1.0, 5.0) * 0.15 + // New metric
      normalizeValue(stats.flash_assists_per_flash || 0, 0.02, 0.09) * 0.1 + // Reduced weight from 0.2
      normalizeValue(stats.enemies_flashed_per_flash || 0, 0.3, 0.9) * 0.1 +
      normalizeValue(1 - (stats.teammates_flashed_per_flash || 0), 0.3, 0.7) *
        0.05
  );

  // Calculate consistency score (0-100)
  // This measures how consistent a player's performance is across different aspects
  // - Side consistency: How balanced is performance between CT and T sides
  // - Map consistency: How stable is performance across different maps
  // - Role consistency: How consistent is the player in their role

  // First calculate raw consistency metrics
  const ctTSideBalance = normalizeValue(
    1 - stats.ct_t_kill_imbalance,
    0.2,
    0.8
  );
  const mapConsistency = normalizeValue(1 - stats.rating_variance, 0.2, 0.7);
  const roleBalance = normalizeValue(
    1 - stats.clutch_entry_imbalance,
    0.2,
    0.7
  );

  // Calculate side-specific performance consistency
  // Lower values mean more consistent performance between sides
  // For old data where adr_t and adr_ct are null, use the overall adr value for both sides
  const adr_t_value = stats.adr_t || stats.adr || 0;
  const adr_ct_value = stats.adr_ct || stats.adr || 0;
  const kd_t_value = stats.kd_t || stats.kd || 0;
  const kd_ct_value = stats.kd_ct || stats.kd || 0;
  const first_kill_death_ratio_t_value =
    stats.first_kill_death_ratio_t || stats.first_kill_death_ratio || 0;
  const first_kill_death_ratio_ct_value =
    stats.first_kill_death_ratio_ct || stats.first_kill_death_ratio || 0;

  // For old data, if we're using the same value for both sides, consistency should be perfect (1.0)
  const adrSideConsistency =
    !stats.adr_t && !stats.adr_ct
      ? normalizeValue(1.0, 0.3, 0.9) // Perfect consistency for old data (using same value for both sides)
      : normalizeValue(
          1 -
            Math.abs(adr_t_value - adr_ct_value) /
              Math.max(adr_t_value, adr_ct_value, 1),
          0.3,
          0.9
        );

  const kdSideConsistency =
    !stats.kd_t && !stats.kd_ct
      ? normalizeValue(1.0, 0.3, 0.9) // Perfect consistency for old data
      : normalizeValue(
          1 -
            Math.abs(kd_t_value - kd_ct_value) /
              Math.max(kd_t_value, kd_ct_value, 1),
          0.3,
          0.9
        );

  const firstKillSideConsistency =
    !stats.first_kill_death_ratio_t && !stats.first_kill_death_ratio_ct
      ? normalizeValue(1.0, 0.3, 0.9) // Perfect consistency for old data
      : normalizeValue(
          1 -
            Math.abs(
              first_kill_death_ratio_t_value - first_kill_death_ratio_ct_value
            ) /
              Math.max(
                first_kill_death_ratio_t_value,
                first_kill_death_ratio_ct_value,
                1
              ),
          0.3,
          0.9
        );

  // Calculate map-to-map consistency metrics
  // Lower variance means more consistent performance
  const killsMapConsistency = stats.kills_variance
    ? normalizeValue(1 - stats.kills_variance / 10, 0.3, 0.9)
    : 0;

  const adrMapConsistency = stats.adr_variance
    ? normalizeValue(1 - stats.adr_variance / 20, 0.3, 0.9)
    : 0;

  // Apply a scaling factor to bring down the overall scores
  // This makes the metric more discriminating between different skill levels
  const consistencyScore = Math.round(
    // Original metrics
    (ctTSideBalance * 0.15 +
      mapConsistency * 0.25 +
      roleBalance * 0.1 +
      // Side-specific consistency metrics
      adrSideConsistency * 0.15 +
      kdSideConsistency * 0.15 +
      firstKillSideConsistency * 0.1 +
      // Map-to-map consistency metrics
      killsMapConsistency * 0.05 +
      adrMapConsistency * 0.05) *
      0.85
  );

  // Calculate overall rating as weighted average
  const overallRating = Math.round(
    scaledAimScore * 0.25 +
      positioningScore * 0.2 +
      impactScore * 0.25 +
      utilityScore * 0.15 +
      consistencyScore * 0.15
  );

  return {
    steam_id: playerInfo[0].steam_id,
    nickname: playerInfo[0].nickname,
    overall_rating: overallRating,
    aim: scaledAimScore,
    positioning: positioningScore,
    impact: impactScore,
    utility: utilityScore,
    consistency: consistencyScore,
    detailed_metrics: {
      hs_percent: stats.hs_percent || 0,
      kd: stats.kd || 0,
      adr: stats.adr || 0,
      ttd: stats.ttd || 0,
      counter_strafing: stats.counter_strafing || 0,
      crosshair_placement: stats.crosshair_placement || 0,
      accuracy: stats.accuracy || 0,

      first_kill_death_ratio: stats.first_kill_death_ratio || 0,
      first_death_trade_percentage: stats.first_death_trade_percentage || 0,
      trade_opportunities_converted: tradeOpportunitiesConverted || 0,
      first_death_trade_attempts_ratio: firstDeathTradeAttemptsRatio || 0,
      first_death_traded_ratio: firstDeathTradedRatio || 0,
      good_deaths_percentage: goodDeathsPercentage || 0,
      tradeable_first_deaths_percentage: tradeableFirstDeathsPercentage || 0,
      // New positioning metrics
      traded_deaths_success_percentage: tradedDeathsSuccessPercentage || 0,
      traded_death_attempts_percentage: tradedDeathAttemptsPercentage || 0,
      trade_kill_opportunities_per_round: tradeKillOpportunitiesPerRound || 0,
      trade_kill_success_percentage: tradeKillSuccessPercentage || 0,
      trade_kill_attempts_percentage: tradeKillAttemptsPercentage || 0,
      trade_death_opportunities_per_round: tradeDeathOpportunitiesPerRound || 0,
      t_opening_duel_success_percentage: tOpeningDuelSuccessPercentage || 0,
      ct_opening_duel_success_percentage: ctOpeningDuelSuccessPercentage || 0,

      kast: stats.kast || 0,
      clutches_won_percentage: stats.clutches_won_percentage || 0,
      multikills: stats.multikills_weighted || 0,
      kana_rating: stats.kana_rating || 0,
      one_v_one_win_ratio: stats.one_v_one_win_ratio || 0,
      first_kills_per_round: stats.first_kills_per_round || 0,
      first_kill_success_ratio: stats.first_kill_success_ratio || 0,
      trades_per_round: stats.trades_per_round || 0,

      flash_assists: stats.flash_assists_per_round || 0,
      enemies_flashed: stats.enemies_flashed_per_round || 0,
      enemies_flashed_duration: stats.avg_enemy_flash_duration || 0,
      utility_damage: stats.utility_damage_per_round || 0,
      he_damage_per_round: stats.he_damage_per_round || 0,
      molotov_damage_per_round: stats.molotov_damage_per_round || 0,
      teammates_flashed_inverse: stats.teammates_flashed_inverse || 0,
      flash_assists_per_flash: stats.flash_assists_per_flash || 0,
      enemies_flashed_per_flash: stats.enemies_flashed_per_flash || 0,
      teammates_flashed_per_flash: stats.teammates_flashed_per_flash || 0,

      ct_t_balance: 1 - stats.ct_t_kill_imbalance || 0,
      map_consistency: 1 - stats.rating_variance || 0,
      clutch_vs_entry_balance: 1 - stats.clutch_entry_imbalance || 0,
      trade_death_ratio: stats.trade_death_ratio || 0,

      adr_t: stats.adr_t || stats.adr || 0,
      adr_ct: stats.adr_ct || stats.adr || 0,
      kd_t: stats.kd_t || stats.kd || 0,
      kd_ct: stats.kd_ct || stats.kd || 0,

      kills_variance: stats.kills_variance || 0,
      deaths_variance: stats.deaths_variance || 0,
      adr_variance: stats.adr_variance || 0,

      first_kill_death_ratio_t:
        stats.first_kill_death_ratio_t || stats.first_kill_death_ratio || 0,
      first_kill_death_ratio_ct:
        stats.first_kill_death_ratio_ct || stats.first_kill_death_ratio || 0
    }
  };
};

/**
 * Get an aggregated skill diagram for multiple players based on filter criteria
 * Returns a single diagram that represents the average/aggregate of all matching players
 * @param params Filter parameters
 * @returns A single PlayerSkillDiagram object representing the aggregate values
 */
export const getMultiplePlayersSkillDiagrams = async (
  params: ParsedParams
): Promise<PlayerSkillDiagram | null> => {
  const {
    season_ids,
    map_ids,
    team_ids,
    faceit_level,
    cs2_rank_min,
    cs2_rank_max,
    tier
  } = params;

  // Build filters using generateQueryWithFilters
  const filters: Filter[] = [
    { column: "m.season_id", value: season_ids || null },
    { column: "mg.map_id", value: map_ids || null }
  ];

  // Add player-specific filters (only one as per requirements)
  if (team_ids && team_ids.length > 0) {
    filters.push({ column: "stp.team_id", value: team_ids });
  } else if (tier !== null && tier !== undefined) {
    // Since we removed the SeasonLeagues join, we need to handle tier filtering differently
    // For now, we'll skip this filter as it requires complex joins
    console.warn(
      "Tier filtering requires SeasonLeagues join which was removed to fix SQL error"
    );
  } else if (faceit_level !== null && faceit_level !== undefined) {
    filters.push({ column: "spr.faceit_level", value: [faceit_level] });
  } else if (
    cs2_rank_min !== null &&
    cs2_rank_max !== null &&
    cs2_rank_min !== undefined &&
    cs2_rank_max !== undefined
  ) {
    filters.push({
      column: "spr.cs2_rank",
      between: [cs2_rank_min, cs2_rank_max]
    });
  }

  const { query: filterQuery, queryParams: filterParams } =
    generateQueryWithFilters(filters);

  // Create a descriptive name for the filter
  let filterDescription = "";
  if (team_ids && team_ids.length > 0) {
    filterDescription = `Team Players`;
  } else if (tier !== null && tier !== undefined) {
    filterDescription = `Tier ${tier} Players`;
  } else if (faceit_level !== null && faceit_level !== undefined) {
    filterDescription = `Faceit Level ${faceit_level} Players`;
  } else if (cs2_rank_min !== null && cs2_rank_max !== null) {
    filterDescription = `CS2 Rank ${cs2_rank_min}-${cs2_rank_max} Players`;
  } else {
    filterDescription = "All Players";
  }

  // First, get all player IDs that match our filter criteria
  const playerQuery = `
    SELECT DISTINCT p.steam_id
    FROM SteamPlayers p
    JOIN PlayerStats ps ON ps.steam_id = p.steam_id
    JOIN MatchGames mg ON mg.id = ps.match_game_id
    JOIN MapRoundStats mrs ON mrs.match_game_id = mg.id
    JOIN Matches m ON m.id = mg.match_id
    LEFT JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id AND stp.season_id = m.season_id
    LEFT JOIN SeasonPlayerRanks spr ON spr.steam_id = p.steam_id AND spr.season_id = m.season_id
    WHERE ${filterQuery}
    GROUP BY p.steam_id
    HAVING COUNT(DISTINCT ps.match_game_id) >= 3
  `;

  const players = await runQuery<{ steam_id: string }[]>(
    playerQuery,
    filterParams
  );

  if (!players.length) {
    return null;
  }

  // Get individual skill diagrams for each player
  const playerSkillDiagrams: PlayerSkillDiagram[] = [];

  for (const player of players) {
    const skillDiagram = await getPlayerSkillDiagram(player.steam_id, params);
    if (skillDiagram) {
      playerSkillDiagrams.push(skillDiagram);
    }
  }

  if (playerSkillDiagrams.length === 0) {
    return null;
  }

  // Calculate averages of the normalized scores
  const totalPlayers = playerSkillDiagrams.length;

  // Sum up all the scores
  const summedScores = playerSkillDiagrams.reduce(
    (sum, diagram) => {
      return {
        overall_rating: sum.overall_rating + diagram.overall_rating,
        aim: sum.aim + diagram.aim,
        positioning: sum.positioning + diagram.positioning,
        impact: sum.impact + diagram.impact,
        utility: sum.utility + diagram.utility,
        consistency: sum.consistency + diagram.consistency,
        detailed_metrics: {
          hs_percent:
            sum.detailed_metrics.hs_percent +
            diagram.detailed_metrics.hs_percent,
          kd: sum.detailed_metrics.kd + diagram.detailed_metrics.kd,
          adr: sum.detailed_metrics.adr + diagram.detailed_metrics.adr,
          ttd: sum.detailed_metrics.ttd + diagram.detailed_metrics.ttd,
          counter_strafing:
            sum.detailed_metrics.counter_strafing +
            diagram.detailed_metrics.counter_strafing,
          crosshair_placement:
            sum.detailed_metrics.crosshair_placement +
            diagram.detailed_metrics.crosshair_placement,
          first_kill_death_ratio:
            sum.detailed_metrics.first_kill_death_ratio +
            diagram.detailed_metrics.first_kill_death_ratio,
          first_death_trade_percentage:
            sum.detailed_metrics.first_death_trade_percentage +
            diagram.detailed_metrics.first_death_trade_percentage,
          trade_opportunities_converted:
            sum.detailed_metrics.trade_opportunities_converted +
            diagram.detailed_metrics.trade_opportunities_converted,
          first_death_trade_attempts_ratio:
            sum.detailed_metrics.first_death_trade_attempts_ratio +
            diagram.detailed_metrics.first_death_trade_attempts_ratio,
          first_death_traded_ratio:
            sum.detailed_metrics.first_death_traded_ratio +
            diagram.detailed_metrics.first_death_traded_ratio,
          good_deaths_percentage:
            sum.detailed_metrics.good_deaths_percentage +
            diagram.detailed_metrics.good_deaths_percentage,
          tradeable_first_deaths_percentage:
            sum.detailed_metrics.tradeable_first_deaths_percentage +
            diagram.detailed_metrics.tradeable_first_deaths_percentage,
          // New positioning metrics
          traded_deaths_success_percentage:
            sum.detailed_metrics.traded_deaths_success_percentage +
            diagram.detailed_metrics.traded_deaths_success_percentage,
          traded_death_attempts_percentage:
            sum.detailed_metrics.traded_death_attempts_percentage +
            diagram.detailed_metrics.traded_death_attempts_percentage,
          trade_kill_opportunities_per_round:
            sum.detailed_metrics.trade_kill_opportunities_per_round +
            diagram.detailed_metrics.trade_kill_opportunities_per_round,
          trade_kill_success_percentage:
            sum.detailed_metrics.trade_kill_success_percentage +
            diagram.detailed_metrics.trade_kill_success_percentage,
          trade_kill_attempts_percentage:
            sum.detailed_metrics.trade_kill_attempts_percentage +
            diagram.detailed_metrics.trade_kill_attempts_percentage,
          trade_death_opportunities_per_round:
            sum.detailed_metrics.trade_death_opportunities_per_round +
            diagram.detailed_metrics.trade_death_opportunities_per_round,
          t_opening_duel_success_percentage:
            sum.detailed_metrics.t_opening_duel_success_percentage +
            diagram.detailed_metrics.t_opening_duel_success_percentage,
          ct_opening_duel_success_percentage:
            sum.detailed_metrics.ct_opening_duel_success_percentage +
            diagram.detailed_metrics.ct_opening_duel_success_percentage,
          kast: sum.detailed_metrics.kast + diagram.detailed_metrics.kast,
          clutches_won_percentage:
            sum.detailed_metrics.clutches_won_percentage +
            diagram.detailed_metrics.clutches_won_percentage,
          multikills:
            sum.detailed_metrics.multikills +
            diagram.detailed_metrics.multikills,
          kana_rating:
            sum.detailed_metrics.kana_rating +
            diagram.detailed_metrics.kana_rating,
          one_v_one_win_ratio:
            sum.detailed_metrics.one_v_one_win_ratio +
            diagram.detailed_metrics.one_v_one_win_ratio,
          first_kills_per_round:
            sum.detailed_metrics.first_kills_per_round +
            diagram.detailed_metrics.first_kills_per_round,
          first_kill_success_ratio:
            sum.detailed_metrics.first_kill_success_ratio +
            diagram.detailed_metrics.first_kill_success_ratio,
          trades_per_round:
            sum.detailed_metrics.trades_per_round +
            diagram.detailed_metrics.trades_per_round,
          flash_assists:
            sum.detailed_metrics.flash_assists +
            diagram.detailed_metrics.flash_assists,
          enemies_flashed:
            sum.detailed_metrics.enemies_flashed +
            diagram.detailed_metrics.enemies_flashed,
          enemies_flashed_duration:
            sum.detailed_metrics.enemies_flashed_duration +
            diagram.detailed_metrics.enemies_flashed_duration,
          utility_damage:
            sum.detailed_metrics.utility_damage +
            diagram.detailed_metrics.utility_damage,
          he_damage_per_round:
            sum.detailed_metrics.he_damage_per_round +
            diagram.detailed_metrics.he_damage_per_round,
          molotov_damage_per_round:
            sum.detailed_metrics.molotov_damage_per_round +
            diagram.detailed_metrics.molotov_damage_per_round,
          teammates_flashed_inverse:
            sum.detailed_metrics.teammates_flashed_inverse +
            diagram.detailed_metrics.teammates_flashed_inverse,
          flash_assists_per_flash:
            sum.detailed_metrics.flash_assists_per_flash +
            diagram.detailed_metrics.flash_assists_per_flash,
          enemies_flashed_per_flash:
            sum.detailed_metrics.enemies_flashed_per_flash +
            diagram.detailed_metrics.enemies_flashed_per_flash,
          teammates_flashed_per_flash:
            sum.detailed_metrics.teammates_flashed_per_flash +
            diagram.detailed_metrics.teammates_flashed_per_flash,
          ct_t_balance:
            sum.detailed_metrics.ct_t_balance +
            diagram.detailed_metrics.ct_t_balance,
          map_consistency:
            sum.detailed_metrics.map_consistency +
            diagram.detailed_metrics.map_consistency,
          clutch_vs_entry_balance:
            sum.detailed_metrics.clutch_vs_entry_balance +
            diagram.detailed_metrics.clutch_vs_entry_balance,
          trade_death_ratio:
            sum.detailed_metrics.trade_death_ratio +
            diagram.detailed_metrics.trade_death_ratio,
          adr_t: sum.detailed_metrics.adr_t + diagram.detailed_metrics.adr_t,
          adr_ct: sum.detailed_metrics.adr_ct + diagram.detailed_metrics.adr_ct,
          kd_t: sum.detailed_metrics.kd_t + diagram.detailed_metrics.kd_t,
          kd_ct: sum.detailed_metrics.kd_ct + diagram.detailed_metrics.kd_ct,
          kills_variance:
            sum.detailed_metrics.kills_variance +
            diagram.detailed_metrics.kills_variance,
          deaths_variance:
            sum.detailed_metrics.deaths_variance +
            diagram.detailed_metrics.deaths_variance,
          adr_variance:
            sum.detailed_metrics.adr_variance +
            diagram.detailed_metrics.adr_variance,
          first_kill_death_ratio_t:
            sum.detailed_metrics.first_kill_death_ratio_t +
            diagram.detailed_metrics.first_kill_death_ratio_t,
          first_kill_death_ratio_ct:
            sum.detailed_metrics.first_kill_death_ratio_ct +
            diagram.detailed_metrics.first_kill_death_ratio_ct,
          accuracy:
            sum.detailed_metrics.accuracy + diagram.detailed_metrics.accuracy
        }
      };
    },
    {
      overall_rating: 0,
      aim: 0,
      positioning: 0,
      impact: 0,
      utility: 0,
      consistency: 0,
      detailed_metrics: {
        hs_percent: 0,
        kd: 0,
        adr: 0,
        ttd: 0,
        counter_strafing: 0,
        crosshair_placement: 0,
        first_kill_death_ratio: 0,
        first_death_trade_percentage: 0,
        trade_opportunities_converted: 0,
        first_death_trade_attempts_ratio: 0,
        first_death_traded_ratio: 0,
        good_deaths_percentage: 0,
        tradeable_first_deaths_percentage: 0,
        // New positioning metrics
        traded_deaths_success_percentage: 0,
        traded_death_attempts_percentage: 0,
        trade_kill_opportunities_per_round: 0,
        trade_kill_success_percentage: 0,
        trade_kill_attempts_percentage: 0,
        trade_death_opportunities_per_round: 0,
        t_opening_duel_success_percentage: 0,
        ct_opening_duel_success_percentage: 0,
        kast: 0,
        clutches_won_percentage: 0,
        multikills: 0,
        kana_rating: 0,
        one_v_one_win_ratio: 0,
        first_kills_per_round: 0,
        first_kill_success_ratio: 0,
        trades_per_round: 0,
        flash_assists: 0,
        enemies_flashed: 0,
        enemies_flashed_duration: 0,
        utility_damage: 0,
        he_damage_per_round: 0,
        molotov_damage_per_round: 0,
        teammates_flashed_inverse: 0,
        flash_assists_per_flash: 0,
        enemies_flashed_per_flash: 0,
        teammates_flashed_per_flash: 0,
        ct_t_balance: 0,
        map_consistency: 0,
        clutch_vs_entry_balance: 0,
        trade_death_ratio: 0,
        adr_t: 0,
        adr_ct: 0,
        kd_t: 0,
        kd_ct: 0,
        kills_variance: 0,
        deaths_variance: 0,
        adr_variance: 0,
        first_kill_death_ratio_t: 0,
        first_kill_death_ratio_ct: 0,
        accuracy: 0
      }
    }
  );

  // Calculate averages
  const aggregatedSkillDiagram: PlayerSkillDiagram = {
    steam_id: "aggregate",
    nickname: filterDescription,
    overall_rating: Math.round(summedScores.overall_rating / totalPlayers),
    aim: Math.round(summedScores.aim / totalPlayers),
    positioning: Math.round(summedScores.positioning / totalPlayers),
    impact: Math.round(summedScores.impact / totalPlayers),
    utility: Math.round(summedScores.utility / totalPlayers),
    consistency: Math.round(summedScores.consistency / totalPlayers),
    detailed_metrics: {
      hs_percent: summedScores.detailed_metrics.hs_percent / totalPlayers,
      kd: summedScores.detailed_metrics.kd / totalPlayers,
      adr: summedScores.detailed_metrics.adr / totalPlayers,
      ttd: summedScores.detailed_metrics.ttd / totalPlayers,
      counter_strafing:
        summedScores.detailed_metrics.counter_strafing / totalPlayers,
      crosshair_placement:
        summedScores.detailed_metrics.crosshair_placement / totalPlayers,
      first_kill_death_ratio:
        summedScores.detailed_metrics.first_kill_death_ratio / totalPlayers,
      first_death_trade_percentage:
        summedScores.detailed_metrics.first_death_trade_percentage /
        totalPlayers,
      trade_opportunities_converted:
        summedScores.detailed_metrics.trade_opportunities_converted /
        totalPlayers,
      first_death_trade_attempts_ratio:
        summedScores.detailed_metrics.first_death_trade_attempts_ratio /
        totalPlayers,
      first_death_traded_ratio:
        summedScores.detailed_metrics.first_death_traded_ratio / totalPlayers,
      good_deaths_percentage:
        summedScores.detailed_metrics.good_deaths_percentage / totalPlayers,
      tradeable_first_deaths_percentage:
        summedScores.detailed_metrics.tradeable_first_deaths_percentage /
        totalPlayers,
      // New positioning metrics
      traded_deaths_success_percentage:
        summedScores.detailed_metrics.traded_deaths_success_percentage /
        totalPlayers,
      traded_death_attempts_percentage:
        summedScores.detailed_metrics.traded_death_attempts_percentage /
        totalPlayers,
      trade_kill_opportunities_per_round:
        summedScores.detailed_metrics.trade_kill_opportunities_per_round /
        totalPlayers,
      trade_kill_success_percentage:
        summedScores.detailed_metrics.trade_kill_success_percentage /
        totalPlayers,
      trade_kill_attempts_percentage:
        summedScores.detailed_metrics.trade_kill_attempts_percentage /
        totalPlayers,
      trade_death_opportunities_per_round:
        summedScores.detailed_metrics.trade_death_opportunities_per_round /
        totalPlayers,
      t_opening_duel_success_percentage:
        summedScores.detailed_metrics.t_opening_duel_success_percentage /
        totalPlayers,
      ct_opening_duel_success_percentage:
        summedScores.detailed_metrics.ct_opening_duel_success_percentage /
        totalPlayers,
      kast: summedScores.detailed_metrics.kast / totalPlayers,
      clutches_won_percentage:
        summedScores.detailed_metrics.clutches_won_percentage / totalPlayers,
      multikills: summedScores.detailed_metrics.multikills / totalPlayers,
      kana_rating: summedScores.detailed_metrics.kana_rating / totalPlayers,
      one_v_one_win_ratio:
        summedScores.detailed_metrics.one_v_one_win_ratio / totalPlayers,
      first_kills_per_round:
        summedScores.detailed_metrics.first_kills_per_round / totalPlayers,
      first_kill_success_ratio:
        summedScores.detailed_metrics.first_kill_success_ratio / totalPlayers,
      trades_per_round:
        summedScores.detailed_metrics.trades_per_round / totalPlayers,
      flash_assists: summedScores.detailed_metrics.flash_assists / totalPlayers,
      enemies_flashed:
        summedScores.detailed_metrics.enemies_flashed / totalPlayers,
      enemies_flashed_duration:
        summedScores.detailed_metrics.enemies_flashed_duration / totalPlayers,
      utility_damage:
        summedScores.detailed_metrics.utility_damage / totalPlayers,
      he_damage_per_round:
        summedScores.detailed_metrics.he_damage_per_round / totalPlayers,
      molotov_damage_per_round:
        summedScores.detailed_metrics.molotov_damage_per_round / totalPlayers,
      teammates_flashed_inverse:
        summedScores.detailed_metrics.teammates_flashed_inverse / totalPlayers,
      flash_assists_per_flash:
        summedScores.detailed_metrics.flash_assists_per_flash / totalPlayers,
      enemies_flashed_per_flash:
        summedScores.detailed_metrics.enemies_flashed_per_flash / totalPlayers,
      teammates_flashed_per_flash:
        summedScores.detailed_metrics.teammates_flashed_per_flash /
        totalPlayers,
      ct_t_balance: summedScores.detailed_metrics.ct_t_balance / totalPlayers,
      map_consistency:
        summedScores.detailed_metrics.map_consistency / totalPlayers,
      clutch_vs_entry_balance:
        summedScores.detailed_metrics.clutch_vs_entry_balance / totalPlayers,
      trade_death_ratio:
        summedScores.detailed_metrics.trade_death_ratio / totalPlayers,
      adr_t: summedScores.detailed_metrics.adr_t / totalPlayers,
      adr_ct: summedScores.detailed_metrics.adr_ct / totalPlayers,
      kd_t: summedScores.detailed_metrics.kd_t / totalPlayers,
      kd_ct: summedScores.detailed_metrics.kd_ct / totalPlayers,
      kills_variance:
        summedScores.detailed_metrics.kills_variance / totalPlayers,
      deaths_variance:
        summedScores.detailed_metrics.deaths_variance / totalPlayers,
      adr_variance: summedScores.detailed_metrics.adr_variance / totalPlayers,
      first_kill_death_ratio_t:
        summedScores.detailed_metrics.first_kill_death_ratio_t / totalPlayers,
      first_kill_death_ratio_ct:
        summedScores.detailed_metrics.first_kill_death_ratio_ct / totalPlayers,
      accuracy: summedScores.detailed_metrics.accuracy / totalPlayers
    }
  };

  return aggregatedSkillDiagram;
};
