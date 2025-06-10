import { runQuery } from "../db/mysqlRunQuery";
import { redisClient, expireIn7Days } from "../utils/redisClient";

const expireIn30Days = 30 * 24 * 60 * 60; // 30 days for team flags
import { logger } from "../utils/app-logger";

interface StabilizeResult {
  adjusted_elo: number;
  reason?: string;
  details?: {
    current_elo: number;
    offered_elo: number;
    player_rating: number;
    league_avg_rating: number;
    season_id: number;
    league_id: number;
    sample_size: number;
  };
  teamFlagged?: boolean;
  flagReason?: string;
}

interface PlayerEloRow {
  kana_elo: number | null;
}

interface SeasonLeagueRow {
  season_id: number;
  league_id: number;
  avg_kana_rating: number;
}

interface PlayerRatingRow {
  avg_player_rating: number;
}

interface LeagueAvgRatingRow {
  rowCount: number;
  leagueAvgRating: number;
}

interface TeamRow {
  team_id: number;
}

interface EloAdjustmentData {
  steam_id: string;
  season_id: number;
  league_id: number;
  team_id: number;
  offered_elo: number;
  adjusted_elo: number;
  adjustment_reason: string;
  timestamp: string;
}

interface TeamValidationResult {
  isValid: boolean;
  reason?: string;
  existingAdjustments?: EloAdjustmentData[];
  avgOfferedElo?: number;
  avgAdjustedElo?: number;
}

interface TeamFlagData {
  season_id: number;
  league_id: number;
  team_id: number;
  flagged: boolean;
  reason: string;
  flagged_players: string[];
  timestamp: string;
}

