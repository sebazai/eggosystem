import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import type { Account, Reservation } from "@eggosystem/types";
import * as crypto from "crypto";
import { ConflictError, NotFoundError } from "../utils/errors";

interface CreateStreamReservationData {
  match_id: number;
  account_id: number;
  stream_url: string;
}

const createRemovalToken = (): string => crypto.randomBytes(32).toString("hex");

function isDuplicateEntryError(error: unknown): error is { code: string } {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const code = Reflect.get(error, "code");
  return typeof code === "string";
}

export const updateStreamReservation = async (
  matchId: number,
  accountId: number,
  streamUrl: string
): Promise<Reservation> => {
  const updateResult = await runQuery<{ affectedRows: number }>(
    `UPDATE Reservations SET stream_url = ? WHERE match_id = ? AND account_id = ?`,
    [streamUrl, matchId, accountId]
  );
  if (updateResult.affectedRows === 0) {
    throw new NotFoundError("Stream reservation not found");
  }
  const [updatedReservation] = await runQuery<Reservation[]>(
    `SELECT * FROM Reservations WHERE match_id = ? AND account_id = ?`,
    [matchId, accountId]
  );
  return updatedReservation;
};

export const createStreamReservation = async (
  data: CreateStreamReservationData
): Promise<Reservation> => {
  // Check if this match already has a stream reservation from this caster
  const existingReservation = await runQuery<Reservation[]>(
    `SELECT * FROM Reservations WHERE match_id = ? AND account_id = ?`,
    [data.match_id, data.account_id]
  );

  if (existingReservation.length > 0) {
    throw new ConflictError(
      "You have already reserved this match for streaming"
    );
  }

  // Create the reservation (with retries in the extremely unlikely event of token collision)
  let insertId: number | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const removalToken = createRemovalToken();
    try {
      const insertResult = await runQuery<{ insertId: number }>(
        `INSERT INTO Reservations (match_id, account_id, stream_url, hash) VALUES (?, ?, ?, ?)`,
        [data.match_id, data.account_id, data.stream_url, removalToken]
      );
      insertId = insertResult.insertId;
      break;
    } catch (error) {
      if (isDuplicateEntryError(error) && error.code === "ER_DUP_ENTRY") {
        continue;
      }
      throw error;
    }
  }

  if (insertId == null) {
    throw new ConflictError("Failed to generate a unique reservation token");
  }

  // Return the created reservation
  const [newReservation] = await runQuery<Reservation[]>(
    `SELECT * FROM Reservations WHERE id = ?`,
    [insertId]
  );

  return newReservation;
};

export const deleteStreamReservation = async (
  matchId: number,
  accountId: number
): Promise<boolean> => {
  const result = await runQuery<{ affectedRows: number }>(
    `DELETE FROM Reservations WHERE match_id = ? AND account_id = ?`,
    [matchId, accountId]
  );

  return result.affectedRows > 0;
};

export const getStreamReservationsByMatch = async (
  matchId: number
): Promise<Reservation[]> => {
  return await runQuery<Reservation[]>(
    `SELECT * FROM Reservations WHERE match_id = ?`,
    [matchId]
  );
};

/**
 * Removes a reservation by public removal token and returns season_id for the calendar link.
 * Runs in a single transaction to avoid lock wait timeouts.
 */
export const removeReservationByRemovalTokenWithSeasonId = async (
  token: string
): Promise<{ deleted: boolean; season_id: number | null }> => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const [reservation] = await runQuery<Reservation[]>(
      `SELECT * FROM Reservations WHERE hash = ?`,
      [token],
      connection
    );
    if (!reservation) {
      await connection.rollback();
      return { deleted: false, season_id: null };
    }
    const [matchRow] = await runQuery<Array<{ season_id: number }>>(
      `SELECT season_id FROM Matches WHERE id = ?`,
      [reservation.match_id],
      connection
    );
    const season_id = matchRow?.season_id ?? null;
    const deleteResult = await runQuery<{ affectedRows: number }>(
      `DELETE FROM Reservations WHERE hash = ?`,
      [token],
      connection
    );
    const deleted = deleteResult.affectedRows > 0;
    await connection.commit();
    return { deleted, season_id };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getReservationsWithEmailForMatch = async (matchId: number) => {
  return await runQuery<Array<Reservation & Pick<Account, "work_email">>>(
    `SELECT r.*, a.work_email 
     FROM Reservations r 
     LEFT JOIN Accounts a ON r.account_id = a.id 
     WHERE r.match_id = ?`,
    [matchId]
  );
};
