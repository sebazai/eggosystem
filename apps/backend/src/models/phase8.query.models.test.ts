import { getSetupPairs } from "./setup-events.models";
import { getWastedUtilityByPlayer } from "./wasted-utility-events.models";
import { getRoundUtilitySummary } from "./round-utility-summary.models";
import { runQuery } from "../db/mysqlRunQuery";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("getSetupPairs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries SetupEvents for the given match game", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getSetupPairs(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM SetupEvents/i);
    expect(params).toContain(42);
  });

  it("groups by setup_player, beneficiary, and setup_type", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getSetupPairs(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(
      /GROUP BY setup_player_steam_id, beneficiary_steam_id, setup_type/i
    );
  });

  it("coerces steam IDs to strings and count to number", async () => {
    mockRunQuery.mockResolvedValue([
      {
        setup_player_steam_id: 1001,
        beneficiary_steam_id: 1002,
        setup_type: "flash",
        count: 3,
        avg_seconds_after_setup: 1.5
      }
    ] as never);

    const result = await getSetupPairs(42);

    expect(result[0].setup_player_steam_id).toBe("1001");
    expect(result[0].beneficiary_steam_id).toBe("1002");
    expect(result[0].count).toBe(3);
    expect(result[0].setup_type).toBe("flash");
  });

  it("returns empty array when no setup events exist", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    const result = await getSetupPairs(999);

    expect(result).toEqual([]);
  });
});

describe("getWastedUtilityByPlayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries WastedUtilityEvents for the given match game", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getWastedUtilityByPlayer(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM WastedUtilityEvents/i);
    expect(params).toContain(42);
  });

  it("groups by thrower and utility_type", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getWastedUtilityByPlayer(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/GROUP BY thrower_steam_id, utility_type/i);
  });

  it("coerces thrower steam ID to string", async () => {
    mockRunQuery.mockResolvedValue([
      {
        thrower_steam_id: 1001,
        utility_type: "HE",
        count: 2
      }
    ] as never);

    const result = await getWastedUtilityByPlayer(42);

    expect(result[0].thrower_steam_id).toBe("1001");
    expect(result[0].utility_type).toBe("HE");
    expect(result[0].count).toBe(2);
  });

  it("returns empty array when no wasted utility events exist", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    const result = await getWastedUtilityByPlayer(999);

    expect(result).toEqual([]);
  });
});

describe("getRoundUtilitySummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries RoundUtilitySummary for the given match game", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getRoundUtilitySummary(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM RoundUtilitySummary/i);
    expect(params).toContain(42);
  });

  it("orders by round_number and steam_id ascending", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getRoundUtilitySummary(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/ORDER BY round_number ASC, steam_id ASC/i);
  });

  it("coerces steam ID to string and returns all numeric fields", async () => {
    mockRunQuery.mockResolvedValue([
      {
        round_number: 3,
        steam_id: 1001,
        flashes_thrown: 2,
        enemies_flashed: 1,
        teammates_flashed: 0,
        smokes_thrown: 1,
        utility_damage: 45,
        wasted_utility: 0
      }
    ] as never);

    const result = await getRoundUtilitySummary(42);

    expect(result[0].steam_id).toBe("1001");
    expect(result[0].round_number).toBe(3);
    expect(result[0].flashes_thrown).toBe(2);
    expect(result[0].utility_damage).toBe(45);
  });

  it("returns empty array when no data exists", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    const result = await getRoundUtilitySummary(999);

    expect(result).toEqual([]);
  });
});
