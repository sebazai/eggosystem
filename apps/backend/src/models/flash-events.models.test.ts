import { saveFlashEventsForGame } from "./flash-events.models";
import { runQuery } from "../db/mysqlRunQuery";
import { type FlashEvent } from "../types/parse-queue.types";
import { type PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockConnection = {} as PoolConnection;

function createFlashEvent(overrides: Partial<FlashEvent> = {}): FlashEvent {
  return {
    round_number: 1,
    time_in_round: 12.5,
    thrower: 100000001,
    thrower_team: "T",
    victim: 100000002,
    victim_team: "CT",
    duration_seconds: 2.5,
    is_enemy_flash: true,
    is_teammate_flash: false,
    is_self_flash: false,
    ...overrides
  };
}

describe("saveFlashEventsForGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("always deletes existing rows for the match game first", async () => {
    await saveFlashEventsForGame({
      matchGameId: 42,
      events: [],
      connection: mockConnection
    });

    const [deleteQuery] = mockRunQuery.mock.calls[0];
    expect(deleteQuery).toMatch(/DELETE FROM FlashEvents WHERE match_game_id/i);
    const [, deleteParams] = mockRunQuery.mock.calls[0];
    expect(deleteParams).toEqual([42]);
  });

  it("only deletes and does not insert when events array is empty", async () => {
    await saveFlashEventsForGame({
      matchGameId: 1,
      events: [],
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(1); // only delete
  });

  it("inserts all events after delete", async () => {
    const events = [
      createFlashEvent({ is_enemy_flash: true }),
      createFlashEvent({
        round_number: 2,
        is_teammate_flash: true,
        is_enemy_flash: false
      })
    ];

    await saveFlashEventsForGame({
      matchGameId: 5,
      events,
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(2); // delete + insert
    const [insertQuery, insertValues] = mockRunQuery.mock.calls[1];
    expect(insertQuery).toMatch(/INSERT INTO FlashEvents/i);
    expect((insertValues as unknown[]).length).toBe(22); // 11 cols × 2 rows
  });

  it("stores steam IDs as strings", async () => {
    await saveFlashEventsForGame({
      matchGameId: 1,
      events: [createFlashEvent({ thrower: 100000001, victim: 100000002 })],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    expect(flat[3]).toBe("100000001"); // thrower_steam_id
    expect(flat[5]).toBe("100000002"); // victim_steam_id
  });

  it("correctly maps boolean flash type flags to 0/1", async () => {
    await saveFlashEventsForGame({
      matchGameId: 1,
      events: [
        createFlashEvent({
          is_enemy_flash: true,
          is_teammate_flash: false,
          is_self_flash: false
        })
      ],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    expect(flat[8]).toBe(1); // is_enemy_flash
    expect(flat[9]).toBe(0); // is_teammate_flash
    expect(flat[10]).toBe(0); // is_self_flash
  });
});
