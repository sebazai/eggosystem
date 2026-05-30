import { saveWastedUtilityEventsForGame } from "./wasted-utility-events.models";
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
