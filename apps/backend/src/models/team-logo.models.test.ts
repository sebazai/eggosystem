import {
  isUserTeamCaptain,
  updateTeamLogoPhash,
  updateTeamName
} from "./team-logo.models";
import { NotFoundError } from "../utils/errors";
import { runQuery } from "../db/mysqlRunQuery";

jest.mock("../db/mysqlRunQuery");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("Team Logo Models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isUserTeamCaptain", () => {
    it("should return true if user is captain", async () => {
      mockRunQuery.mockResolvedValueOnce([{ count: 1 }]);

      const result = await isUserTeamCaptain("76561198000000001", 1);

      expect(result).toBe(true);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT COUNT(*) as count"),
        ["76561198000000001", 1, 1]
      );
    });

    it("should return true if user is co-captain", async () => {
      mockRunQuery.mockResolvedValueOnce([{ count: 1 }]);

      const result = await isUserTeamCaptain("76561198000000001", 1);

      expect(result).toBe(true);
    });

    it("should return false if user is not captain or co-captain", async () => {
      mockRunQuery.mockResolvedValueOnce([{ count: 0 }]);

      const result = await isUserTeamCaptain("76561198000000001", 1);

      expect(result).toBe(false);
    });

    it("should return false if count is undefined", async () => {
      mockRunQuery.mockResolvedValueOnce([{}]);

      const result = await isUserTeamCaptain("76561198000000001", 1);

      expect(result).toBe(false);
    });
  });

  describe("updateTeamLogoPhash", () => {
    it("should update team logo phash successfully", async () => {
      mockRunQuery
        .mockResolvedValueOnce([{ id: 1 }]) // Team exists check
        .mockResolvedValueOnce([]); // Update query

      await updateTeamLogoPhash(1, "abc123def456");

      expect(mockRunQuery).toHaveBeenCalledTimes(2);
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        1,
        "SELECT id FROM Teams WHERE id = ?",
        [1]
      );
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        "UPDATE Teams SET team_logo = ? WHERE id = ?",
        ["abc123def456", 1]
      );
    });

    it("should throw NotFoundError if team does not exist", async () => {
      mockRunQuery.mockResolvedValueOnce([]); // Team not found

      await expect(updateTeamLogoPhash(999, "abc123def456")).rejects.toThrow(
        NotFoundError
      );
      await expect(updateTeamLogoPhash(999, "abc123def456")).rejects.toThrow(
        "Team with ID 999 not found"
      );

      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      expect(mockRunQuery).not.toHaveBeenCalledWith(
        expect.stringContaining("UPDATE"),
        expect.anything()
      );
    });

    it("should handle database errors during update", async () => {
      mockRunQuery
        .mockResolvedValueOnce([{ id: 1 }]) // Team exists check
        .mockRejectedValueOnce(new Error("Database connection failed"));

      await expect(updateTeamLogoPhash(1, "abc123def456")).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle empty phash", async () => {
      mockRunQuery
        .mockResolvedValueOnce([{ id: 1 }]) // Team exists check
        .mockResolvedValueOnce([]); // Update query

      await updateTeamLogoPhash(1, "");

      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        "UPDATE Teams SET team_logo = ? WHERE id = ?",
        ["", 1]
      );
    });
  });

  describe("updateTeamName", () => {
    it("should update team name successfully", async () => {
      mockRunQuery
        .mockResolvedValueOnce([{ id: 1 }]) // Team exists check
        .mockResolvedValueOnce([]); // Update query

      await updateTeamName(1, "New Team Name");

      expect(mockRunQuery).toHaveBeenCalledTimes(2);
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        1,
        "SELECT id FROM Teams WHERE id = ?",
        [1]
      );
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        "UPDATE Teams SET name = ? WHERE id = ?",
        ["New Team Name", 1]
      );
    });

    it("should throw NotFoundError if team does not exist", async () => {
      mockRunQuery.mockResolvedValueOnce([]); // Team not found

      await expect(updateTeamName(999, "New Team Name")).rejects.toThrow(
        NotFoundError
      );
      await expect(updateTeamName(999, "New Team Name")).rejects.toThrow(
        "Team with ID 999 not found"
      );

      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      expect(mockRunQuery).not.toHaveBeenCalledWith(
        expect.stringContaining("UPDATE"),
        expect.anything()
      );
    });

    it("should handle database errors during update", async () => {
      mockRunQuery
        .mockResolvedValueOnce([{ id: 1 }]) // Team exists check
        .mockRejectedValueOnce(new Error("Database connection failed"));

      await expect(updateTeamName(1, "New Team Name")).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle empty team name", async () => {
      mockRunQuery
        .mockResolvedValueOnce([{ id: 1 }]) // Team exists check
        .mockResolvedValueOnce([]); // Update query

      await updateTeamName(1, "");

      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        "UPDATE Teams SET name = ? WHERE id = ?",
        ["", 1]
      );
    });

    it("should handle very long team names", async () => {
      const longName = "A".repeat(255);
      mockRunQuery
        .mockResolvedValueOnce([{ id: 1 }]) // Team exists check
        .mockResolvedValueOnce([]); // Update query

      await updateTeamName(1, longName);

      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        "UPDATE Teams SET name = ? WHERE id = ?",
        [longName, 1]
      );
    });
  });
});
