import { getTeamPlantStats } from "../../models/plant-stats.models";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock the runQuery module
jest.mock("../../db/mysqlRunQuery", () => ({
  runQuery: jest.fn()
}));

describe("getTeamPlantStats", () => {
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
    // Mock the return value
    const mockReturnValue = [
      {
        season_id: 1,
        season_name: "Season 1",
        map_id: 1,
        map_name: "de_dust2",
        team_id: 123,
        team_name: "Test Team",
        planted_a_site: 5,
        planted_b_site: 10,
        no_plants: 8,
        enemy_planted_a_site: 4,
        enemy_planted_b_site: 7,
        enemy_no_plants: 12
      }
    ];

    (runQuery as jest.Mock).mockResolvedValue(mockReturnValue);

    // Call the function
    const result = await getTeamPlantStats(mockTeamId, mockParsedParams);

    // Check that runQuery was called with correct SQL and params
    expect(runQuery).toHaveBeenCalled();

    const sqlArg = (runQuery as jest.Mock).mock.calls[0][0];
    const paramsArg = (runQuery as jest.Mock).mock.calls[0][1];

    // Verify SQL contains the expected queries for A and B sites
    expect(sqlArg).toContain(
      "WHEN mrs.t_team_id = t.id AND mrs.plant_site = 'A'"
    );
    expect(sqlArg).toContain(
      "WHEN mrs.t_team_id = t.id AND mrs.plant_site = 'B'"
    );
    expect(sqlArg).toContain(
      "WHEN mrs.ct_team_id = t.id AND mrs.plant_site = 'A'"
    );
    expect(sqlArg).toContain(
      "WHEN mrs.ct_team_id = t.id AND mrs.plant_site = 'B'"
    );

    // Verify season_id parameter was passed
    expect(paramsArg).toContain(1);

    // Verify the result matches the mock
    expect(result).toEqual(mockReturnValue);
  });

  it("should handle empty results", async () => {
    (runQuery as jest.Mock).mockResolvedValue([]);

    const result = await getTeamPlantStats(mockTeamId, mockParsedParams);

    expect(result).toEqual([]);
  });

  it("should return expected data for map_id=5", async () => {
    // Setup the specific map_id filter
    const nukeParams = {
      season_ids: [14],
      league_ids: null,
      team_ids: null,
      stages: null,
      map_ids: [5],
      playerName: null
    };

    // Define the expected output based on the provided data
    const expectedOutput = [
      {
        season_id: 14,
        season_name: "Season 2",
        map_id: 5,
        map_name: "de_nuke",
        team_id: 1650,
        team_name: "7dos",
        planted_a_site: 16,
        planted_b_site: 16,
        no_plants: 20,
        enemy_planted_a_site: 9,
        enemy_planted_b_site: 8,
        enemy_no_plants: 22
      }
    ];

    // Mock the runQuery to return our expected output
    (runQuery as jest.Mock).mockResolvedValue(expectedOutput);

    // Call function with specific team and map parameters
    const result = await getTeamPlantStats(1650, nukeParams);

    // Verify runQuery was called with the correct parameters
    expect(runQuery).toHaveBeenCalled();
    const sqlArg = (runQuery as jest.Mock).mock.calls[0][0];
    const paramsArg = (runQuery as jest.Mock).mock.calls[0][1];

    // Verify SQL structure remains correct
    expect(sqlArg).toContain("maps.id AS map_id");
    expect(sqlArg).toContain("maps.name AS map_name");

    // Verify the map_id parameter was passed correctly
    expect(paramsArg).toContain(5);

    // Verify the result matches our expected output
    expect(result).toEqual(expectedOutput);
    expect(result[0].map_name).toBe("de_nuke");
    expect(result[0].planted_a_site).toBe(16);
    expect(result[0].planted_b_site).toBe(16);
    expect(result[0].no_plants).toBe(20);
    expect(result[0].enemy_planted_a_site).toBe(9);
    expect(result[0].enemy_planted_b_site).toBe(8);
    expect(result[0].enemy_no_plants).toBe(22);
  });
});
