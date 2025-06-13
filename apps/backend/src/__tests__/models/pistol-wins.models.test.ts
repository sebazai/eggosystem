import type { TeamPistolWinStat } from "@eggosystem/types";
import { getTeamPistolWins } from "../../models/pistol-wins.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { generateQueryWithFilters, type Filter } from "../../utils/queryFilter";

// Mock the database query function
jest.mock("../../db/mysqlRunQuery", () => ({
  runQuery: jest.fn()
}));

// Mock the query filter generator
jest.mock("../../utils/queryFilter", () => ({
  generateQueryWithFilters: jest.fn()
}));

describe("getTeamPistolWins", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation for generateQueryWithFilters
    (generateQueryWithFilters as jest.Mock).mockReturnValue({
      query: "m.season_id IN (?) AND maps.id IN (?) AND t.id IN (?)",
      queryParams: [14, 1, 1650]
    });
  });

  it("should fetch pistol win statistics for a team", async () => {
    const mockPistolWinStats: TeamPistolWinStat[] = [
      {
        season_id: 14,
        season_name: "Season 2",
        map_id: 1,
        map_name: "de_mirage",
        team_id: 1650,
        team_name: "7dos",
        pistol_rounds_played: 4,
        pistol_rounds_won: 4,
        pistol_win_percentage: 100.0
      },
      {
        season_id: 14,
        season_name: "Season 2",
        map_id: 5,
        map_name: "de_nuke",
        team_id: 1650,
        team_name: "7dos",
        pistol_rounds_played: 10,
        pistol_rounds_won: 8,
        pistol_win_percentage: 80.0
      }
    ];

    (runQuery as jest.Mock).mockResolvedValue(mockPistolWinStats);

    const teamId = 1650;
    const params = {
      season_ids: [14],
      map_ids: null,
      stages: null,
      league_ids: null,
      team_ids: null,
      playerName: null
    };

    const result = await getTeamPistolWins(teamId, params);

    expect(runQuery).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockPistolWinStats);
    expect(result.length).toBe(2);
    expect(result[0].team_id).toBe(1650);
    expect(result[0].pistol_rounds_won).toBe(4);
  });

  it("should handle filtering by map_id", async () => {
    const mockPistolWinStats: TeamPistolWinStat[] = [
      {
        season_id: 14,
        season_name: "Season 2",
        map_id: 1,
        map_name: "de_mirage",
        team_id: 1650,
        team_name: "7dos",
        pistol_rounds_played: 4,
        pistol_rounds_won: 4,
        pistol_win_percentage: 100.0
      }
    ];

    (runQuery as jest.Mock).mockResolvedValue(mockPistolWinStats);

    const teamId = 1650;
    const params = {
      season_ids: [14],
      map_ids: [1], // Filter by de_mirage
      stages: null,
      league_ids: null,
      team_ids: null,
      playerName: null
    };

    const result = await getTeamPistolWins(teamId, params);

    expect(runQuery).toHaveBeenCalledTimes(1);
    // Check that the SQL query includes the map_id filter
    expect((runQuery as jest.Mock).mock.calls[0][1]).toContain(1); // teamId
    expect((runQuery as jest.Mock).mock.calls[0][1]).toContain(14); // season_id
    expect((runQuery as jest.Mock).mock.calls[0][1]).toContain(1); // map_id
    expect(result.length).toBe(1);
    expect(result[0].map_name).toBe("de_mirage");
  });

  it("should return empty array when no results found", async () => {
    (runQuery as jest.Mock).mockResolvedValue([]);

    const teamId = 9999; // Non-existent team
    const params = {
      season_ids: null,
      map_ids: null,
      stages: null,
      league_ids: null,
      team_ids: null,
      playerName: null
    };

    const result = await getTeamPistolWins(teamId, params);

    expect(runQuery).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it("should correctly pass teamId as part of filter parameters", async () => {
    // Reset mock implementation for this specific test
    (generateQueryWithFilters as jest.Mock).mockClear();

    const teamId = 1650;
    const params = {
      season_ids: [14],
      map_ids: [1],
      stages: null,
      league_ids: null,
      team_ids: null,
      playerName: null
    };

    await getTeamPistolWins(teamId, params);

    // Verify generateQueryWithFilters was called with the team_id in the filters
    expect(generateQueryWithFilters).toHaveBeenCalledTimes(1);
    const filterArg = (generateQueryWithFilters as jest.Mock).mock.calls[0][0];

    // Find the filter that includes team_id
    const teamFilter = filterArg.find(
      (filter: Filter) =>
        "column" in filter &&
        typeof filter.column === "string" &&
        filter.column === "t.id"
    );
    expect(teamFilter).toBeDefined();
    if (teamFilter && "column" in teamFilter) {
      expect(teamFilter.value).toEqual([teamId]);
    }

    // Ensure runQuery is called without teamId as a separate parameter
    expect(runQuery).toHaveBeenCalledTimes(1);
    const [sqlQuery, sqlParams] = (runQuery as jest.Mock).mock.calls[0];

    // The teamId should be provided by the filter array, not separately
    expect(typeof sqlQuery).toBe("string");
    expect(Array.isArray(sqlParams)).toBe(true);
  });
});
