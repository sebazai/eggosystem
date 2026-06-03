import { getPlayerFlashStatsCrossGame } from "./flash-events.models";
import { getPlayerUtilityStatsCrossGame } from "./round-utility-summary.models";
import { getPlayerRoundImpact } from "./match-game-analysis.models";
import { runQuery } from "../db/mysqlRunQuery";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("getPlayerFlashStatsCrossGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries FlashEvents with JOIN to MatchGames and Matches", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getPlayerFlashStatsCrossGame("steamXYZ");

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM FlashEvents/i);
    expect(query).toMatch(/JOIN MatchGames/i);
    expect(query).toMatch(/JOIN Matches/i);
    expect(params).toContain("steamXYZ");
  });

  it("adds season filter when seasonId is provided", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getPlayerFlashStatsCrossGame("steamXYZ", { seasonId: 5 });

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/m\.season_id = \?/);
    expect(params).toContain(5);
  });

  it("returns zeroed stats when player has no flash data", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    const result = await getPlayerFlashStatsCrossGame("steamXYZ");

    expect(result.games_played).toBe(0);
    expect(result.avg_enemy_flashes_per_game).toBe(0);
    expect(result.discipline_ratio).toBe(0);
    expect(result.top_victim_steam_id).toBeNull();
  });

  it("calculates discipline_ratio correctly", async () => {
    mockRunQuery
      .mockResolvedValueOnce([
        {
          games_played: 2,
          total_enemy_flashes: 6,
          total_teammate_flashes: 2,
          total_blind_seconds: 20
        }
      ] as never)
      .mockResolvedValueOnce([] as never);

    const result = await getPlayerFlashStatsCrossGame("steamXYZ");

    expect(result.discipline_ratio).toBe(0.75); // 6 / (6+2)
    expect(result.teammate_flash_rate).toBe(0.25); // 2 / 8
    expect(result.avg_enemy_flashes_per_game).toBe(3); // 6 / 2
  });

  it("returns top_victim_steam_id when available", async () => {
    mockRunQuery
      .mockResolvedValueOnce([
        {
          games_played: 1,
          total_enemy_flashes: 3,
          total_teammate_flashes: 1,
          total_blind_seconds: 9
        }
      ] as never)
      .mockResolvedValueOnce([{ victim_steam_id: 9999, cnt: 3 }] as never);

    const result = await getPlayerFlashStatsCrossGame("steamXYZ");

    expect(result.top_victim_steam_id).toBe("9999");
  });
});

describe("getPlayerUtilityStatsCrossGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries RoundUtilitySummary and WastedUtilityEvents", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getPlayerUtilityStatsCrossGame("steamXYZ");

    const queries = mockRunQuery.mock.calls.map(([q]) => q as string);
    expect(queries.some((q) => /RoundUtilitySummary/i.test(q))).toBe(true);
    expect(queries.some((q) => /WastedUtilityEvents/i.test(q))).toBe(true);
  });

  it("adds season filter when seasonId is provided", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getPlayerUtilityStatsCrossGame("steamXYZ", { seasonId: 3 });

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/m\.season_id = \?/);
    expect(params).toContain(3);
  });

  it("returns zeroed stats when player has no data", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    const result = await getPlayerUtilityStatsCrossGame("steamXYZ");

    expect(result.games_played).toBe(0);
    expect(result.avg_utility_damage_per_round).toBe(0);
    expect(result.avg_wasted_utility_per_game).toBe(0);
  });

  it("calculates averages per round correctly", async () => {
    mockRunQuery
      .mockResolvedValueOnce([
        {
          games_played: 2,
          rounds_played: 40,
          total_flashes_thrown: 80,
          total_enemies_flashed: 60,
          total_smokes_thrown: 20,
          total_utility_damage: 1000
        }
      ] as never)
      .mockResolvedValueOnce([{ total_wasted: 4 }] as never);

    const result = await getPlayerUtilityStatsCrossGame("steamXYZ");

    expect(result.avg_flashes_thrown_per_round).toBe(2); // 80/40
    expect(result.avg_utility_damage_per_round).toBe(25); // 1000/40
    expect(result.avg_wasted_utility_per_game).toBe(2); // 4/2
  });
});

describe("getPlayerRoundImpact", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries RoundSwingEvents with JOIN to MatchGames and Matches", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getPlayerRoundImpact("steamXYZ");

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM RoundSwingEvents/i);
    expect(query).toMatch(/JOIN MatchGames/i);
    expect(query).toMatch(/JOIN Matches/i);
    expect(params).toContain("steamXYZ");
  });

  it("adds season filter when seasonId is provided", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getPlayerRoundImpact("steamXYZ", { seasonId: 7 });

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/m\.season_id = \?/);
    expect(params).toContain(7);
  });

  it("returns zeroed stats when player has no swing data", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    const result = await getPlayerRoundImpact("steamXYZ");

    expect(result.games_played).toBe(0);
    expect(result.total_impact_score).toBe(0);
    expect(result.biggest_single_swing).toBe(0);
  });

  it("returns correct aggregated impact values", async () => {
    mockRunQuery.mockResolvedValueOnce([
      {
        games_played: 3,
        total_events: 12,
        total_impact_score: 2.4,
        avg_impact_per_event: 0.2,
        biggest_single_swing: 0.45
      }
    ] as never);

    const result = await getPlayerRoundImpact("steamXYZ");

    expect(result.games_played).toBe(3);
    expect(result.total_events).toBe(12);
    expect(result.total_impact_score).toBe(2.4);
    expect(result.biggest_single_swing).toBe(0.45);
  });
});
