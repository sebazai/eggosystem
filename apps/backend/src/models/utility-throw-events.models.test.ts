import {
  saveUtilityThrowEventsForGame,
  getUtilityThrowsByPlayer
} from "./utility-throw-events.models";
import { runQuery } from "../db/mysqlRunQuery";
import { type UtilityThrowEvent } from "../types/parse-queue.types";
import { type PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockConnection = {} as PoolConnection;

function createUtilityThrowEvent(
  overrides: Partial<UtilityThrowEvent> = {}
): UtilityThrowEvent {
  return {
    round_number: 1,
    time_in_round: 46.34,
    thrower: 1001,
    thrower_team: "CT",
    utility_type: "he",
    ...overrides
  };
}

describe("saveUtilityThrowEventsForGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("always deletes existing rows for the match game first", async () => {
    await saveUtilityThrowEventsForGame({
      matchGameId: 42,
      events: [],
      connection: mockConnection
    });

    const [deleteQuery, deleteParams] = mockRunQuery.mock.calls[0];
    expect(deleteQuery).toMatch(
      /DELETE FROM UtilityThrowEvents WHERE match_game_id/i
    );
    expect(deleteParams).toEqual([42]);
  });

  it("only deletes and does not insert when events array is empty", async () => {
    await saveUtilityThrowEventsForGame({
      matchGameId: 1,
      events: [],
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it("inserts all events after delete", async () => {
    const events = [
      createUtilityThrowEvent({ utility_type: "he" }),
      createUtilityThrowEvent({ round_number: 2, utility_type: "molotov" })
    ];

    await saveUtilityThrowEventsForGame({
      matchGameId: 5,
      events,
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(2);
    const [insertQuery, insertValues] = mockRunQuery.mock.calls[1];
    expect(insertQuery).toMatch(/INSERT INTO UtilityThrowEvents/i);
    expect((insertValues as unknown[]).length).toBe(12); // 6 cols × 2 rows
  });

  it("stores thrower steam ID as string and preserves utility_type", async () => {
    await saveUtilityThrowEventsForGame({
      matchGameId: 1,
      events: [
        createUtilityThrowEvent({
          thrower: 1001,
          thrower_team: "T",
          utility_type: "smoke"
        })
      ],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    expect(flat[3]).toBe("1001");
    expect(flat[4]).toBe("T");
    expect(flat[5]).toBe("smoke");
  });
});

describe("getUtilityThrowsByPlayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries by match_game_id and thrower_steam_id", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getUtilityThrowsByPlayer(42, "1001");

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM UtilityThrowEvents/i);
    expect(query).toMatch(
      /WHERE match_game_id = \? AND thrower_steam_id = \?/i
    );
    expect(params).toEqual([42, "1001"]);
  });

  it("coerces numeric fields in returned rows", async () => {
    mockRunQuery.mockResolvedValue([
      { round_number: 1, time_in_round: "46.340", utility_type: "he" }
    ] as never);

    const result = await getUtilityThrowsByPlayer(1, "1001");

    expect(result[0]).toEqual({
      round_number: 1,
      time_in_round: 46.34,
      utility_type: "he"
    });
  });
});
