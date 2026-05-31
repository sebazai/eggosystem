import {
  saveRoundUtilitySummaryForGame,
  getRoundUtilitySummary
} from "./round-utility-summary.models";
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
    smokes_thrown: 1,
    utility_damage: 40,
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
    expect((insertValues as unknown[]).length).toBe(12); // 6 cols × 2 rows
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

  it("stores utility counters in correct column order", async () => {
    await saveRoundUtilitySummaryForGame({
      matchGameId: 1,
      entries: [
        createSummaryEntry({
          flashes_thrown: 3,
          smokes_thrown: 4,
          utility_damage: 88
        })
      ],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    // Columns: match_game_id(0), round_number(1), steam_id(2),
    //          flashes_thrown(3), smokes_thrown(4), utility_damage(5)
    expect(flat[3]).toBe(3); // flashes_thrown
    expect(flat[4]).toBe(4); // smokes_thrown
    expect(flat[5]).toBe(88); // utility_damage
  });
});

describe("getRoundUtilitySummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries by match_game_id and orders by round_number", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getRoundUtilitySummary(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM RoundUtilitySummary/i);
    expect(query).toMatch(/WHERE match_game_id = \?/i);
    expect(query).toMatch(/ORDER BY round_number ASC/i);
    expect(query).toMatch(/steam_id ASC/i);
    expect(params).toEqual([42]);
  });

  it("coerces steam_id to string in returned rows", async () => {
    mockRunQuery.mockResolvedValue([
      {
        round_number: 1,
        steam_id: 100000001,
        flashes_thrown: 2,
        smokes_thrown: 1,
        utility_damage: 40
      }
    ] as never);

    const result = await getRoundUtilitySummary(1);

    expect(result[0].steam_id).toBe("100000001");
    expect(result[0].round_number).toBe(1);
    expect(result[0].flashes_thrown).toBe(2);
    expect(result[0].smokes_thrown).toBe(1);
    expect(result[0].utility_damage).toBe(40);
  });

  it("returns an empty array when no rows exist", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    const result = await getRoundUtilitySummary(999);

    expect(result).toEqual([]);
  });
});
