import { savePlayerKillLogsForGame } from "./player-kill-logs.models";
import { runQuery } from "../db/mysqlRunQuery";
import { type KillEvent } from "../types/parse-queue.types";
import { type PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery", () => ({
  runQuery: jest.fn()
}));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockConnection = {} as PoolConnection;

function createKillEvent(overrides: Partial<KillEvent> = {}): KillEvent {
  return {
    round_number: 1,
    time_in_round: 12.5,
    killer: 1001,
    killer_team: "T",
    victim: 1002,
    victim_team: "CT",
    weapon: "ak47",
    is_headshot: false,
    is_penetration: false,
    is_first_kill: false,
    cts_alive_after: 4,
    ts_alive_after: 5,
    bomb_planted: false,
    assister: 0,
    is_flash_assist: false,
    ...overrides
  };
}

describe("savePlayerKillLogsForGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  describe("empty / no-op cases", () => {
    it("deletes existing rows even when killLogs is empty", async () => {
      await savePlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: [],
        connection: mockConnection
      });

      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "DELETE FROM PlayerKillLogs WHERE match_game_id = ?",
        [1],
        mockConnection
      );
    });

    it("deletes existing rows when killLogs is null-ish", async () => {
      await savePlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: null as unknown as KillEvent[],
        connection: mockConnection
      });

      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "DELETE FROM PlayerKillLogs WHERE match_game_id = ?",
        [1],
        mockConnection
      );
    });
  });

  describe("KanaRating 3.2 enrichment fields present", () => {
    it("maps all new fields into the query values", async () => {
      const kill = createKillEvent({
        is_first_death: true,
        is_exit_kill: false,
        is_post_plant: true,
        was_victim_traded: false,
        ct_buy_type: "Full Buy",
        t_buy_type: "Eco",
        setup_flash_thrower: 100000001,
        setup_damage_player: 100000002,
        victim_blind_seconds: 2.84
      });

      await savePlayerKillLogsForGame({
        matchGameId: 42,
        killLogs: [kill],
        connection: mockConnection
      });

      expect(mockRunQuery).toHaveBeenCalledTimes(2);
      const [, flatValues] = mockRunQuery.mock.calls[1];
      const values = flatValues as unknown[];

      expect(values[16]).toBe(true);
      expect(values[17]).toBe(false);
      expect(values[18]).toBe(true);
      expect(values[19]).toBe(false);
      expect(values[20]).toBe("Full Buy");
      expect(values[21]).toBe("Eco");
      expect(values[22]).toBe("100000001");
      expect(values[23]).toBe("100000002");
      expect(values[24]).toBe(2.84);
    });

    it("includes all 25 column placeholders per row", async () => {
      await savePlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: [createKillEvent()],
        connection: mockConnection
      });

      const [query] = mockRunQuery.mock.calls[1];
      const placeholderCount = ((query as string).match(/\?/g) ?? []).length;
      expect(placeholderCount).toBe(25);
    });
  });

  describe("backward compatibility — old parser output (fields absent)", () => {
    it("stores NULL for all 3.2 fields when they are missing", async () => {
      const kill = createKillEvent();

      await savePlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: [kill],
        connection: mockConnection
      });

      const [, flatValues] = mockRunQuery.mock.calls[1];
      const values = flatValues as unknown[];

      expect(values[16]).toBeNull();
      expect(values[17]).toBeNull();
      expect(values[18]).toBeNull();
      expect(values[19]).toBeNull();
      expect(values[20]).toBeNull();
      expect(values[21]).toBeNull();
      expect(values[22]).toBeNull();
      expect(values[23]).toBeNull();
      expect(values[24]).toBeNull();
    });
  });

  describe("setup steam ID zero-to-null conversion", () => {
    it("converts setup_flash_thrower = 0 to NULL", async () => {
      await savePlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: [createKillEvent({ setup_flash_thrower: 0 })],
        connection: mockConnection
      });

      const [, flatValues] = mockRunQuery.mock.calls[1];
      expect((flatValues as unknown[])[22]).toBeNull();
    });

    it("converts setup_damage_player = 0 to NULL", async () => {
      await savePlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: [createKillEvent({ setup_damage_player: 0 })],
        connection: mockConnection
      });

      const [, flatValues] = mockRunQuery.mock.calls[1];
      expect((flatValues as unknown[])[23]).toBeNull();
    });

    it("preserves a real steam ID for setup_flash_thrower", async () => {
      await savePlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: [createKillEvent({ setup_flash_thrower: 100000001 })],
        connection: mockConnection
      });

      const [, flatValues] = mockRunQuery.mock.calls[1];
      expect((flatValues as unknown[])[22]).toBe("100000001");
    });
  });

  describe("multiple kills in one call", () => {
    it("generates one placeholder group per kill", async () => {
      const kills = [createKillEvent(), createKillEvent({ round_number: 2 })];

      await savePlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: kills,
        connection: mockConnection
      });

      const [, flatValues] = mockRunQuery.mock.calls[1];
      expect((flatValues as unknown[]).length).toBe(50);
    });
  });
});
