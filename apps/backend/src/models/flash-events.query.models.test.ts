import { getFlashMatrix, getPlayerFlashStats } from "./flash-events.models";
import { runQuery } from "../db/mysqlRunQuery";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("getFlashMatrix", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries FlashEvents for the given match game", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getFlashMatrix(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM FlashEvents/i);
    expect(params).toContain(42);
  });

  it("excludes zero-victim rows (victim_steam_id != 0)", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getFlashMatrix(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/victim_steam_id != 0/);
  });

  it("filters to enemy flashes only by default", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getFlashMatrix(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/is_enemy_flash = 1/);
  });

  it("omits enemy flash filter when enemyOnly = false", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getFlashMatrix(42, { enemyOnly: false });

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).not.toMatch(/is_enemy_flash/);
  });

  it("groups by thrower and victim steam IDs", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getFlashMatrix(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/GROUP BY thrower_steam_id, victim_steam_id/i);
  });

  it("coerces numeric DB values to correct types", async () => {
    mockRunQuery.mockResolvedValue([
      {
        thrower_steam_id: "1001",
        victim_steam_id: "1002",
        flash_count: "5",
        avg_duration_seconds: "2.400",
        total_duration_seconds: "12.000"
      }
    ] as never);

    const result = await getFlashMatrix(42);

    expect(result[0].flash_count).toBe(5);
    expect(typeof result[0].avg_duration_seconds).toBe("number");
    expect(typeof result[0].total_duration_seconds).toBe("number");
  });

  it("returns empty array when no flash events exist", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    const result = await getFlashMatrix(999);

    expect(result).toEqual([]);
  });
});

describe("getPlayerFlashStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries FlashEvents for the given match game", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getPlayerFlashStats(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM FlashEvents/i);
    expect(params).toContain(42);
  });

  it("groups by thrower_steam_id", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getPlayerFlashStats(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/GROUP BY thrower_steam_id/i);
  });

  it("coerces numeric fields and defaults null avg_duration to 0", async () => {
    mockRunQuery.mockResolvedValue([
      {
        steam_id: "1001",
        enemy_flashes: "3",
        teammate_flashes: "1",
        self_flashes: "0",
        total_flashes: "4",
        avg_duration_seconds: null,
        total_duration_seconds: "0"
      }
    ] as never);

    const result = await getPlayerFlashStats(42);

    expect(result[0].enemy_flashes).toBe(3);
    expect(result[0].avg_duration_seconds).toBe(0);
  });

  it("returns empty array when no flash events exist", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    const result = await getPlayerFlashStats(999);

    expect(result).toEqual([]);
  });
});
