import {
  createStreamReservation,
  deleteStreamReservation,
  getStreamReservationsByMatch
} from "./match-streams.models";
import { runQuery } from "../db/mysqlRunQuery";
import { ConflictError } from "../utils/errors";
import type { Reservation } from "@eggosystem/types";

jest.mock("../db/mysqlRunQuery");
jest.mock("crypto", () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => "test-hash")
  }))
}));

const mockRunQuery = runQuery as jest.Mock;

const mockReservation: Reservation = {
  id: 1,
  stream_url: "https://twitch.tv/testcaster",
  hash: "test-hash",
  match_id: 123,
  account_id: 1
};

describe("match-streams models", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createStreamReservation", () => {
    const reservationData = {
      match_id: 123,
      account_id: 1,
      stream_url: "https://twitch.tv/testcaster"
    };

    it("should successfully create a stream reservation", async () => {
      // Mock no existing reservation
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock insert result
      mockRunQuery.mockResolvedValueOnce({ insertId: 1 });
      // Mock select result
      mockRunQuery.mockResolvedValueOnce([mockReservation]);

      const result = await createStreamReservation(reservationData);

      expect(mockRunQuery).toHaveBeenCalledTimes(3);
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        1,
        "SELECT * FROM Reservations WHERE match_id = ? AND account_id = ?",
        [123, 1]
      );
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        "INSERT INTO Reservations (match_id, account_id, stream_url, hash) VALUES (?, ?, ?, ?)",
        [123, 1, "https://twitch.tv/testcaster", "test-hash"]
      );
      expect(result).toEqual(mockReservation);
    });

    it("should throw ConflictError if reservation already exists", async () => {
      // Mock existing reservation
      mockRunQuery.mockResolvedValueOnce([mockReservation]);

      await expect(createStreamReservation(reservationData)).rejects.toThrow(
        ConflictError
      );

      expect(mockRunQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteStreamReservation", () => {
    it("should successfully delete a stream reservation", async () => {
      mockRunQuery.mockResolvedValueOnce({ affectedRows: 1 });

      const result = await deleteStreamReservation(123, 1);

      expect(result).toBe(true);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "DELETE FROM Reservations WHERE match_id = ? AND account_id = ?",
        [123, 1]
      );
    });

    it("should return false if no reservation found", async () => {
      mockRunQuery.mockResolvedValueOnce({ affectedRows: 0 });

      const result = await deleteStreamReservation(123, 1);

      expect(result).toBe(false);
    });
  });

  describe("getStreamReservationsByMatch", () => {
    it("should return reservations for a match", async () => {
      mockRunQuery.mockResolvedValueOnce([mockReservation]);

      const result = await getStreamReservationsByMatch(123);

      expect(result).toEqual([mockReservation]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM Reservations WHERE match_id = ?",
        [123]
      );
    });

    it("should return empty array if no reservations found", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getStreamReservationsByMatch(123);

      expect(result).toEqual([]);
    });
  });
});
