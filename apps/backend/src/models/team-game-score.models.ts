import { type TeamGameScore } from "@eggosystem/types";
import { type PoolConnection, type ResultSetHeader } from "mysql2/promise";
import { getConnection } from "../db/mysqlConnection";
import { runQuery } from "../db/mysqlRunQuery";
import { BadRequestError, InternalServerError } from "../utils/errors";

export const upsertTeamGameScore = async ({
  match_id,
  team_id,
  match_game_id,
  starting_side,
  score,
  halftime_score,
  overtime_score,
  connection
}: Omit<TeamGameScore, "id"> & { connection?: PoolConnection }) => {
  const query = `INSERT INTO TeamGameScores (
    match_id,
    team_id,
    match_game_id,
    starting_side,
    score,
    halftime_score,
    overtime_score
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      match_game_id = VALUES(match_game_id),
      starting_side = VALUES(starting_side),
      score = VALUES(score),
      halftime_score = VALUES(halftime_score),
      overtime_score = VALUES(overtime_score)`;

  const queryParams = [
    match_id,
    team_id,
    match_game_id,
    starting_side,
    score,
    halftime_score,
    overtime_score
  ];

  return runQuery<ResultSetHeader>(query, queryParams, connection);
};

type TeamGameScoreRegulation = {
  score: number;
  halftime_score: number;
  overtime_score: number;
};

/**
 * CS2 MR12–style invariants: first-half round wins split, per-team second-half bounds,
 * and regulation team wins not exceeding the map’s regulation cap.
 */
export const validateCs2TeamGameScorePair = (
  t: TeamGameScoreRegulation,
  ct: TeamGameScoreRegulation,
  regulationRounds: number
): void => {
  if (!Number.isFinite(regulationRounds) || regulationRounds < 2) {
    throw new BadRequestError(
      "regulation_rounds must be at least 2 for team score validation"
    );
  }
  if (regulationRounds % 2 !== 0) {
    throw new BadRequestError("regulation_rounds must be even");
  }
  const halfRounds = regulationRounds / 2;
  if (t.halftime_score + ct.halftime_score !== halfRounds) {
    throw new BadRequestError(
      `first-half team round wins must sum to ${halfRounds} (sum of halftime_score for T and CT)`
    );
  }
  for (const [label, row] of [
    ["T", t],
    ["CT", ct]
  ] as const) {
    if (row.halftime_score < 0 || row.halftime_score > halfRounds) {
      throw new BadRequestError(
        `${label} halftime_score must be between 0 and ${halfRounds}`
      );
    }
    if (row.score < 0 || row.overtime_score < 0) {
      throw new BadRequestError(
        `${label} score and overtime_score must be non-negative`
      );
    }
    const secondHalfWins = row.score - row.overtime_score - row.halftime_score;
    if (secondHalfWins < 0 || secondHalfWins > halfRounds) {
      throw new BadRequestError(
        `${label} invalid regulation second-half wins (${secondHalfWins}): score must equal halftime_score + (0…${halfRounds} regulation second-half) + overtime_score`
      );
    }
  }
  const tRegWins = t.score - t.overtime_score;
  const ctRegWins = ct.score - ct.overtime_score;
  if (tRegWins + ctRegWins > regulationRounds) {
    throw new BadRequestError(
      `regulation team round wins ${tRegWins} + ${ctRegWins} exceed ${regulationRounds} (CS2 cap)`
    );
  }
};

export const listTeamGameScoresByMatchGameId = async (
  matchGameId: number,
  connection?: PoolConnection
) => {
  return runQuery<TeamGameScore[]>(
    `SELECT id, match_id, team_id, match_game_id, starting_side, score, halftime_score, overtime_score
     FROM TeamGameScores WHERE match_game_id = ?`,
    [matchGameId],
    connection
  );
};

export const getTeamIdsForMatch = async (
  matchId: number,
  connection?: PoolConnection
) => {
  return runQuery<{ team_id: number }[]>(
    `SELECT team_id FROM MatchTeams WHERE match_id = ? ORDER BY team_id ASC`,
    [matchId],
    connection
  );
};

type StaffScoreRow = {
  team_id: number;
  starting_side: "T" | "CT";
  score: number;
  halftime_score: number;
  overtime_score: number;
};

/**
 * In one transaction: upsert both TeamGameScores and set `team_game_scores_staff_lock` on the MatchGame.
 * Caller must load `match_id` and confirm the `MatchGame` row exists.
 */
export const saveStaffManualTeamGameScores = async (args: {
  matchId: number;
  matchGameId: number;
  t: StaffScoreRow;
  ct: StaffScoreRow;
}): Promise<void> => {
  const { matchId, matchGameId, t, ct } = args;
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    await upsertTeamGameScore({
      match_id: matchId,
      team_id: t.team_id,
      match_game_id: matchGameId,
      starting_side: "T",
      score: t.score,
      halftime_score: t.halftime_score,
      overtime_score: t.overtime_score,
      connection
    });
    await upsertTeamGameScore({
      match_id: matchId,
      team_id: ct.team_id,
      match_game_id: matchGameId,
      starting_side: "CT",
      score: ct.score,
      halftime_score: ct.halftime_score,
      overtime_score: ct.overtime_score,
      connection
    });

    const lockQuery = `UPDATE MatchGames SET team_game_scores_staff_lock = 1 WHERE id = ? AND match_id = ?`;
    const [lockHeader] = await connection.query<ResultSetHeader>(lockQuery, [
      matchGameId,
      matchId
    ]);
    if (lockHeader.affectedRows < 1) {
      throw new InternalServerError(
        "Failed to set team game scores staff lock"
      );
    }

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};
