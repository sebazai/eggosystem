import {
  calculatePlayerValueData,
  calculateInitialPlayerValues
} from "./fantasy-value.service";
import { runQuery } from "../db/mysqlRunQuery";
import type { PoolConnection } from "mysql2/promise";

// Mock dependencies
jest.mock("../db/mysqlRunQuery");
jest.mock("@eggosystem/types", () => ({
  ...jest.requireActual("@eggosystem/types"),
  calculatePlayerTier: jest.fn(),
  calculateInitialPlayerValue: jest.fn()
}));

import {
  calculatePlayerTier,
  calculateInitialPlayerValue
} from "@eggosystem/types";

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockCalculatePlayerTier = calculatePlayerTier as jest.MockedFunction<
  typeof calculatePlayerTier
>;
const mockCalculateInitialPlayerValue =
  calculateInitialPlayerValue as jest.MockedFunction<
    typeof calculateInitialPlayerValue
  >;

describe("Fantasy Value Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("calculatePlayerValueData", () => {
    it("should call calculateInitialPlayerValue with rating, kd, and kills", () => {
      mockCalculateInitialPlayerValue.mockReturnValue(150);
      mockCalculatePlayerTier.mockReturnValue("gold");

      calculatePlayerValueData(1.05, 1.2, 200);

      expect(mockCalculateInitialPlayerValue).toHaveBeenCalledWith(
        1.05,
        1.2,
        200
      );
    });

    it("should call calculatePlayerTier with the computed value", () => {
      mockCalculateInitialPlayerValue.mockReturnValue(250);
      mockCalculatePlayerTier.mockReturnValue("gold");

      calculatePlayerValueData(1.3, 1.5, 300);

      expect(mockCalculatePlayerTier).toHaveBeenCalledWith(250);
    });

    it("should return value and tier", () => {
      mockCalculateInitialPlayerValue.mockReturnValue(100);
      mockCalculatePlayerTier.mockReturnValue("silver");

      const result = calculatePlayerValueData(0.9, 0.8, 50);

      expect(result).toEqual({ value: 100, tier: "silver" });
    });

    it("should ignore _kanaElo parameter", () => {
      mockCalculateInitialPlayerValue.mockReturnValue(150);
      mockCalculatePlayerTier.mockReturnValue("gold");

      const withElo = calculatePlayerValueData(1.05, 1.2, 200, 1500);
      const withoutElo = calculatePlayerValueData(1.05, 1.2, 200);

      expect(mockCalculateInitialPlayerValue).toHaveBeenCalledTimes(2);
      expect(mockCalculateInitialPlayerValue).toHaveBeenNthCalledWith(
        1,
        1.05,
        1.2,
        200
      );
      expect(mockCalculateInitialPlayerValue).toHaveBeenNthCalledWith(
        2,
        1.05,
        1.2,
        200
      );
      expect(withElo).toEqual(withoutElo);
    });

    it("should ignore _kanaElo when null", () => {
      mockCalculateInitialPlayerValue.mockReturnValue(150);
      mockCalculatePlayerTier.mockReturnValue("gold");

      const result = calculatePlayerValueData(1.05, 1.2, 200, null);

      expect(mockCalculateInitialPlayerValue).toHaveBeenCalledWith(
        1.05,
        1.2,
        200
      );
      expect(result).toEqual({ value: 150, tier: "gold" });
    });
  });

  describe("calculateInitialPlayerValues", () => {
    it("should query with correct parameters", async () => {
      mockRunQuery.mockResolvedValue([]);

      await calculateInitialPlayerValues(5, 2);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.any(String),
        [5, 5, 2],
        undefined
      );
    });

    it("should pass connection when provided", async () => {
      mockRunQuery.mockResolvedValue([]);
      const mockConnection = {} as PoolConnection;

      await calculateInitialPlayerValues(5, 2, mockConnection);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.any(String),
        [5, 5, 2],
        mockConnection
      );
    });

    it("should return empty array when no players found", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await calculateInitialPlayerValues(1, 1);

      expect(result).toEqual([]);
    });

    it("should map player rows to value/tier/stats objects", async () => {
      mockRunQuery.mockResolvedValue([
        {
          steam_id: "76561198000000001",
          kana_rating: 1.1,
          kd: 1.3,
          kills: 150,
          deaths: 115,
          assists: 40,
          adr: 85.5,
          headshot_percentage: 52,
          kast: 72,
          maps_played: 10,
          kana_elo: 1200
        }
      ]);
      mockCalculateInitialPlayerValue.mockReturnValue(180);
      mockCalculatePlayerTier.mockReturnValue("gold");

      const result = await calculateInitialPlayerValues(5, 2);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        steam_id: "76561198000000001",
        value: 180,
        tier: "gold",
        stats: {
          kana_rating: 1.1,
          kd: 1.3,
          kills: 150,
          deaths: 115,
          assists: 40,
          adr: 85.5,
          headshot_percentage: 52,
          kast: 72,
          maps_played: 10,
          kana_elo: 1200
        }
      });
      expect(mockCalculateInitialPlayerValue).toHaveBeenCalledWith(
        1.1,
        1.3,
        150
      );
      expect(mockCalculatePlayerTier).toHaveBeenCalledWith(180);
    });

    it("should handle multiple players", async () => {
      mockRunQuery.mockResolvedValue([
        {
          steam_id: "player1",
          kana_rating: 1.0,
          kd: 1.0,
          kills: 100,
          deaths: 100,
          assists: 30,
          adr: 70,
          headshot_percentage: 45,
          kast: 65,
          maps_played: 5,
          kana_elo: undefined
        },
        {
          steam_id: "player2",
          kana_rating: 1.2,
          kd: 1.4,
          kills: 200,
          deaths: 142,
          assists: 60,
          adr: 90,
          headshot_percentage: 55,
          kast: 78,
          maps_played: 12,
          kana_elo: 1400
        }
      ]);
      mockCalculateInitialPlayerValue
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(220);
      mockCalculatePlayerTier
        .mockReturnValueOnce("silver")
        .mockReturnValueOnce("gold");

      const result = await calculateInitialPlayerValues(3, 1);

      expect(result).toHaveLength(2);
      expect(result[0]!.steam_id).toBe("player1");
      expect(result[0]!.value).toBe(100);
      expect(result[0]!.tier).toBe("silver");
      expect(result[0]!.stats.kana_elo).toBeUndefined();

      expect(result[1]!.steam_id).toBe("player2");
      expect(result[1]!.value).toBe(220);
      expect(result[1]!.tier).toBe("gold");
      expect(result[1]!.stats.kana_elo).toBe(1400);
    });

    it("should pass kana_elo through to stats even when undefined", async () => {
      mockRunQuery.mockResolvedValue([
        {
          steam_id: "player1",
          kana_rating: 1.0,
          kd: 1.0,
          kills: 100,
          deaths: 100,
          assists: 30,
          adr: 70,
          headshot_percentage: 45,
          kast: 65,
          maps_played: 5,
          kana_elo: undefined
        }
      ]);
      mockCalculateInitialPlayerValue.mockReturnValue(100);
      mockCalculatePlayerTier.mockReturnValue("silver");

      const result = await calculateInitialPlayerValues(1, 1);

      expect(result[0]!.stats.kana_elo).toBeUndefined();
    });
  });
});
