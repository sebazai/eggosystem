import { runQuery } from "../db/mysqlRunQuery";

/* ─────────────────────────────────────────────────────────
 *  Flash Leaderboard
 * ─────────────────────────────────────────────────────────*/

export type FlashLeaderboardSortBy =
  | "blind_time"
  | "flash_count"
  | "discipline";

export interface FlashLeaderboardEntry {
  rank: number;
  steam_id: string;
  games_played: number;
  total_enemy_blind_time: number;
  avg_enemy_blind_time_per_game: number;
  enemy_flash_count: number;
  discipline_ratio: number;
  teammate_flash_rate: number;
}

export const getFlashLeaderboard = async (
  tournament_id: number,
  options: { sortBy?: FlashLeaderboardSortBy; minGames?: number } = {}
): Promise<FlashLeaderboardEntry[]> => {
  const { sortBy = "blind_time", minGames = 1 } = options;

  const orderClause = {
    blind_time: "total_enemy_blind_time DESC",
    flash_count: "enemy_flash_count DESC",
    discipline: "discipline_ratio DESC"
  }[sortBy];

  const rows = await runQuery<
    {
      steam_id: string | number;
      games_played: number;
      total_enemy_blind_time: number;
      enemy_flash_count: number;
      total_teammate_flashes: number;
      total_flashes: number;
    }[]
  >(
    `SELECT
      fe.thrower_steam_id                    AS steam_id,
      COUNT(DISTINCT fe.match_game_id)       AS games_played,
      SUM(CASE WHEN fe.is_enemy_flash = 1 THEN fe.duration_seconds ELSE 0 END)
                                             AS total_enemy_blind_time,
      SUM(fe.is_enemy_flash)                 AS enemy_flash_count,
      SUM(fe.is_teammate_flash)              AS total_teammate_flashes,
      COUNT(*)                               AS total_flashes
    FROM FlashEvents fe
    JOIN MatchGames mg ON mg.id = fe.match_game_id
    JOIN Matches m     ON m.id  = mg.match_id
    WHERE m.season_id = ?
    GROUP BY fe.thrower_steam_id
    HAVING games_played >= ?
    ORDER BY ${orderClause}`,
    [tournament_id, minGames]
  );

  return rows.map((r, i) => {
    const gamesPlayed = Number(r.games_played);
    const totalEnemyBlind = Number(r.total_enemy_blind_time ?? 0);
    const enemyFlashes = Number(r.enemy_flash_count);
    const teammateFlashes = Number(r.total_teammate_flashes);
    const totalFlashes = Number(r.total_flashes);

    return {
      rank: i + 1,
      steam_id: String(r.steam_id),
      games_played: gamesPlayed,
      total_enemy_blind_time: Number(totalEnemyBlind.toFixed(3)),
      avg_enemy_blind_time_per_game:
        gamesPlayed > 0
          ? Number((totalEnemyBlind / gamesPlayed).toFixed(3))
          : 0,
      enemy_flash_count: enemyFlashes,
      discipline_ratio:
        totalFlashes > 0 ? Number((enemyFlashes / totalFlashes).toFixed(3)) : 0,
      teammate_flash_rate:
        totalFlashes > 0
          ? Number((teammateFlashes / totalFlashes).toFixed(3))
          : 0
    };
  });
};

/* ─────────────────────────────────────────────────────────
 *  Round Impact Leaderboard
 * ─────────────────────────────────────────────────────────*/

export interface RoundImpactLeaderboardEntry {
  rank: number;
  steam_id: string;
  games_played: number;
  total_events: number;
  total_impact_score: number;
  avg_impact_per_event: number;
  biggest_single_swing: number;
}

export const getRoundImpactLeaderboard = async (
  tournament_id: number,
  options: { minGames?: number } = {}
): Promise<RoundImpactLeaderboardEntry[]> => {
  const { minGames = 1 } = options;

  const rows = await runQuery<
    {
      steam_id: string | number;
      games_played: number;
      total_events: number;
      total_impact_score: number;
      avg_impact_per_event: number;
      biggest_single_swing: number;
    }[]
  >(
    `SELECT
      rse.primary_player_steam_id           AS steam_id,
      COUNT(DISTINCT rse.match_game_id)     AS games_played,
      COUNT(*)                              AS total_events,
      SUM(ABS(rse.delta))                   AS total_impact_score,
      AVG(ABS(rse.delta))                   AS avg_impact_per_event,
      MAX(ABS(rse.delta))                   AS biggest_single_swing
    FROM RoundSwingEvents rse
    JOIN MatchGames mg ON mg.id = rse.match_game_id
    JOIN Matches m     ON m.id  = mg.match_id
    WHERE m.season_id = ?
    GROUP BY rse.primary_player_steam_id
    HAVING games_played >= ?
    ORDER BY total_impact_score DESC`,
    [tournament_id, minGames]
  );

  return rows.map((r, i) => ({
    rank: i + 1,
    steam_id: String(r.steam_id),
    games_played: Number(r.games_played),
    total_events: Number(r.total_events),
    total_impact_score: Number(Number(r.total_impact_score ?? 0).toFixed(4)),
    avg_impact_per_event: Number(
      Number(r.avg_impact_per_event ?? 0).toFixed(4)
    ),
    biggest_single_swing: Number(Number(r.biggest_single_swing ?? 0).toFixed(4))
  }));
};

