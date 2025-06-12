import { type Response } from "express";
import {
  getTeamValuesController,
  getTeamValueByIdController,
  getTeamPlayerValuesController
} from "../../controllers/sortter.controllers";
import * as sortterModels from "../../models/sortter.models";
import {
  type TeamSortterValues,
  type RequestWithParams
} from "@eggosystem/types";

jest.mock("../../models/sortter.models");

describe("Sortter Controllers", () => {
  let mockRequest: Partial<RequestWithParams<Record<string, string>>>;
  let mockResponse: Partial<Response>;
  const mockSortterModels = sortterModels as jest.Mocked<typeof sortterModels>;

  beforeEach(() => {
    mockRequest = {
      params: {}
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getTeamValuesController", () => {
    it("should return team values for a season", async () => {
      const mockTeamValues: TeamSortterValues[] = [
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

      mockRequest.params = { season_id: "1" };
      mockSortterModels.getTeamValuesForSorter.mockResolvedValue(
        mockTeamValues
      );

      await getTeamValuesController(
        mockRequest as RequestWithParams<{ season_id: string }>,
        mockResponse as Response
      );

      expect(mockSortterModels.getTeamValuesForSorter).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTeamValues);
    });
  });

  describe("getTeamValueByIdController", () => {
    it("should return team value for a specific team and season", async () => {
      const mockTeamValues: TeamSortterValues[] = [
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

      mockRequest.params = { season_id: "1", team_id: "1" };
      mockSortterModels.getTeamValuesForSorter.mockResolvedValue(
        mockTeamValues
      );

      await getTeamValueByIdController(
        mockRequest as RequestWithParams<{
          season_id: string;
          team_id: string;
        }>,
        mockResponse as Response
      );

      expect(mockSortterModels.getTeamValuesForSorter).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTeamValues[0]);
    });

    it("should return 404 if team not found", async () => {
      const mockTeamValues: TeamSortterValues[] = [
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

      mockRequest.params = { season_id: "1", team_id: "2" };
      mockSortterModels.getTeamValuesForSorter.mockResolvedValue(
        mockTeamValues
      );

      await getTeamValueByIdController(
        mockRequest as RequestWithParams<{
          season_id: string;
          team_id: string;
        }>,
        mockResponse as Response
      );

      expect(mockSortterModels.getTeamValuesForSorter).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Team with ID 2 not found for season 1"
      });
    });
  });

  describe("getTeamPlayerValuesController", () => {
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

      mockRequest.params = { season: "14", team: "1" };
      mockSortterModels.getTeamPlayerValuesForSortter.mockResolvedValue(
        mockPlayerValues
      );

      await getTeamPlayerValuesController(
        mockRequest as RequestWithParams<{ season: string; team: string }>,
        mockResponse as Response
      );

      expect(
        mockSortterModels.getTeamPlayerValuesForSortter
      ).toHaveBeenCalledWith(14, 1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockPlayerValues);
    });

    it("should return 404 if no players found", async () => {
      mockRequest.params = { season: "14", team: "999" };
      mockSortterModels.getTeamPlayerValuesForSortter.mockResolvedValue([]);

      await getTeamPlayerValuesController(
        mockRequest as RequestWithParams<{ season: string; team: string }>,
        mockResponse as Response
      );

      expect(
        mockSortterModels.getTeamPlayerValuesForSortter
      ).toHaveBeenCalledWith(14, 999);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "No players found for team 999 in season 14"
      });
    });
  });
});
