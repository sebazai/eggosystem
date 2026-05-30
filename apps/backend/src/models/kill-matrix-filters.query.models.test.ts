import { getMatchGameKillMatrix } from "./match-game-analysis.models";
import { runQuery } from "../db/mysqlRunQuery";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("getMatchGameKillMatrix filters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("queries PlayerKillLogs for the given match game", async () => {
    await getMatchGameKillMatrix(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM PlayerKillLogs/i);
    expect(params).toContain(42);
  });

  it("always excludes same-team kills", async () => {
    await getMatchGameKillMatrix(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/killer_team != victim_team/i);
  });

  it("excludes exit kills when excludeExitKills = true", async () => {
    await getMatchGameKillMatrix(42, { excludeExitKills: true });

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/is_exit_kill = 0/);
  });

  it("does not add exit-kill clause when excludeExitKills is omitted", async () => {
    await getMatchGameKillMatrix(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).not.toMatch(/is_exit_kill/);
  });

  it("filters to post-plant only when postPlantOnly = true", async () => {
    await getMatchGameKillMatrix(42, { postPlantOnly: true });

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/is_post_plant = 1/);
  });

  it("excludes eco kills when excludeEcoKills = true", async () => {
    await getMatchGameKillMatrix(42, { excludeEcoKills: true });

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/ct_buy_type != 'Eco'/);
    expect(query).toMatch(/t_buy_type != 'Eco'/);
  });

  it("returns empty kills and flash_assists for games with no data", async () => {
    const result = await getMatchGameKillMatrix(999);

    expect(result).toEqual({ kills: [], flash_assists: [] });
  });

  it("coerces numeric steam IDs to strings", async () => {
    mockRunQuery
      .mockResolvedValueOnce([
        { killer: 1001, victim: 1002, count: 3 }
      ] as never)
      .mockResolvedValueOnce([
        { assister: 1001, victim: 1003, count: 1 }
      ] as never);

    const result = await getMatchGameKillMatrix(42);

    expect(result.kills[0].killer_steam_id).toBe("1001");
    expect(result.kills[0].victim_steam_id).toBe("1002");
    expect(result.flash_assists[0].assister_steam_id).toBe("1001");
  });
});
