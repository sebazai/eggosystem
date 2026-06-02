import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { replaceMatchGameRows } from "../db/replaceMatchGameRows";
import { type RoundUtilitySummaryEntry } from "../types/parse-queue.types";

interface SaveRoundUtilitySummaryParams {
  matchGameId: number;
  entries: RoundUtilitySummaryEntry[];
  connection: PoolConnection;
}

/**
 * Replaces all round utility summary rows for a match game.
 * Delete-then-insert inside the caller's transaction ensures idempotent reparse.
 * The table PK is (match_game_id, round_number, steam_id) so a full delete+reinsert
 * is the safest idempotency strategy rather than trying to upsert partial rows.
 */
export const saveRoundUtilitySummaryForGame = async ({
  matchGameId,
  entries,
  connection
}: SaveRoundUtilitySummaryParams): Promise<void> => {
  await replaceMatchGameRows(
    connection,
    matchGameId,
    "RoundUtilitySummary",
    async () => {
      if (!entries || entries.length === 0) return;

      const values = entries.map((e) => [
        matchGameId,
        e.round_number,
        String(e.steam_id),
        e.flashes_thrown,
        e.smokes_thrown,
        e.utility_damage
      ]);

      const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");

      await runQuery(
        `INSERT INTO RoundUtilitySummary (
          match_game_id, round_number, steam_id,
          flashes_thrown, smokes_thrown, utility_damage
        ) VALUES ${placeholders}`,
        values.flat(),
        connection
      );
    }
  );
};

/* ─────────────────────────────────────────────────────────
 *  Query: Round Utility Summary
 * ─────────────────────────────────────────────────────────*/

export interface RoundUtilitySummaryRow {
  round_number: number;
  steam_id: string;
  flashes_thrown: number;
  smokes_thrown: number;
  utility_damage: number;
}

export const getRoundUtilitySummary = async (
  match_game_id: number
): Promise<RoundUtilitySummaryRow[]> => {
  const rows = await runQuery<
    {
      round_number: number;
      steam_id: string | number;
      flashes_thrown: number;
      smokes_thrown: number;
      utility_damage: number;
    }[]
  >(
    `SELECT
      round_number,
      steam_id,
      flashes_thrown,
      smokes_thrown,
      utility_damage
    FROM RoundUtilitySummary
    WHERE match_game_id = ?
    ORDER BY round_number ASC, steam_id ASC`,
    [match_game_id]
  );

  return rows.map((r) => ({
    round_number: r.round_number,
    steam_id: String(r.steam_id),
    flashes_thrown: r.flashes_thrown,
    smokes_thrown: r.smokes_thrown,
    utility_damage: r.utility_damage
  }));
};

/* ─────────────────────────────────────────────────────────
 *  Query: Cross-game player utility stats
 * ─────────────────────────────────────────────────────────*/

export interface CrossGamePlayerUtilityStats {
  steam_id: string;
  games_played: number;
  rounds_played: number;
  avg_flashes_thrown_per_round: number;
  avg_enemies_flashed_per_round: number;
  avg_smokes_per_round: number;
  avg_utility_damage_per_round: number;
  avg_wasted_utility_per_game: number;
}

export const getPlayerUtilityStatsCrossGame = async (
  steam_id: string,
  options: { seasonId?: number } = {}
): Promise<CrossGamePlayerUtilityStats> => {
  const params: (string | number)[] = [steam_id];
  const seasonFilter = options.seasonId ? "AND m.season_id = ?" : "";
  if (options.seasonId) params.push(options.seasonId);

  const [summaryRows, wastedRows, flashRows] = await Promise.all([
    runQuery<
      {
        games_played: number;
        rounds_played: number;
        total_flashes_thrown: number;
        total_smokes_thrown: number;
        total_utility_damage: number;
      }[]
    >(
      `SELECT
        COUNT(DISTINCT rus.match_game_id) AS games_played,
        COUNT(*)                          AS rounds_played,
        SUM(rus.flashes_thrown)           AS total_flashes_thrown,
        SUM(rus.smokes_thrown)            AS total_smokes_thrown,
        SUM(rus.utility_damage)           AS total_utility_damage
      FROM RoundUtilitySummary rus
      JOIN MatchGames mg ON mg.id = rus.match_game_id
      JOIN Matches m     ON m.id  = mg.match_id
      WHERE rus.steam_id = ? ${seasonFilter}`,
      params
    ),
    runQuery<{ total_wasted: number }[]>(
      `SELECT COUNT(*) AS total_wasted
      FROM WastedUtilityEvents wue
      JOIN MatchGames mg ON mg.id = wue.match_game_id
      JOIN Matches m     ON m.id  = mg.match_id
      WHERE wue.thrower_steam_id = ? ${seasonFilter}`,
      params
    ),
    runQuery<{ total_enemy_flashes: number }[]>(
      `SELECT SUM(fe.is_enemy_flash) AS total_enemy_flashes
      FROM FlashEvents fe
      JOIN MatchGames mg ON mg.id = fe.match_game_id
      JOIN Matches m     ON m.id  = mg.match_id
      WHERE fe.thrower_steam_id = ? ${seasonFilter}`,
      params
    )
  ]);

  const s = summaryRows[0] ?? {
    games_played: 0,
    rounds_played: 0,
    total_flashes_thrown: 0,
    total_smokes_thrown: 0,
    total_utility_damage: 0
  };
  const gamesPlayed = Number(s.games_played);
  const roundsPlayed = Number(s.rounds_played);
  const totalWasted = Number(wastedRows[0]?.total_wasted ?? 0);
  const totalEnemyFlashes = Number(flashRows[0]?.total_enemy_flashes ?? 0);

  return {
    steam_id,
    games_played: gamesPlayed,
    rounds_played: roundsPlayed,
    avg_flashes_thrown_per_round:
      roundsPlayed > 0
        ? Number((Number(s.total_flashes_thrown) / roundsPlayed).toFixed(2))
        : 0,
    avg_enemies_flashed_per_round:
      roundsPlayed > 0
        ? Number((totalEnemyFlashes / roundsPlayed).toFixed(2))
        : 0,
    avg_smokes_per_round:
      roundsPlayed > 0
        ? Number((Number(s.total_smokes_thrown) / roundsPlayed).toFixed(2))
        : 0,
    avg_utility_damage_per_round:
      roundsPlayed > 0
        ? Number((Number(s.total_utility_damage) / roundsPlayed).toFixed(2))
        : 0,
    avg_wasted_utility_per_game:
      gamesPlayed > 0 ? Number((totalWasted / gamesPlayed).toFixed(2)) : 0
  };
};
