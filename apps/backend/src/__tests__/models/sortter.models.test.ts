import { getTeamValuesForSorter } from "../../models/sortter.models";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock the database query function
jest.mock("../../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("getTeamValuesForSorter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return all teams with their values for a given season", async () => {
    // Mock data setup
    const mockTeamValues = [
      {
        team_id: 2053,
        team_name: "CSKeisari",
        team_logo: "logo_url_1",
        league_name: "League 1",
        top5_sum: 1418,
        avg4: 288.75,
        top5_values: JSON.stringify([300, 295, 285, 275, 263])
      },
      {
        team_id: 2054,
        team_name: "TeamTwo",
        team_logo: "logo_url_2",
        league_name: "League 2",
        top5_sum: 1000,
        avg4: 200.0,
        top5_values: JSON.stringify([250, 250, 250, 250, 0])
      }
    ];

    mockRunQuery.mockResolvedValue(mockTeamValues);

    // Call the function with test season
    const result = await getTeamValuesForSorter(14);

    // Verify the function returned the expected data with parsed values
    expect(result).toEqual([
      {
        ...mockTeamValues[0],
        top5_values: [300, 295, 285, 275, 263]
      },
      {
        ...mockTeamValues[1],
        top5_values: [250, 250, 250, 250, 0]
      }
    ]);

    // Verify query was called with the right parameters
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
    expect(mockRunQuery.mock.calls[0][1]).toEqual([14]);
  });

  it("should return an empty array if no teams are found", async () => {
    // Mock empty return
    mockRunQuery.mockResolvedValue([]);

    // Call the function
    const result = await getTeamValuesForSorter(999);

    // Verify empty array is returned
    expect(result).toEqual([]);
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it("should match expected values for team CSKeisari", async () => {
    // This test will verify the specific values mentioned in the requirements
    const mockTeamValues = [
      {
        team_id: 2053,
        team_name: "CSKeisari",
        team_logo: "logo_url_1",
        league_name: "League 1",
        top5_sum: 1418,
        avg4: 288.75,
        top5_values: JSON.stringify([300, 295, 285, 275, 263])
      }
    ];

    mockRunQuery.mockResolvedValue(mockTeamValues);

    // Call the function for season 14
    const result = await getTeamValuesForSorter(14);

    // Verify the specific team has the expected values
    const csKeisari = result.find((team) => team.team_id === 2053);
    expect(csKeisari).toBeDefined();
    expect(csKeisari?.team_name).toBe("CSKeisari");
    expect(csKeisari?.top5_sum).toBe(1418);
    expect(csKeisari?.avg4).toBe(288.75);
    // Verify the top5_values are properly transformed to numbers
    expect(csKeisari?.top5_values).toEqual([300, 295, 285, 275, 263]);
  });
});
