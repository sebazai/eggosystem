import { runQuery } from "../../db/mysqlRunQuery";
import { setPlayerKanaElo } from "../player.models";

// Mock the database module
jest.mock("../../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("setPlayerKanaElo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update kana_elo for existing player", async () => {
    // Mock successful update
    mockRunQuery.mockResolvedValueOnce({ affectedRows: 1 });

    const result = await setPlayerKanaElo(
      "76561198123456789",
      250,
      "test-calculus",
      16
    );

    expect(result).toBe(true);
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE SeasonPlayerRanks"),
      ["test-calculus", 250, 16, "76561198123456789"]
    );
  });

  it("should return false when no rows are affected", async () => {
    // Mock no rows affected
    mockRunQuery.mockResolvedValueOnce({ affectedRows: 0 });

    const result = await setPlayerKanaElo(
      "76561198123456789",
      250,
      "test-calculus",
      16
    );

    expect(result).toBe(false);
  });

  it("should handle database errors", async () => {
    // Mock database error
    mockRunQuery.mockRejectedValueOnce(new Error("Database error"));

    await expect(
      setPlayerKanaElo("76561198123456789", 250, "test-calculus", 16)
    ).rejects.toThrow("Database error");
  });
});
