import { type Response } from "express";
import {
  getTeamValuesController,
  getTeamValueByIdController,
  getTeamPlayerValuesController
} from "./sortter.controllers";
import * as sortterModels from "../../models/dashboard/sortter.models";
import {
  type TeamSortterValues,
  type RequestWithParams,
  IneligiblePlayerForValidationSteamId
} from "@eggosystem/types";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock the model functions
jest.mock("../../models/dashboard/sortter.models");
jest.mock("../../db/mysqlRunQuery");
const mockedRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

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
    jest.clearAllMocks();
  });

  // Unit Tests
  describe("Unit Tests", () => {
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
            orig4: 25,
            top5_values: [20, 20, 20, 20, 20],
            top5_offered_values: [20, 20, 20, 20, 20],
            is_flagged: false
          }
        ];

        mockRequest.params = { season_id: "1" };
        mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
        mockSortterModels.getTeamValuesForSortter.mockResolvedValue(
          mockTeamValues
        );

        await getTeamValuesController(
          mockRequest as RequestWithParams<{ season_id: string }>,
          mockResponse as Response
        );

        expect(mockSortterModels.getTeamValuesForSortter).toHaveBeenCalledWith(
          1
        );
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
            orig4: 25,
            top5_values: [20, 20, 20, 20, 20],
            top5_offered_values: [20, 20, 20, 20, 20],
            is_flagged: false
          }
        ];

        mockRequest.params = { season_id: "1", team_id: "1" };
        mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
        mockSortterModels.getTeamValuesForSortter.mockResolvedValue(
          mockTeamValues
        );

        const mockNext = jest.fn();

        await getTeamValueByIdController(
          mockRequest as RequestWithParams<{
            season_id: string;
            team_id: string;
          }>,
          mockResponse as Response,
          mockNext
        );

        expect(mockSortterModels.getTeamValuesForSortter).toHaveBeenCalledWith(
          1
        );
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
            orig4: 25,
            top5_values: [20, 20, 20, 20, 20],
            top5_offered_values: [20, 20, 20, 20, 20],
            is_flagged: false
          }
        ];

        mockRequest.params = { season_id: "1", team_id: "2" };
        mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
        mockSortterModels.getTeamValuesForSortter.mockResolvedValue(
          mockTeamValues
        );

        const mockNext = jest.fn();

        await getTeamValueByIdController(
          mockRequest as RequestWithParams<{
            season_id: string;
            team_id: string;
          }>,
          mockResponse as Response,
          mockNext
        );

        expect(mockSortterModels.getTeamValuesForSortter).toHaveBeenCalledWith(
          1
        );
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Team with ID 2 not found for season 1",
            status: 404
          })
        );
      });
    });

    describe("getTeamPlayerValuesController", () => {
      it("should return player values for a specific team and season", async () => {
        const mockPlayerValues = [
          {
            name: "toNppa",
            steamid: IneligiblePlayerForValidationSteamId,
            cs2_rank: 17690,
            faceit_level: 9,
            faceit_elo: 1954,
            hours: 3382,
            kanarating: 1.296875,
            fkd: 1.21,
            kana_elo: 1200,
            calculus: "A"
          }
        ];

        mockRequest.params = { season_id: "14", team_id: "1" };
        mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
        mockSortterModels.getTeamPlayerValuesForSortter.mockResolvedValue(
          mockPlayerValues
        );

        const mockNext = jest.fn();

        await getTeamPlayerValuesController(
          mockRequest as RequestWithParams<{
            season_id: string;
            team_id: string;
          }>,
          mockResponse as Response,
          mockNext
        );

        expect(
          mockSortterModels.getTeamPlayerValuesForSortter
        ).toHaveBeenCalledWith(14, 1);
        expect(mockResponse.json).toHaveBeenCalledWith(mockPlayerValues);
      });

      it("should return 404 if no players found", async () => {
        mockRequest.params = { season_id: "14", team_id: "999" };
        mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
        mockSortterModels.getTeamPlayerValuesForSortter.mockResolvedValue([]);

        const mockNext = jest.fn();

        await getTeamPlayerValuesController(
          mockRequest as RequestWithParams<{
            season_id: string;
            team_id: string;
          }>,
          mockResponse as Response,
          mockNext
        );

        expect(
          mockSortterModels.getTeamPlayerValuesForSortter
        ).toHaveBeenCalledWith(14, 999);
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "No players found for team 999 in season 14",
            status: 404
          })
        );
      });
    });
  });
});
