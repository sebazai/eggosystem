import { getTeamRetakeStats } from "../../models/retake-stats.models";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock the runQuery module
jest.mock("../../db/mysqlRunQuery", () => ({
  runQuery: jest.fn()
}));

describe("getTeamRetakeStats", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockParsedParams = {
    season_ids: [1],
    league_ids: null,
    team_ids: null,
    stages: null,
    map_ids: null,
    playerName: null
  };

  const mockTeamId = 123;

  it("should call runQuery with correct parameters", async () => {
    // Mock raw data without percentages
    const mockRawData = [
      {
        season_id: 1,
        season_name: "Season 1",
        map_id: 1,
        map_name: "de_dust2",
        team_id: 123,
        team_name: "Test Team",
        afterplant_total: 10,
        afterplant_won: 6,
        retake_total: 8,
        retake_won: 3
      }
    ];

    // Expected data with calculated percentages
    const expectedData = [
      {
        season_id: 1,
        season_name: "Season 1",
        map_id: 1,
        map_name: "de_dust2",
        team_id: 123,
        team_name: "Test Team",
        afterplant_total: 10,
        afterplant_won: 6,
        afterplant_win_percentage: 60,
        retake_total: 8,
        retake_won: 3,
        retake_win_percentage: 38
      }
    ];

    (runQuery as jest.Mock).mockResolvedValue(mockRawData);

    // Call the function
    const result = await getTeamRetakeStats(mockTeamId, mockParsedParams);

    // Check that runQuery was called with correct SQL
    expect(runQuery).toHaveBeenCalled();

    const sqlArg = (runQuery as jest.Mock).mock.calls[0][0];
    const paramsArg = (runQuery as jest.Mock).mock.calls[0][1];

    // Verify SQL contains the expected queries
    expect(sqlArg).toContain(
      "WHEN mrs.t_team_id = t.id AND mrs.plant_site IN ('A', 'B')"
    );
    expect(sqlArg).toContain(
      "WHEN mrs.ct_team_id = t.id AND mrs.plant_site IN ('A', 'B')"
    );
    expect(sqlArg).toContain(
      "AND (mrs.round_end_reason_info = 'bomb_exploded' OR mrs.round_end_reason_info LIKE '%T_WIN%')"
    );
    expect(sqlArg).toContain("AND mrs.round_end_reason_info = 'bomb_defused'");

    // Verify season_id parameter was passed
    expect(paramsArg).toContain(1);

    // Verify the result matches expected data with calculated percentages
    expect(result).toEqual(expectedData);
  });

  it("should handle empty results", async () => {
    (runQuery as jest.Mock).mockResolvedValue([]);

    const result = await getTeamRetakeStats(mockTeamId, mockParsedParams);

    expect(result).toEqual([]);
  });

  it("should handle zero totals without division by zero", async () => {
    const mockZeroData = [
      {
        season_id: 1,
        season_name: "Season 1",
        map_id: 1,
        map_name: "de_dust2",
        team_id: 123,
        team_name: "Test Team",
        afterplant_total: 0,
        afterplant_won: 0,
        retake_total: 0,
        retake_won: 0
      }
    ];

    (runQuery as jest.Mock).mockResolvedValue(mockZeroData);

    const result = await getTeamRetakeStats(mockTeamId, mockParsedParams);

    expect(result[0].afterplant_win_percentage).toBe(0);
    expect(result[0].retake_win_percentage).toBe(0);
  });
});
