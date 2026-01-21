/* eslint-disable @typescript-eslint/no-explicit-any */
import { manualValidityCheck } from "../../models/dashboard/registration.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";

// Mock dependencies
jest.mock("../../db/mysqlRunQuery");
jest.mock("../../db/mysqlConnection");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;

describe("manual validity override", () => {
  const mockConnection = {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    execute: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConnection.mockResolvedValue(mockConnection as any);
    // Reset all mock functions
    mockConnection.beginTransaction.mockResolvedValue(undefined);
    mockConnection.commit.mockResolvedValue(undefined);
    mockConnection.rollback.mockResolvedValue(undefined);
    mockConnection.release.mockResolvedValue(undefined);
  });

  describe("manualValidityCheck", () => {
    it("should set manual validity override for multiple teams", async () => {
      const seasonId = 1;
      const teamIds = [123, 456, 789];
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 3 });

      const result = await manualValidityCheck(
        seasonId,
        teamIds,
        checkedByAccountId
      );

      expect(result).toEqual({
        success: true,
        updatedCount: 3
      });

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE SeasonTeamRegistrations"),
        [checkedByAccountId, seasonId, ...teamIds],
        mockConnection
      );
    });

    it("should handle partial updates", async () => {
      const seasonId = 1;
      const teamIds = [123, 456, 789];
      const checkedByAccountId = 42;

      // Only 2 teams were updated (one doesn't exist)
      mockRunQuery.mockResolvedValue({ affectedRows: 2 });

      const result = await manualValidityCheck(
        seasonId,
        teamIds,
        checkedByAccountId
      );

      expect(result).toEqual({
        success: true,
        updatedCount: 2
      });
    });

    it("should handle no teams updated", async () => {
      const seasonId = 1;
      const teamIds = [999, 888]; // Non-existent teams
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 0 });

      const result = await manualValidityCheck(
        seasonId,
        teamIds,
        checkedByAccountId
      );

      expect(result).toEqual({
        success: true,
        updatedCount: 0
      });
    });

    it("should handle database errors", async () => {
      const seasonId = 1;
      const teamIds = [123, 456];
      const checkedByAccountId = 42;

      const dbError = new Error("Database connection failed");
      mockRunQuery.mockRejectedValue(dbError);

      await expect(
        manualValidityCheck(seasonId, teamIds, checkedByAccountId)
      ).rejects.toThrow("Database connection failed");

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it("should handle connection errors", async () => {
      const seasonId = 1;
      const teamIds = [123, 456];
      const checkedByAccountId = 42;

      const connectionError = new Error("Connection failed");
      mockGetConnection.mockRejectedValue(connectionError);

      await expect(
        manualValidityCheck(seasonId, teamIds, checkedByAccountId)
      ).rejects.toThrow("Connection failed");
    });

    it("should handle empty team IDs array", async () => {
      const seasonId = 1;
      const teamIds: number[] = [];
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 0 });

      const result = await manualValidityCheck(
        seasonId,
        teamIds,
        checkedByAccountId
      );

      expect(result).toEqual({
        success: true,
        updatedCount: 0
      });

      // Should still execute the query with empty array
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE SeasonTeamRegistrations"),
        [checkedByAccountId, seasonId],
        mockConnection
      );
    });

    it("should handle transaction rollback on error", async () => {
      const seasonId = 1;
      const teamIds = [123, 456];
      const checkedByAccountId = 42;

      // Simulate error during query execution
      mockRunQuery.mockRejectedValue(new Error("Query failed"));

      await expect(
        manualValidityCheck(seasonId, teamIds, checkedByAccountId)
      ).rejects.toThrow("Query failed");

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it("should handle large number of teams", async () => {
      const seasonId = 1;
      const teamIds = Array.from({ length: 100 }, (_, i) => i + 1); // 100 teams
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 100 });

      const result = await manualValidityCheck(
        seasonId,
        teamIds,
        checkedByAccountId
      );

      expect(result).toEqual({
        success: true,
        updatedCount: 100
      });

      // Should handle large parameter arrays
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE SeasonTeamRegistrations"),
        [checkedByAccountId, seasonId, ...teamIds],
        mockConnection
      );
    });
  });

  describe("database query validation", () => {
    it("should use correct SQL query structure", async () => {
      const seasonId = 1;
      const teamIds = [123, 456];
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 2 });

      await manualValidityCheck(seasonId, teamIds, checkedByAccountId);

      const callArgs = mockRunQuery.mock.calls[0];
      const query = callArgs[0] as string;
      const params = callArgs[1] as any[];

      // Should contain the correct table and columns
      expect(query).toContain("UPDATE SeasonTeamRegistrations");
      expect(query).toContain("SET manual_validity_check_override = true");
      expect(query).toContain("manual_validity_check_by = ?");
      expect(query).toContain("WHERE season_id = ?");
      expect(query).toContain("team_id IN");

      // Should have correct parameter order
      expect(params[0]).toBe(checkedByAccountId);
      expect(params[1]).toBe(seasonId);
      expect(params.slice(2)).toEqual(teamIds);
    });

    it("should handle single team ID", async () => {
      const seasonId = 1;
      const teamIds = [123];
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 1 });

      await manualValidityCheck(seasonId, teamIds, checkedByAccountId);

      const callArgs = mockRunQuery.mock.calls[0];
      const query = callArgs[0] as string;

      // Should generate correct IN clause for single item
      expect(query).toContain("team_id IN (?)");
    });

    it("should handle multiple team IDs", async () => {
      const seasonId = 1;
      const teamIds = [123, 456, 789];
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 3 });

      await manualValidityCheck(seasonId, teamIds, checkedByAccountId);

      const callArgs = mockRunQuery.mock.calls[0];
      const query = callArgs[0] as string;

      // Should generate correct IN clause for multiple items
      expect(query).toContain("team_id IN (?,?,?)");
    });
  });

  describe("error scenarios", () => {
    it("should handle invalid season ID", async () => {
      const seasonId = -1; // Invalid season ID
      const teamIds = [123, 456];
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 0 });

      const result = await manualValidityCheck(
        seasonId,
        teamIds,
        checkedByAccountId
      );

      expect(result).toEqual({
        success: true,
        updatedCount: 0
      });
    });

    it("should handle invalid team IDs", async () => {
      const seasonId = 1;
      const teamIds = [-1, 0, 999999]; // Invalid team IDs
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 0 });

      const result = await manualValidityCheck(
        seasonId,
        teamIds,
        checkedByAccountId
      );

      expect(result).toEqual({
        success: true,
        updatedCount: 0
      });
    });

    it("should handle invalid account ID", async () => {
      const seasonId = 1;
      const teamIds = [123, 456];
      const checkedByAccountId = -1; // Invalid account ID

      mockRunQuery.mockResolvedValue({ affectedRows: 2 });

      const result = await manualValidityCheck(
        seasonId,
        teamIds,
        checkedByAccountId
      );

      expect(result).toEqual({
        success: true,
        updatedCount: 2
      });
    });

    it("should handle database constraint violations", async () => {
      const seasonId = 1;
      const teamIds = [123, 456];
      const checkedByAccountId = 42;

      const constraintError = new Error("Foreign key constraint failed");
      mockRunQuery.mockRejectedValue(constraintError);

      await expect(
        manualValidityCheck(seasonId, teamIds, checkedByAccountId)
      ).rejects.toThrow("Foreign key constraint failed");
    });

    it("should handle connection timeout", async () => {
      const seasonId = 1;
      const teamIds = [123, 456];
      const checkedByAccountId = 42;

      const timeoutError = new Error("Connection timeout");
      mockGetConnection.mockRejectedValue(timeoutError);

      await expect(
        manualValidityCheck(seasonId, teamIds, checkedByAccountId)
      ).rejects.toThrow("Connection timeout");
    });
  });

  describe("transaction handling", () => {
    it("should commit transaction on success", async () => {
      const seasonId = 1;
      const teamIds = [123, 456];
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 2 });

      await manualValidityCheck(seasonId, teamIds, checkedByAccountId);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.rollback).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should rollback transaction on error", async () => {
      const seasonId = 1;
      const teamIds = [123, 456];
      const checkedByAccountId = 42;

      mockRunQuery.mockRejectedValue(new Error("Database error"));

      await expect(
        manualValidityCheck(seasonId, teamIds, checkedByAccountId)
      ).rejects.toThrow("Database error");

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should handle transaction begin failure", async () => {
      const seasonId = 1;
      const teamIds = [123, 456];
      const checkedByAccountId = 42;

      mockConnection.beginTransaction.mockRejectedValue(
        new Error("Transaction begin failed")
      );

      await expect(
        manualValidityCheck(seasonId, teamIds, checkedByAccountId)
      ).rejects.toThrow("Transaction begin failed");

      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
      // Rollback might be called during cleanup, so we don't assert it
    });

    it("should handle commit failure", async () => {
      const seasonId = 1;
      const teamIds = [123, 456];
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 2 });
      mockConnection.commit.mockRejectedValue(new Error("Commit failed"));

      await expect(
        manualValidityCheck(seasonId, teamIds, checkedByAccountId)
      ).rejects.toThrow("Commit failed");

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe("performance considerations", () => {
    it("should handle large batch updates efficiently", async () => {
      const seasonId = 1;
      const teamIds = Array.from({ length: 1000 }, (_, i) => i + 1); // 1000 teams
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 1000 });

      const startTime = Date.now();
      const result = await manualValidityCheck(
        seasonId,
        teamIds,
        checkedByAccountId
      );
      const endTime = Date.now();

      expect(result).toEqual({
        success: true,
        updatedCount: 1000
      });

      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it("should not block on large parameter arrays", async () => {
      const seasonId = 1;
      const teamIds = Array.from({ length: 5000 }, (_, i) => i + 1); // 5000 teams
      const checkedByAccountId = 42;

      mockRunQuery.mockResolvedValue({ affectedRows: 5000 });

      const result = await manualValidityCheck(
        seasonId,
        teamIds,
        checkedByAccountId
      );

      expect(result).toEqual({
        success: true,
        updatedCount: 5000
      });

      // Should handle large parameter arrays without issues
      const callArgs = mockRunQuery.mock.calls[0];
      const params = callArgs[1] as any[];
      expect(params.length).toBe(5002); // checkedByAccountId + seasonId + 5000 teamIds
    });
  });
});
