import { saveSetupEventsForGame } from "./setup-events.models";
import { runQuery } from "../db/mysqlRunQuery";
import { type SetupEvent } from "../types/parse-queue.types";
import { type PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockConnection = {} as PoolConnection;

function createSetupEvent(overrides: Partial<SetupEvent> = {}): SetupEvent {
  return {
    round_number: 3,
    time_in_round: 22.1,
    setup_type: "flash",
    setup_player: 1001,
    beneficiary: 1002,
    victim: 1003,
    seconds_after_setup: 1.5,
    flash_duration: 2.3,
    ...overrides
  };
}

describe("saveSetupEventsForGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("always deletes existing rows for the match game first", async () => {
    await saveSetupEventsForGame({
      matchGameId: 42,
      events: [],
      connection: mockConnection
    });

    const [deleteQuery, deleteParams] = mockRunQuery.mock.calls[0];
    expect(deleteQuery).toMatch(/DELETE FROM SetupEvents WHERE match_game_id/i);
    expect(deleteParams).toEqual([42]);
  });

  it("only deletes and does not insert when events array is empty", async () => {
    await saveSetupEventsForGame({
      matchGameId: 1,
      events: [],
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it("inserts all events after delete", async () => {
    const events = [
      createSetupEvent({ setup_type: "flash" }),
      createSetupEvent({
        round_number: 7,
        setup_type: "utility_damage",
        damage_dealt: 55,
        flash_duration: undefined
      })
    ];

    await saveSetupEventsForGame({
      matchGameId: 5,
      events,
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(2);
    const [insertQuery, insertValues] = mockRunQuery.mock.calls[1];
    expect(insertQuery).toMatch(/INSERT INTO SetupEvents/i);
    expect((insertValues as unknown[]).length).toBe(20); // 10 cols × 2 rows
  });

  it("stores steam IDs as strings", async () => {
    await saveSetupEventsForGame({
      matchGameId: 1,
      events: [
        createSetupEvent({
          setup_player: 1001,
          beneficiary: 1002,
          victim: 1003
        })
      ],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    expect(flat[4]).toBe("1001"); // setup_player_steam_id
    expect(flat[5]).toBe("1002"); // beneficiary_steam_id
    expect(flat[6]).toBe("1003"); // victim_steam_id
  });

  it("stores null for flash_duration when setup_type is utility_damage", async () => {
    await saveSetupEventsForGame({
      matchGameId: 1,
      events: [
        createSetupEvent({
          setup_type: "utility_damage",
          flash_duration: undefined,
          damage_dealt: 40
        })
      ],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    expect(flat[8]).toBeNull(); // flash_duration
    expect(flat[9]).toBe(40); // damage_dealt
  });

  it("stores null for damage_dealt when setup_type is flash", async () => {
    await saveSetupEventsForGame({
      matchGameId: 1,
      events: [
        createSetupEvent({
          setup_type: "flash",
          flash_duration: 2.3,
          damage_dealt: undefined
        })
      ],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    expect(flat[8]).toBe(2.3); // flash_duration
    expect(flat[9]).toBeNull(); // damage_dealt
  });
});
