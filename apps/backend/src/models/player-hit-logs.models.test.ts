import { savePlayerHitLogsForGame } from "./player-hit-logs.models";
import { runQuery } from "../db/mysqlRunQuery";
import { type HitEvent } from "../types/parse-queue.types";
import { type PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockConnection = {} as PoolConnection;

function createHitEvent(overrides: Partial<HitEvent> = {}): HitEvent {
  return {
    round_number: 3,
    time_in_round: 22.5,
    attacker: 100000001,
    attacker_team: "CT",
    victim: 100000002,
    victim_team: "T",
    weapon: "AK-47",
    hit_group: "head",
    health_damage: 95,
    armor_damage: 50,
    health_remaining: 5,
    is_kill_hit: false, // accepted from parser but not inserted; DB derives from health_remaining = 0
    ...overrides
  };
}

describe("savePlayerHitLogsForGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("always deletes existing rows for the match game first", async () => {
    await savePlayerHitLogsForGame({
      matchGameId: 42,
      events: [],
      connection: mockConnection
    });

    const [deleteQuery, deleteParams] = mockRunQuery.mock.calls[0];
    expect(deleteQuery).toMatch(
      /DELETE FROM PlayerHitLogs WHERE match_game_id/i
    );
    expect(deleteParams).toEqual([42]);
  });

  it("only deletes and does not insert when events array is empty", async () => {
    await savePlayerHitLogsForGame({
      matchGameId: 1,
      events: [],
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it("inserts all events after delete with 12 columns per row", async () => {
    const events = [createHitEvent(), createHitEvent({ round_number: 4 })];

    await savePlayerHitLogsForGame({
      matchGameId: 5,
      events,
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(2);
    const [insertQuery, insertValues] = mockRunQuery.mock.calls[1];
    expect(insertQuery).toMatch(/INSERT INTO PlayerHitLogs/i);
    expect((insertValues as unknown[]).length).toBe(24); // 12 cols × 2 rows
  });

  it("stores attacker and victim steam IDs as strings", async () => {
    await savePlayerHitLogsForGame({
      matchGameId: 1,
      events: [createHitEvent({ attacker: 100000001, victim: 100000002 })],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    // Columns: match_game_id(0), round_number(1), time_in_round(2),
    //          attacker_steam_id(3), attacker_team(4),
    //          victim_steam_id(5), victim_team(6), ...
    expect(flat[3]).toBe("100000001"); // attacker_steam_id
    expect(flat[5]).toBe("100000002"); // victim_steam_id
  });

  it("stores all hit fields in correct column order", async () => {
    await savePlayerHitLogsForGame({
      matchGameId: 1,
      events: [
        createHitEvent({
          weapon: "M4A1",
          hit_group: "chest",
          health_damage: 40,
          armor_damage: 15,
          health_remaining: 60
        })
      ],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const flat = values as unknown[];
    // Columns (0-indexed after match_game_id):
    // 0: match_game_id, 1: round_number, 2: time_in_round,
    // 3: attacker_steam_id, 4: attacker_team,
    // 5: victim_steam_id, 6: victim_team,
    // 7: weapon, 8: hit_group,
    // 9: health_damage, 10: armor_damage, 11: health_remaining
    expect(flat[7]).toBe("M4A1");
    expect(flat[8]).toBe("chest");
    expect(flat[9]).toBe(40);
    expect(flat[10]).toBe(15);
    expect(flat[11]).toBe(60);
  });

  it("produces correct flat array size for multiple events", async () => {
    const events = [
      createHitEvent(),
      createHitEvent({ round_number: 5 }),
      createHitEvent({ round_number: 6 })
    ];

    await savePlayerHitLogsForGame({
      matchGameId: 1,
      events,
      connection: mockConnection
    });

    const [, insertValues] = mockRunQuery.mock.calls[1];
    expect((insertValues as unknown[]).length).toBe(36); // 12 cols × 3 rows
  });
});
