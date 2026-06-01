import { type PoolConnection } from "mysql2/promise";
import { replaceMatchGameRows } from "./replaceMatchGameRows";
import { runQuery } from "./mysqlRunQuery";

jest.mock("./mysqlRunQuery", () => ({
  runQuery: jest.fn()
}));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockConnection = {} as PoolConnection;

describe("replaceMatchGameRows", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("deletes then inserts within the same connection", async () => {
    await replaceMatchGameRows(mockConnection, 42, "PlayerStats", async () => {
      await runQuery("INSERT INTO PlayerStats VALUES (?)", [1], mockConnection);
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(2);
    expect(mockRunQuery.mock.calls[0]).toEqual([
      "DELETE FROM PlayerStats WHERE match_game_id = ?",
      [42],
      mockConnection
    ]);
    expect(mockRunQuery.mock.calls[1]).toEqual([
      "INSERT INTO PlayerStats VALUES (?)",
      [1],
      mockConnection
    ]);
  });

  it("skips insert when callback returns early but still deletes", async () => {
    await replaceMatchGameRows(
      mockConnection,
      7,
      "PlayerTrades",
      async () => {}
    );

    expect(mockRunQuery).toHaveBeenCalledTimes(1);
    expect(mockRunQuery.mock.calls[0][0]).toBe(
      "DELETE FROM PlayerTrades WHERE match_game_id = ?"
    );
  });

  it("propagates insert errors after delete (caller must rollback)", async () => {
    mockRunQuery
      .mockResolvedValueOnce([] as never)
      .mockRejectedValueOnce(new Error("insert failed"));

    await expect(
      replaceMatchGameRows(mockConnection, 99, "PlayerKillLogs", async () => {
        await runQuery(
          "INSERT INTO PlayerKillLogs VALUES (?)",
          [1],
          mockConnection
        );
      })
    ).rejects.toThrow("insert failed");

    expect(mockRunQuery).toHaveBeenCalledTimes(2);
  });
});
