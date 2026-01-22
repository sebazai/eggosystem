import { runQuery } from "../db/mysqlRunQuery";
import type { Reservation } from "@eggosystem/types";
import * as crypto from "crypto";
import { ConflictError, NotFoundError } from "../utils/errors";

interface CreateStreamReservationData {
  match_id: number;
  account_id: number;
  stream_url: string;
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
  // Generate hash (keeping consistency with existing system)
  const hash = crypto
    .createHash("md5")
    .update(data.stream_url + data.match_id)
    .digest("hex");

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

  // Create the reservation
  const insertResult = await runQuery<{ insertId: number }>(
    `INSERT INTO Reservations (match_id, account_id, stream_url, hash) VALUES (?, ?, ?, ?)`,
    [data.match_id, data.account_id, data.stream_url, hash]
  );

  const insertId = insertResult.insertId;

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

  return (result as { affectedRows: number }).affectedRows > 0;
};

export const getStreamReservationsByMatch = async (
  matchId: number
): Promise<Reservation[]> => {
  return await runQuery<Reservation[]>(
    `SELECT * FROM Reservations WHERE match_id = ?`,
    [matchId]
  );
};

export const getReservationByHash = async (
  hash: string
): Promise<Reservation | null> => {
  const [reservation] = await runQuery<Reservation[]>(
    `SELECT * FROM Reservations WHERE hash = ?`,
    [hash]
  );
  return reservation || null;
};

export const deleteReservationByHash = async (
  hash: string
): Promise<boolean> => {
  const result = await runQuery<{ affectedRows: number }>(
    `DELETE FROM Reservations WHERE hash = ?`,
    [hash]
  );
  return result.affectedRows > 0;
};

export const getReservationsWithEmailForMatch = async (
  matchId: number
): Promise<Array<Reservation & { email: string | null }>> => {
  return await runQuery<Array<Reservation & { email: string | null }>>(
    `SELECT r.*, a.work_email 
     FROM Reservations r 
     LEFT JOIN Accounts a ON r.account_id = a.id 
     WHERE r.match_id = ?`,
    [matchId]
  );
};
