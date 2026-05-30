import { getEntryKills } from "./match-game-analysis.models";
import { runQuery } from "../db/mysqlRunQuery";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("getEntryKills", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries PlayerKillLogs for the given match game", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getEntryKills(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM PlayerKillLogs/i);
    expect(params).toContain(42);
  });

  it("filters to is_first_death = 1", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getEntryKills(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/is_first_death = 1/);
  });

  it("orders by round_number and time_in_round ascending", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getEntryKills(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/ORDER BY round_number ASC, time_in_round ASC/i);
  });

  it("coerces numeric steam IDs to strings", async () => {
    mockRunQuery.mockResolvedValue([
      {
        round_number: 5,
        time_in_round: 12.5,
        killer: 1001,
        victim: 1002,
        killer_team: "CT",
        victim_team: "T",
        setup_flash_thrower: 1003,
        victim_blind_seconds: 2.1,
        was_victim_traded: 0
      }
    ] as never);

    const result = await getEntryKills(42);

    expect(result[0].killer_steam_id).toBe("1001");
    expect(result[0].victim_steam_id).toBe("1002");
    expect(result[0].setup_flash_thrower).toBe("1003");
  });

  it("maps was_victim_traded integer to boolean", async () => {
    mockRunQuery.mockResolvedValue([
      {
        round_number: 1,
        time_in_round: 8.0,
        killer: 1001,
        victim: 1002,
        killer_team: "T",
        victim_team: "CT",
        setup_flash_thrower: null,
        victim_blind_seconds: null,
        was_victim_traded: 1
      }
    ] as never);

    const result = await getEntryKills(42);

    expect(result[0].was_victim_traded).toBe(true);
    expect(result[0].setup_flash_thrower).toBeNull();
    expect(result[0].victim_blind_seconds).toBeNull();
  });

  it("returns null fields correctly for old-parser rows without enrichment", async () => {
    mockRunQuery.mockResolvedValue([
      {
        round_number: 2,
        time_in_round: 15.3,
        killer: 1001,
        victim: 1002,
        killer_team: "CT",
        victim_team: "T",
        setup_flash_thrower: null,
        victim_blind_seconds: null,
        was_victim_traded: null
      }
    ] as never);

    const result = await getEntryKills(42);

    expect(result[0].was_victim_traded).toBeNull();
    expect(result[0].setup_flash_thrower).toBeNull();
  });

  it("returns empty array when no entry kills exist", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    const result = await getEntryKills(999);

    expect(result).toEqual([]);
  });
});
