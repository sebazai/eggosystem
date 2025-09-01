import { runQuery } from "../db/mysqlRunQuery";
import type { Reservation } from "@eggosystem/types";
import * as crypto from "crypto";
import { ConflictError } from "../utils/errors";

interface CreateStreamReservationData {
  match_id: number;
  account_id: number;
  stream_url: string;
}

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

export const getCasterDefaultStreamUrl = async (
  accountId: number
): Promise<string | null> => {
  const result = await runQuery<{ default_stream_url: string }[]>(
    `SELECT default_stream_url FROM AccountCasterUrls WHERE account_id = ?`,
    [accountId]
  );

  return result.length > 0 ? result[0].default_stream_url : null;
};
