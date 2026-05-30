import {
  getFlashLeaderboard,
  getRoundImpactLeaderboard,
  getUtilityDisciplineLeaderboard
} from "./leaderboard.models";
import { runQuery } from "../db/mysqlRunQuery";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("getFlashLeaderboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("queries FlashEvents joined to MatchGames and Matches", async () => {
    await getFlashLeaderboard(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM FlashEvents/i);
    expect(query).toMatch(/JOIN MatchGames/i);
    expect(query).toMatch(/JOIN Matches/i);
    expect(params).toContain(42);
  });

  it("groups by thrower_steam_id", async () => {
    await getFlashLeaderboard(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/GROUP BY fe\.thrower_steam_id/i);
  });

  it("applies minGames HAVING clause", async () => {
    await getFlashLeaderboard(42, { minGames: 3 });

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/HAVING games_played >= \?/i);
    expect(params).toContain(3);
  });

  it("sorts by blind_time by default", async () => {
    await getFlashLeaderboard(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/total_enemy_blind_time DESC/i);
  });

  it("sorts by flash_count when sortBy=flash_count", async () => {
    await getFlashLeaderboard(42, { sortBy: "flash_count" });

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/enemy_flash_count DESC/i);
  });

  it("sorts by discipline_ratio when sortBy=discipline", async () => {
    await getFlashLeaderboard(42, { sortBy: "discipline" });

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/discipline_ratio DESC/i);
  });

  it("assigns sequential ranks starting from 1", async () => {
    mockRunQuery.mockResolvedValueOnce([
      {
        steam_id: "1001",
        games_played: 5,
        total_enemy_blind_time: 50,
        enemy_flash_count: 20,
        total_teammate_flashes: 4,
        total_flashes: 24
      },
      {
        steam_id: "1002",
        games_played: 3,
        total_enemy_blind_time: 30,
        enemy_flash_count: 10,
        total_teammate_flashes: 2,
        total_flashes: 12
      }
    ] as never);

    const result = await getFlashLeaderboard(42);

    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
    expect(result[0].steam_id).toBe("1001");
  });

  it("returns empty array for tournaments with no flash data", async () => {
    const result = await getFlashLeaderboard(999);

    expect(result).toEqual([]);
  });
});

describe("getRoundImpactLeaderboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("queries RoundSwingEvents joined to MatchGames and Matches", async () => {
    await getRoundImpactLeaderboard(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM RoundSwingEvents/i);
    expect(query).toMatch(/JOIN MatchGames/i);
    expect(query).toMatch(/JOIN Matches/i);
    expect(params).toContain(42);
  });

  it("orders by total_impact_score DESC", async () => {
    await getRoundImpactLeaderboard(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/ORDER BY total_impact_score DESC/i);
  });

  it("applies minGames filter", async () => {
    await getRoundImpactLeaderboard(42, { minGames: 2 });

    const [, params] = mockRunQuery.mock.calls[0];
    expect(params).toContain(2);
  });

  it("assigns sequential ranks and coerces types", async () => {
    mockRunQuery.mockResolvedValueOnce([
      {
        steam_id: 1001,
        games_played: 4,
        total_events: 20,
        total_impact_score: 3.5,
        avg_impact_per_event: 0.175,
        biggest_single_swing: 0.4
      }
    ] as never);

    const result = await getRoundImpactLeaderboard(42);

    expect(result[0].rank).toBe(1);
    expect(result[0].steam_id).toBe("1001");
    expect(result[0].total_impact_score).toBe(3.5);
  });

  it("returns empty array for tournaments with no data", async () => {
    const result = await getRoundImpactLeaderboard(999);

    expect(result).toEqual([]);
  });
});

describe("getUtilityDisciplineLeaderboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("queries RoundUtilitySummary joined to MatchGames and Matches", async () => {
    await getUtilityDisciplineLeaderboard(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM RoundUtilitySummary/i);
    expect(query).toMatch(/JOIN MatchGames/i);
    expect(query).toMatch(/JOIN Matches/i);
    expect(params).toContain(42);
  });

  it("sorts by wasted_asc by default", async () => {
    await getUtilityDisciplineLeaderboard(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/SUM\(rus\.wasted_utility\) \/ COUNT/i);
  });

  it("sorts by utility_damage_desc when specified", async () => {
    await getUtilityDisciplineLeaderboard(42, {
      sortBy: "utility_damage_desc"
    });

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/SUM\(rus\.utility_damage\) \/ COUNT/i);
  });

  it("calculates per-game and per-round averages correctly", async () => {
    mockRunQuery.mockResolvedValueOnce([
      {
        steam_id: "1001",
        games_played: 3,
        rounds_played: 60,
        total_wasted_utility: 6,
        total_utility_damage: 900,
        total_enemies_flashed: 30
      }
    ] as never);

    const result = await getUtilityDisciplineLeaderboard(42);

    expect(result[0].avg_wasted_per_game).toBe(2); // 6/3
    expect(result[0].avg_utility_damage_per_round).toBe(15); // 900/60
    expect(result[0].avg_enemies_flashed_per_round).toBe(0.5); // 30/60
  });

  it("returns empty array for tournaments with no data", async () => {
    const result = await getUtilityDisciplineLeaderboard(999);

    expect(result).toEqual([]);
  });
});
