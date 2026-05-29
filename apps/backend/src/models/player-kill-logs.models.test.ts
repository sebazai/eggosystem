import { upsertPlayerKillLogsForGame } from "./player-kill-logs.models";
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

describe("upsertPlayerKillLogsForGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  describe("empty / no-op cases", () => {
    it("does nothing when killLogs is empty", async () => {
      await upsertPlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: [],
        connection: mockConnection
      });
      expect(mockRunQuery).not.toHaveBeenCalled();
    });

    it("does nothing when killLogs is undefined-ish (null guard)", async () => {
      await upsertPlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: null as unknown as KillEvent[],
        connection: mockConnection
      });
      expect(mockRunQuery).not.toHaveBeenCalled();
    });
  });

  describe("KanaRating 3.2 enrichment fields present", () => {
    it("maps all new fields into the query values", async () => {
      // Use safe integers — real steam IDs (>2^53) lose precision as JS numbers.
      // The model converts them to strings; safe integers are sufficient for unit tests.
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

      await upsertPlayerKillLogsForGame({
        matchGameId: 42,
        killLogs: [kill],
        connection: mockConnection
      });

      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      const [, flatValues] = mockRunQuery.mock.calls[0];
      const values = flatValues as unknown[];

      // New fields are at positions 16–24 (0-indexed) in the flattened row
      expect(values[16]).toBe(true); // is_first_death
      expect(values[17]).toBe(false); // is_exit_kill
      expect(values[18]).toBe(true); // is_post_plant
      expect(values[19]).toBe(false); // was_victim_traded
      expect(values[20]).toBe("Full Buy"); // ct_buy_type
      expect(values[21]).toBe("Eco"); // t_buy_type
      expect(values[22]).toBe("100000001"); // setup_flash_thrower as string
      expect(values[23]).toBe("100000002"); // setup_damage_player as string
      expect(values[24]).toBe(2.84); // victim_blind_seconds
    });

    it("includes all 25 column placeholders per row", async () => {
      await upsertPlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: [createKillEvent()],
        connection: mockConnection
      });

      const [query] = mockRunQuery.mock.calls[0];
      const placeholderCount = ((query as string).match(/\?/g) ?? []).length;
      expect(placeholderCount).toBe(25);
    });
  });

  describe("backward compatibility — old parser output (fields absent)", () => {
    it("stores NULL for all 3.2 fields when they are missing", async () => {
      const kill = createKillEvent(); // no 3.2 fields

      await upsertPlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: [kill],
        connection: mockConnection
      });

      const [, flatValues] = mockRunQuery.mock.calls[0];
      const values = flatValues as unknown[];

      expect(values[16]).toBeNull(); // is_first_death
      expect(values[17]).toBeNull(); // is_exit_kill
      expect(values[18]).toBeNull(); // is_post_plant
      expect(values[19]).toBeNull(); // was_victim_traded
      expect(values[20]).toBeNull(); // ct_buy_type
      expect(values[21]).toBeNull(); // t_buy_type
      expect(values[22]).toBeNull(); // setup_flash_thrower
      expect(values[23]).toBeNull(); // setup_damage_player
      expect(values[24]).toBeNull(); // victim_blind_seconds
    });
  });

  describe("setup steam ID zero-to-null conversion", () => {
    it("converts setup_flash_thrower = 0 to NULL", async () => {
      const kill = createKillEvent({ setup_flash_thrower: 0 });

      await upsertPlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: [kill],
        connection: mockConnection
      });

      const [, flatValues] = mockRunQuery.mock.calls[0];
      expect((flatValues as unknown[])[22]).toBeNull();
    });

    it("converts setup_damage_player = 0 to NULL", async () => {
      const kill = createKillEvent({ setup_damage_player: 0 });

      await upsertPlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: [kill],
        connection: mockConnection
      });

      const [, flatValues] = mockRunQuery.mock.calls[0];
      expect((flatValues as unknown[])[23]).toBeNull();
    });

    it("preserves a real steam ID for setup_flash_thrower", async () => {
      const kill = createKillEvent({
        setup_flash_thrower: 100000001
      });

      await upsertPlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: [kill],
        connection: mockConnection
      });

      const [, flatValues] = mockRunQuery.mock.calls[0];
      expect((flatValues as unknown[])[22]).toBe("100000001");
    });
  });

  describe("multiple kills in one call", () => {
    it("generates one placeholder group per kill", async () => {
      const kills = [createKillEvent(), createKillEvent({ round_number: 2 })];

      await upsertPlayerKillLogsForGame({
        matchGameId: 1,
        killLogs: kills,
        connection: mockConnection
      });

      const [, flatValues] = mockRunQuery.mock.calls[0];
      expect((flatValues as unknown[]).length).toBe(50); // 25 columns × 2 kills
    });
  });
});
