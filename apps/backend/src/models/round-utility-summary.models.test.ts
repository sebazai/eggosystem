import { saveRoundUtilitySummaryForGame } from "./round-utility-summary.models";
import { runQuery } from "../db/mysqlRunQuery";
import { type RoundUtilitySummaryEntry } from "../types/parse-queue.types";
import { type PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockConnection = {} as PoolConnection;

function createSummaryEntry(
  overrides: Partial<RoundUtilitySummaryEntry> = {}
): RoundUtilitySummaryEntry {
  return {
    round_number: 1,
    steam_id: 1001,
    flashes_thrown: 2,
    enemies_flashed: 1,
    teammates_flashed: 0,
    smokes_thrown: 1,
    utility_damage: 40,
    wasted_utility: 0,
    ...overrides
  };
}

describe("saveRoundUtilitySummaryForGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("always deletes existing rows for the match game first", async () => {
    await saveRoundUtilitySummaryForGame({
      matchGameId: 42,
      entries: [],
      connection: mockConnection
    });

    const [deleteQuery, deleteParams] = mockRunQuery.mock.calls[0];
    expect(deleteQuery).toMatch(
      /DELETE FROM RoundUtilitySummary WHERE match_game_id/i
    );
    expect(deleteParams).toEqual([42]);
  });

  it("only deletes and does not insert when entries array is empty", async () => {
    await saveRoundUtilitySummaryForGame({
      matchGameId: 1,
      entries: [],
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it("inserts all entries after delete", async () => {
    const entries = [
      createSummaryEntry({ round_number: 1, steam_id: 1001 }),
      createSummaryEntry({
        round_number: 1,
        steam_id: 1002,
        utility_damage: 75
      })
    ];

    await saveRoundUtilitySummaryForGame({
      matchGameId: 5,
      entries,
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(2);
    const [insertQuery, insertValues] = mockRunQuery.mock.calls[1];
    expect(insertQuery).toMatch(/INSERT INTO RoundUtilitySummary/i);
    expect((insertValues as unknown[]).length).toBe(18); // 9 cols × 2 rows
  });

  it("stores steam_id as string", async () => {
    await saveRoundUtilitySummaryForGame({
      matchGameId: 1,
      entries: [createSummaryEntry({ steam_id: 1001 })],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    expect(flat[2]).toBe("1001"); // steam_id (col index 2 = after match_game_id, round_number)
  });

  it("stores all utility counters in correct column order", async () => {
    await saveRoundUtilitySummaryForGame({
      matchGameId: 1,
      entries: [
        createSummaryEntry({
          flashes_thrown: 3,
          enemies_flashed: 2,
          teammates_flashed: 1,
          smokes_thrown: 4,
          utility_damage: 88,
          wasted_utility: 1
        })
      ],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    // Columns: match_game_id(0), round_number(1), steam_id(2),
    //          flashes_thrown(3), enemies_flashed(4), teammates_flashed(5),
    //          smokes_thrown(6), utility_damage(7), wasted_utility(8)
    expect(flat[3]).toBe(3); // flashes_thrown
    expect(flat[4]).toBe(2); // enemies_flashed
    expect(flat[5]).toBe(1); // teammates_flashed
    expect(flat[6]).toBe(4); // smokes_thrown
    expect(flat[7]).toBe(88); // utility_damage
    expect(flat[8]).toBe(1); // wasted_utility
  });
});