/* ─────────────────────────────────────────────────────────
 *  Utility Discipline Leaderboard
 * ─────────────────────────────────────────────────────────*/

export type UtilityDisciplineSortBy = "wasted_asc" | "utility_damage_desc";

export interface UtilityDisciplineLeaderboardEntry {
  rank: number;
  steam_id: string;
  games_played: number;
  rounds_played: number;
  total_wasted_utility: number;
  avg_wasted_per_game: number;
  avg_utility_damage_per_round: number;
  /** null when the player has no FlashEvents rows (pre-FlashEvents data) */
  avg_enemies_flashed_per_round: number | null;
}

export const getUtilityDisciplineLeaderboard = async (
  tournament_id: number,
  options: {
    sortBy?: UtilityDisciplineSortBy;
    minGames?: number;
  } = {}
): Promise<UtilityDisciplineLeaderboardEntry[]> => {
  const { sortBy = "wasted_asc", minGames = 1 } = options;

  const orderClause =
    sortBy === "wasted_asc"
      ? "COALESCE(wasted.total_wasted, 0) / COUNT(DISTINCT rus.match_game_id) ASC"
      : "SUM(rus.utility_damage) / COUNT(*) DESC";

  const rows = await runQuery<
    {
      steam_id: string | number;
      games_played: number;
      rounds_played: number;
      total_wasted_utility: number;
      total_utility_damage: number;
      total_enemies_flashed: number | null;
    }[]
  >(
    `SELECT
      rus.steam_id,
      COUNT(DISTINCT rus.match_game_id)   AS games_played,
      COUNT(*)                            AS rounds_played,
      SUM(rus.utility_damage)             AS total_utility_damage,
      COALESCE(wasted.total_wasted, 0)    AS total_wasted_utility,
      flashes.total_enemy                 AS total_enemies_flashed
    FROM RoundUtilitySummary rus
    JOIN MatchGames mg ON mg.id = rus.match_game_id
    JOIN Matches m     ON m.id  = mg.match_id
    LEFT JOIN (
      SELECT wue.thrower_steam_id, COUNT(*) AS total_wasted
      FROM WastedUtilityEvents wue
      JOIN MatchGames mg2 ON mg2.id = wue.match_game_id
      JOIN Matches m2     ON m2.id  = mg2.match_id
      WHERE m2.season_id = ?
      GROUP BY wue.thrower_steam_id
    ) wasted  ON wasted.thrower_steam_id  = rus.steam_id
    LEFT JOIN (
      SELECT fe.thrower_steam_id, SUM(fe.is_enemy_flash) AS total_enemy
      FROM FlashEvents fe
      JOIN MatchGames mg3 ON mg3.id = fe.match_game_id
      JOIN Matches m3     ON m3.id  = mg3.match_id
      WHERE m3.season_id = ?
      GROUP BY fe.thrower_steam_id
    ) flashes ON flashes.thrower_steam_id = rus.steam_id
    WHERE m.season_id = ?
    GROUP BY rus.steam_id
    HAVING games_played >= ?
    ORDER BY ${orderClause}`,
    [tournament_id, tournament_id, tournament_id, minGames]
  );

  return rows.map((r, i) => {
    const gamesPlayed = Number(r.games_played);
    const roundsPlayed = Number(r.rounds_played);
    const totalWasted = Number(r.total_wasted_utility ?? 0);

    return {
      rank: i + 1,
      steam_id: String(r.steam_id),
      games_played: gamesPlayed,
      rounds_played: roundsPlayed,
      total_wasted_utility: totalWasted,
      avg_wasted_per_game:
        gamesPlayed > 0 ? Number((totalWasted / gamesPlayed).toFixed(2)) : 0,
      avg_utility_damage_per_round:
        roundsPlayed > 0
          ? Number((Number(r.total_utility_damage) / roundsPlayed).toFixed(2))
          : 0,
      avg_enemies_flashed_per_round:
        r.total_enemies_flashed != null && roundsPlayed > 0
          ? Number((Number(r.total_enemies_flashed) / roundsPlayed).toFixed(2))
          : null
    };
  });
};