export const stabilizePlayerElo = async (
  steam_id: string,
  offered_elo: number
): Promise<StabilizeResult> => {
  // Get current player ELO
  const currentEloResults = await runQuery<PlayerEloRow[]>(
    "SELECT kana_elo FROM SeasonPlayerRanks WHERE steam_id = ? ORDER BY season_id DESC LIMIT 1",
    [steam_id]
  );

  if (
    !currentEloResults.length ||
    currentEloResults[0].kana_elo === null ||
    currentEloResults[0].kana_elo === 0
  ) {
    logger.info(
      `Could not find current ELO for ${steam_id}, returning offered ELO`
    );
    return {
      adjusted_elo: offered_elo,
      reason: "No current ELO found for player"
    };
  }

  const current_elo = currentEloResults[0].kana_elo;

  // Get latest season and league data for the player
  const seasonLeagueResults = await runQuery<SeasonLeagueRow[]>(
    `SELECT 
       ps.season_id,
       mt.league_id,
       AVG(ps.rating) as avg_kana_rating
     FROM PlayerStats ps
     INNER JOIN MatchGames mg ON ps.game_id = mg.id
     INNER JOIN Matches m ON mg.match_id = m.id
     INNER JOIN MatchTeams mt ON m.id = mt.match_id
     WHERE ps.steam_id = ?
     GROUP BY ps.season_id, mt.league_id
     ORDER BY ps.season_id DESC, AVG(ps.rating) DESC
     LIMIT 1`,
    [steam_id]
  );

  if (!seasonLeagueResults.length) {
    logger.info(
      `Could not find season/league data for ${steam_id}, returning offered ELO`
    );
    return {
      adjusted_elo: offered_elo,
      reason: "No season or league data found for player"
    };
  }

  const {
    season_id,
    league_id,
    avg_kana_rating: player_rating
  } = seasonLeagueResults[0];

  // Get player's average rating for validation
  const playerRatingResults = await runQuery<PlayerRatingRow[]>(
    `SELECT AVG(ps.rating) as avg_player_rating
     FROM PlayerStats ps
     INNER JOIN MatchGames mg ON ps.game_id = mg.id
     INNER JOIN Matches m ON mg.match_id = m.id
     INNER JOIN MatchTeams mt ON m.id = mt.match_id
     WHERE ps.steam_id = ? AND mt.league_id = ?`,
    [steam_id, league_id]
  );

  if (!playerRatingResults.length) {
    logger.info(
      `Could not find player rating for ${steam_id}, returning offered ELO`
    );
    return {
      adjusted_elo: offered_elo,
      reason: "No player rating data found"
    };
  }

  // Get league average rating for players with similar ELO (±10)
  const leagueAvgResults = await runQuery<LeagueAvgRatingRow[]>(
    `SELECT 
       COUNT(DISTINCT ps.steam_id) as rowCount,
       AVG(ps.rating) as leagueAvgRating
     FROM PlayerStats ps
     INNER JOIN MatchGames mg ON ps.game_id = mg.id
     INNER JOIN Matches m ON mg.match_id = m.id
     INNER JOIN MatchTeams mt ON m.id = mt.match_id
     INNER JOIN SeasonPlayerRanks spr ON ps.steam_id = spr.steam_id AND spr.season_id = ?
     WHERE mt.league_id = ? 
       AND spr.kana_elo BETWEEN ? AND ?`,
    [season_id, league_id, current_elo - 10, current_elo + 10]
  );

  if (!leagueAvgResults.length || leagueAvgResults[0].rowCount < 100) {
    const sample_size = leagueAvgResults.length
      ? leagueAvgResults[0].rowCount
      : 0;
    logger.info(
      `Sample size for ${steam_id} stabilizer is too low: ${sample_size} (minimum 100 required)`
    );
    return {
      adjusted_elo: offered_elo,
      reason: `Sample size too small (${sample_size} players, minimum 100 required)`
    };
  }

  const { rowCount: sample_size, leagueAvgRating: league_avg_rating } =
    leagueAvgResults[0];

  logger.info(
    `Stabilizing ${steam_id}: season ${season_id}, league ${league_id}, player rating ${player_rating}, league avg ${league_avg_rating}`
  );

  // Apply adjustment using the adjuster function logic
  const adjusted_elo = adjuster(offered_elo, player_rating, league_avg_rating);

  logger.info(
    `Stabilizing ${steam_id}: offered ${offered_elo}, returning ${adjusted_elo}`
  );

  // Get player's team for this season/league
  const teamResults = await runQuery<TeamRow[]>(
    `SELECT stp.team_id 
     FROM SeasonTeamPlayers stp
     INNER JOIN SeasonLeagueTeams slt ON stp.team_id = slt.team_id AND stp.season_id = slt.season_id
     WHERE stp.steam_id = ? AND stp.season_id = ? AND slt.league_id = ?
     LIMIT 1`,
    [steam_id, season_id, league_id]
  );

  const team_id = teamResults.length > 0 ? teamResults[0].team_id : 0;

  // Store adjustment data in Redis
  await storeEloAdjustment({
    steam_id,
    season_id,
    league_id,
    team_id,
    offered_elo,
    adjusted_elo,
    adjustment_reason: "stabilized"
  });

  // Validate team adjustments and flag if necessary
  let teamFlagged = false;
  let flagReason: string | undefined;

  if (team_id > 0) {
    const validation = await validateTeamEloAdjustments(
      steam_id,
      team_id,
      season_id,
      league_id,
      offered_elo,
      adjusted_elo
    );

    if (!validation.isValid) {
      teamFlagged = true;
      flagReason = validation.reason;

      // Get all adjustments for flag data
      const allAdjustments = await getTeamEloAdjustments(
        season_id,
        league_id,
        team_id
      );
      const flaggedPlayers = [
        ...allAdjustments.map((adj) => adj.steam_id),
        steam_id
      ];

      await storeTeamFlag({
        season_id,
        league_id,
        team_id,
        flagged: true,
        reason: validation.reason || "Team validation failed",
        flagged_players: flaggedPlayers
      });

      logger.warn(
        `Team ${team_id} flagged for inspection: ${validation.reason}`
      );
    }
  }

  return {
    adjusted_elo,
    details: {
      current_elo,
      offered_elo,
      player_rating,
      league_avg_rating,
      season_id,
      league_id,
      sample_size
    },
    teamFlagged,
    flagReason
  };
};

export const storeEloAdjustment = async (
  data: Omit<EloAdjustmentData, "timestamp">
): Promise<void> => {
  const adjustmentData: EloAdjustmentData = {
    ...data,
    timestamp: new Date().toISOString()
  };

  const redisKey = `elo-adjustment:s${data.season_id}:l${data.league_id}:${data.steam_id}`;

  await redisClient.set(
    redisKey,
    JSON.stringify(adjustmentData),
    "EX",
    expireIn7Days
  );

  logger.info(
    `Stored ELO adjustment for ${data.steam_id}: ${data.offered_elo} -> ${data.adjusted_elo}`
  );
};

