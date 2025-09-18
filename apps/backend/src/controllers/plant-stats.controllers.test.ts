import { getTeamPlantStats } from "../models/plant-stats.models";
import { getTeamPlantStatsController } from "./plant-stats.controllers";
import { type Response } from "express";
import { type RequestWithParams, type ParsedParams } from "@eggosystem/types";

// Mock the model
jest.mock("../models/plant-stats.models", () => ({
  getTeamPlantStats: jest.fn()
}));

describe("getTeamPlantStatsController", () => {
  let mockReq: Partial<RequestWithParams<{ teamId: string }>> & {
    parsedParams: ParsedParams;
  };
  let mockRes: Partial<Response>;
  let jsonSpy: jest.Mock;

  beforeEach(() => {
    jsonSpy = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnValue({ json: jsonSpy }),
      json: jsonSpy
    };

    mockReq = {
      params: {
        teamId: "123"
      },
      parsedParams: {
        season_ids: [1],
        league_ids: null,
        team_ids: null,
        stages: null,
        map_ids: null,
        player_name: null
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return plant stats data with status 200", async () => {
    // Mock data
    const mockPlantStats = [
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

    (getTeamPlantStats as jest.Mock).mockResolvedValue(mockPlantStats);

    // Call controller
    await getTeamPlantStatsController(
      mockReq as RequestWithParams<{ teamId: string }>,
      mockRes as Response
    );

    // Verify model was called with correct parameters
    expect(getTeamPlantStats).toHaveBeenCalledWith(123, mockReq.parsedParams);

    // Verify response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: true,
      data: mockPlantStats
    });
  });

  it("should convert teamId to number", async () => {
    (getTeamPlantStats as jest.Mock).mockResolvedValue([]);

    // Call controller
    await getTeamPlantStatsController(
      mockReq as RequestWithParams<{ teamId: string }>,
      mockRes as Response
    );

    // Verify teamId was converted to number
    expect(getTeamPlantStats).toHaveBeenCalledWith(123, expect.anything());
  });
});
