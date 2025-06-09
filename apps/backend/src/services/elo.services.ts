import { runQuery } from "../db/mysqlRunQuery";
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
    }
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
