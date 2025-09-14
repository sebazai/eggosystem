import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { extractFaceitRoomId, resolveMatchId } from "./matchUtils";

// Mock the database
jest.mock("../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("matchUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("extractFaceitRoomId", () => {
    it("should extract room ID from full Faceit URL", () => {
      const url =
        "https://www.faceit.com/en/cs2/room/1-ff5e99c3-0765-4173-ba2a-398987b1b3ef";
      const result = extractFaceitRoomId(url);
      expect(result).toBe("1-ff5e99c3-0765-4173-ba2a-398987b1b3ef");
    });

    it("should extract room ID from Faceit URL without protocol", () => {
      const url = "www.faceit.com/en/cs2/room/1-abc123-def456-ghi789-jkl012";
      const result = extractFaceitRoomId(url);
      expect(result).toBe("1-abc123-def456-ghi789-jkl012");
    });

    it("should extract room ID from partial Faceit URL", () => {
      const url = "faceit.com/en/cs2/room/1-test-room-id";
      const result = extractFaceitRoomId(url);
      expect(result).toBe("1-test-room-id");
    });

    it("should return the input if it's already a room ID format", () => {
      const roomId = "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef";
      const result = extractFaceitRoomId(roomId);
      expect(result).toBe("1-ff5e99c3-0765-4173-ba2a-398987b1b3ef");
    });

    it("should return the input if it's a numeric string", () => {
      const numericId = "123";
      const result = extractFaceitRoomId(numericId);
      expect(result).toBe("123");
    });

    it("should handle edge cases gracefully", () => {
      expect(extractFaceitRoomId("")).toBe("");
      expect(extractFaceitRoomId("invalid-url")).toBe("invalid-url");
      expect(extractFaceitRoomId("https://other-site.com/room/123")).toBe(
        "https://other-site.com/room/123"
      );
    });
  });

  describe("resolveMatchId", () => {
    it("should return the match ID when input is a valid numeric ID", async () => {
      // Mock database query to find match by ID
      mockRunQuery.mockResolvedValueOnce([{ id: 123 }]);

      const result = await resolveMatchId("123", 14);

      expect(result).toEqual([123]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT id FROM Matches WHERE id = ? AND season_id = ?",
        [123, 14],
        undefined
      );
    });

    it("should resolve Faceit room ID to match ID", async () => {
      // Mock database query to find match by external_match_room_id
      mockRunQuery.mockResolvedValueOnce([{ id: 456 }]);

      const result = await resolveMatchId(
        "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef",
        14
      );

      expect(result).toEqual([456]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT id FROM Matches WHERE external_match_room_id = ? AND season_id = ?",
        ["1-ff5e99c3-0765-4173-ba2a-398987b1b3ef", 14],
        undefined
      );
    });

    it("should resolve Faceit URL to match ID", async () => {
      // Mock database query to find match by external_match_room_id
      mockRunQuery.mockResolvedValueOnce([{ id: 789 }]);

      const result = await resolveMatchId(
        "https://www.faceit.com/en/cs2/room/1-abc123-def456",
        14
      );

      expect(result).toEqual([789]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT id FROM Matches WHERE external_match_room_id = ? AND season_id = ?",
        ["1-abc123-def456", 14],
        undefined
      );
    });

    it("should throw error when numeric match ID is not found", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      await expect(resolveMatchId("999", 14)).rejects.toThrow(
        "Match with ID 999 not found in season 14"
      );
    });

    it("should throw error when Faceit room ID is not found", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      await expect(resolveMatchId("1-nonexistent-room", 14)).rejects.toThrow(
        "Match with Faceit room ID '1-nonexistent-room' not found in season 14"
      );
    });

    it("should throw error for invalid numeric ID format", async () => {
      await expect(resolveMatchId("abc", 14)).rejects.toThrow(
        "Invalid match ID format: abc"
      );
    });

    it("should handle database connection parameter", async () => {
      const mockConnection = { query: jest.fn() } as unknown as PoolConnection;
      mockRunQuery.mockResolvedValueOnce([{ id: 123 }]);

      const result = await resolveMatchId("123", 14, mockConnection);

      expect(result).toEqual([123]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT id FROM Matches WHERE id = ? AND season_id = ?",
        [123, 14],
        mockConnection
      );
    });
  });
});