export const storeTeamFlag = async (
  data: Omit<TeamFlagData, "timestamp">
): Promise<void> => {
  const flagData: TeamFlagData = {
    ...data,
    timestamp: new Date().toISOString()
  };

  const redisKey = `team-flag:s${data.season_id}:l${data.league_id}:${data.team_id}`;

  await redisClient.set(
    redisKey,
    JSON.stringify(flagData),
    "EX",
    expireIn30Days
  );

  logger.info(`Stored team flag for team ${data.team_id}: ${data.reason}`);
};

export const getTeamFlag = async (
  season_id: number,
  league_id: number,
  team_id: number
): Promise<TeamFlagData | null> => {
  const redisKey = `team-flag:s${season_id}:l${league_id}:${team_id}`;

  try {
    const flagData = await redisClient.get(redisKey);
    if (!flagData) {
      return null;
    }

    return JSON.parse(flagData) as TeamFlagData;
  } catch (error) {
    logger.warn(`Failed to parse team flag data: ${error}`);
    return null;
  }
};

export const getTeamEloAdjustments = async (
  season_id: number,
  league_id: number,
  team_id: number
): Promise<EloAdjustmentData[]> => {
  const pattern = `elo-adjustment:s${season_id}:l${league_id}:*`;
  const keys = await redisClient.keys(pattern);

  if (!keys.length) {
    return [];
  }

  const values = await redisClient.mget(...keys);
  const adjustments: EloAdjustmentData[] = [];

  for (const value of values) {
    if (value) {
      try {
        const adjustment = JSON.parse(value) as EloAdjustmentData;
        // Filter by team_id
        if (adjustment.team_id === team_id) {
          adjustments.push(adjustment);
        }
      } catch (error) {
        logger.warn(`Failed to parse ELO adjustment data: ${error}`);
      }
    }
  }

  return adjustments;
};

export const validateTeamEloAdjustments = async (
  steam_id: string,
  team_id: number,
  season_id: number,
  league_id: number,
  offered_elo: number,
  adjusted_elo: number
): Promise<TeamValidationResult> => {
  // Get existing adjustments for this team
  const existingAdjustments = await getTeamEloAdjustments(
    season_id,
    league_id,
    team_id
  );

  // Check rule 2 first: Average offered vs adjusted ELO difference for top 4 players should not be >30 or <-30
  // Since teams always have 5-9 players, we can always check top 4
  const allAdjustments = [
    ...existingAdjustments,
    {
      steam_id,
      season_id,
      league_id,
      team_id,
      offered_elo,
      adjusted_elo,
      adjustment_reason: "proposed",
      timestamp: new Date().toISOString()
    }
  ];

  // Sort by adjusted ELO descending and take top 4
  const top4 = allAdjustments
    .sort((a, b) => b.adjusted_elo - a.adjusted_elo)
    .slice(0, 4);

  const avgOfferedElo = top4.reduce((sum, adj) => sum + adj.offered_elo, 0) / 4;
  const avgAdjustedElo =
    top4.reduce((sum, adj) => sum + adj.adjusted_elo, 0) / 4;
  const avgDifference = avgAdjustedElo - avgOfferedElo;

  if (Math.abs(avgDifference) > 30) {
    return {
      isValid: false,
      reason: `Average ELO jump too high for team (${avgDifference.toFixed(1)} ELO difference for top 4 players, limit is ±30)`,
      existingAdjustments,
      avgOfferedElo,
      avgAdjustedElo
    };
  }

  // Check rule 1: No more than 2 players with >30 ELO adjustment
  const highAdjustments = existingAdjustments.filter(
    (adj) => Math.abs(adj.adjusted_elo - adj.offered_elo) > 30
  );

  const currentAdjustment = Math.abs(adjusted_elo - offered_elo);
  if (currentAdjustment > 30 && highAdjustments.length >= 2) {
    return {
      isValid: false,
      reason: `Too many high adjustments for team (${highAdjustments.length + 1} players would have >30 ELO adjustment)`,
      existingAdjustments
    };
  }

  return {
    isValid: true
  };
};

function adjuster(
  offeredElo: number,
  kanaRating: number,
  avgRating: number
): number {
  const diff = kanaRating - avgRating;
  let minmax = -0.2;
  let maxmin = 0.2;

  if (offeredElo > 270) {
    // Scale difference to directly map to 0.9 - 1.1 for high ELO players
    minmax = -0.1;
    maxmin = 0.1;
  }

  const multiplier = 1 + Math.max(minmax, Math.min(maxmin, diff));
  const adjustedElo = offeredElo * multiplier;

  return Math.round(adjustedElo);
}
