import {
  saveWastedUtilityEventsForGame,
  getWastedUtilityByPlayer
} from "./wasted-utility-events.models";
import { runQuery } from "../db/mysqlRunQuery";
import { type WastedUtilityEvent } from "../types/parse-queue.types";
import { type PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockConnection = {} as PoolConnection;

function createWastedUtilityEvent(
  overrides: Partial<WastedUtilityEvent> = {}
): WastedUtilityEvent {
  return {
    round_number: 2,
    time_in_round: 18.4,
    thrower: 1001,
    utility_type: "HE",
    ...overrides
  };
}

describe("saveWastedUtilityEventsForGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("always deletes existing rows for the match game first", async () => {
    await saveWastedUtilityEventsForGame({
      matchGameId: 42,
      events: [],
      connection: mockConnection
    });

    const [deleteQuery, deleteParams] = mockRunQuery.mock.calls[0];
    expect(deleteQuery).toMatch(
      /DELETE FROM WastedUtilityEvents WHERE match_game_id/i
    );
    expect(deleteParams).toEqual([42]);
  });

  it("only deletes and does not insert when events array is empty", async () => {
    await saveWastedUtilityEventsForGame({
      matchGameId: 1,
      events: [],
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it("inserts all events after delete", async () => {
    const events = [
      createWastedUtilityEvent({ utility_type: "HE" }),
      createWastedUtilityEvent({ round_number: 5, utility_type: "Molotov" })
    ];

    await saveWastedUtilityEventsForGame({
      matchGameId: 5,
      events,
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(2);
    const [insertQuery, insertValues] = mockRunQuery.mock.calls[1];
    expect(insertQuery).toMatch(/INSERT INTO WastedUtilityEvents/i);
    expect((insertValues as unknown[]).length).toBe(10); // 5 cols × 2 rows
  });

  it("stores thrower steam ID as string", async () => {
    await saveWastedUtilityEventsForGame({
      matchGameId: 1,
      events: [createWastedUtilityEvent({ thrower: 1001 })],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    expect(flat[3]).toBe("1001"); // thrower_steam_id
  });

  it("preserves utility_type string exactly", async () => {
    await saveWastedUtilityEventsForGame({
      matchGameId: 1,
      events: [createWastedUtilityEvent({ utility_type: "Incendiary" })],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    expect(flat[4]).toBe("Incendiary"); // utility_type
  });
});

describe("getWastedUtilityByPlayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries by match_game_id and groups by thrower and utility_type", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getWastedUtilityByPlayer(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM WastedUtilityEvents/i);
    expect(query).toMatch(/WHERE match_game_id = \?/i);
    expect(query).toMatch(/GROUP BY thrower_steam_id, utility_type/i);
    expect(params).toEqual([42]);
  });

  it("coerces thrower_steam_id to string in returned rows", async () => {
    mockRunQuery.mockResolvedValue([
      { thrower_steam_id: 100000001, utility_type: "HE", count: 2 }
    ] as never);

    const result = await getWastedUtilityByPlayer(1);

    expect(result[0].thrower_steam_id).toBe("100000001");
    expect(result[0].utility_type).toBe("HE");
    expect(result[0].count).toBe(2);
  });

  it("returns an empty array when no wasted events exist", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    const result = await getWastedUtilityByPlayer(999);

    expect(result).toEqual([]);
  });
});
