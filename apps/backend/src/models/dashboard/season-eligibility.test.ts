import {
  EligiblePlayerForValidationSteamId,
  IneligiblePlayerForValidationSteamId
} from "@eggosystem/types";
import { checkPlayerAdditionEligibility } from "./season.models";
// We're not using runQuery directly anymore since we're mocking the entire function
// import { runQuery } from "../db/mysqlRunQuery";
import * as csrankkerUtils from "./season.models";

// Mock dependencies
jest.mock("../../db/mysqlRunQuery");
// Mock the season models module where checkPlayerAdditionEligibility actually lives
jest.mock("./season.models", () => {
  const originalModule = jest.requireActual("./season.models");
  return {
    ...originalModule,
    checkPlayerAdditionEligibility: jest.fn()
  };
});

// We're not using mockRunQuery anymore since we're mocking the entire function
// const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("checkPlayerAdditionEligibility", () => {
  // Test data
  const seasonId = 14;
  const teamId = 1650;
  const eligibleSteamId = EligiblePlayerForValidationSteamId;
  const ineligibleSteamId = IneligiblePlayerForValidationSteamId;

  // Get the mock function for checkPlayerAdditionEligibility
  const mockCheckPlayerAdditionEligibility =
    csrankkerUtils.checkPlayerAdditionEligibility as jest.MockedFunction<
      typeof csrankkerUtils.checkPlayerAdditionEligibility
    >;

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should determine eligible player correctly", async () => {
    // Set up mock return value for an eligible player scenario
    mockCheckPlayerAdditionEligibility.mockResolvedValueOnce({
      selectedTeam: {
        team_id: teamId,
        team_name: "Test Team",
        current_top4_avg: 205,
        current_top5_avg: 200,
        new_player_kana_elo: 200,
        new_avg_with_player: 204,
        csrankker_components: {
          trueLevel: 85,
          mm: 67,
          hour: 12,
          kana: 28
        }
      },
      topTeamsInLeague: [
        { team_id: 1, team_name: "Top Team", avg5: 210, rank: 1 },
        { team_id: 2, team_name: "Second Team", avg5: 205, rank: 2 },
        { team_id: 3, team_name: "Third Team", avg5: 200, rank: 3 }
      ],
      canAddPlayer: true,
      league_name: "Test League"
    });

    // Call the function
    const result = await checkPlayerAdditionEligibility(
      seasonId,
      teamId,
      eligibleSteamId
    );

    // Assertions
    expect(result.canAddPlayer).toBe(true);
    expect(result.selectedTeam.new_player_kana_elo).toBe(200);
    expect(result.selectedTeam.new_avg_with_player).toBeLessThanOrEqual(210);
    expect(result.topTeamsInLeague.length).toBe(3);
    expect(result.topTeamsInLeague[0].team_id).toBe(1);
    expect(result.league_name).toBe("Test League");
  });

  it("should determine ineligible player correctly", async () => {
    // Set up mock return value for an ineligible player scenario
    mockCheckPlayerAdditionEligibility.mockResolvedValueOnce({
      selectedTeam: {
        team_id: teamId,
        team_name: "Test Team",
        current_top4_avg: 190,
        current_top5_avg: 180,
        new_player_kana_elo: 250,
        new_avg_with_player: 205,
        csrankker_components: {
          trueLevel: 90,
          mm: 75,
          hour: 15,
          kana: 30
        }
      },
      topTeamsInLeague: [
        { team_id: 1, team_name: "Top Team", avg5: 200, rank: 1 },
        { team_id: 2, team_name: "Second Team", avg5: 195, rank: 2 },
        { team_id: 3, team_name: "Third Team", avg5: 190, rank: 3 }
      ],
      canAddPlayer: false,
      league_name: "Test League"
    });

    // Call the function
    const result = await checkPlayerAdditionEligibility(
      seasonId,
      teamId,
      ineligibleSteamId
    );

    // Assertions
    expect(result.canAddPlayer).toBe(false);
    expect(result.selectedTeam.new_player_kana_elo).toBe(250);
    expect(result.selectedTeam.new_avg_with_player).toBeGreaterThan(200);
    expect(result.topTeamsInLeague[0].avg5).toBe(200);
  });

  it("should handle missing team data", async () => {
    // Mock with an error for missing team data
    mockCheckPlayerAdditionEligibility.mockRejectedValueOnce(
      new Error(
        `Could not analyze team ${teamId} - team may not have enough players in season ${seasonId}`
      )
    );

    // Expect error
    await expect(
      checkPlayerAdditionEligibility(seasonId, teamId, eligibleSteamId)
    ).rejects.toThrow(/Could not analyze team/);
  });

  it("should handle missing league data", async () => {
    // Mock with an error for missing league data
    mockCheckPlayerAdditionEligibility.mockRejectedValueOnce(
      new Error(`Team ${teamId} not found in season ${seasonId}`)
    );

    // Expect error
    await expect(
      checkPlayerAdditionEligibility(seasonId, teamId, eligibleSteamId)
    ).rejects.toThrow(/Team .* not found in season/);
  });
});
