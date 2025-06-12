import {
  getTeamValuesForSorter,
  getTeamPlayerValuesForSortter
} from "../../models/sortter.models";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock the database query function
jest.mock("../../db/mysqlRunQuery");

describe("Sortter Models", () => {
  const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTeamValuesForSorter", () => {
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

    it("should convert team values from raw database format to expected format", async () => {
      const mockRawTeamValues = [
        {
          team_id: 1,
          team_name: "Team 1",
          team_logo: "logo1.png",
          league_name: "League 1",
          top5_sum: 100,
          avg4: 25,
          top5_values: "[20, 20, 20, 20, 20]"
        }
      ];

      const expectedProcessedTeamValues = [
        {
          team_id: 1,
          team_name: "Team 1",
          team_logo: "logo1.png",
          league_name: "League 1",
          top5_sum: 100,
          avg4: 25,
          top5_values: [20, 20, 20, 20, 20]
        }
      ];

      mockRunQuery.mockResolvedValue(mockRawTeamValues);

      const result = await getTeamValuesForSorter(1);

      expect(mockRunQuery).toHaveBeenCalledWith(expect.any(String), [1]);
      expect(result).toEqual(expectedProcessedTeamValues);
    });
  });

  describe("getTeamPlayerValuesForSortter", () => {
    it("should return player values for a specific team and season", async () => {
      const mockPlayerValues = [
        {
          name: "toNppa",
          steamid: "76561197960383236",
          cs2_rank: 17690,
          faceit_level: 9,
          faceit_elo: 1954,
          hours: 3382,
          kanarating: 1.296875,
          fkd: 1.21
        }
      ];

      mockRunQuery.mockResolvedValue(mockPlayerValues);

      const result = await getTeamPlayerValuesForSortter(14, 1);

      expect(mockRunQuery).toHaveBeenCalledWith(expect.any(String), [14, 1]);
      expect(result).toEqual(mockPlayerValues);
    });

    it("should handle null values in the result", async () => {
      const mockPlayerValues = [
        {
          name: "Player1",
          steamid: "123456789",
          cs2_rank: null,
          faceit_level: null,
          faceit_elo: null,
          hours: null,
          kanarating: null,
          fkd: null
        }
      ];

      mockRunQuery.mockResolvedValue(mockPlayerValues);

      const result = await getTeamPlayerValuesForSortter(14, 1);

      expect(mockRunQuery).toHaveBeenCalledWith(expect.any(String), [14, 1]);
      // Result should contain the raw values with nulls preserved
      expect(result).toEqual(mockPlayerValues);
    });
  });
});
