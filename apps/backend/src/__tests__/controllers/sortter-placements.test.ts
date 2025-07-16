import { type Request, type Response } from "express";
import {
  savePreliminaryPlacementsController,
  getPreliminaryPlacementsController
} from "../../controllers/sortter-placements.controllers";
import * as sortterPlacementsServices from "../../services/sortter-placements.services";
import { runQuery } from "../../db/mysqlRunQuery";
import { getTeamValuesForSorter } from "../../models/sortter.models";
import type {
  RequestWithParams,
  RequestWithParamsAndBody
} from "@eggosystem/types";

// Mock the database module
jest.mock("../../db/mysqlRunQuery");
const mockedRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

// Mock the services
jest.mock("../../services/sortter-placements.services");
jest.mock("../../models/sortter.models");
const mockedSavePreliminaryPlacements =
  sortterPlacementsServices.savePreliminaryPlacements as jest.MockedFunction<
    typeof sortterPlacementsServices.savePreliminaryPlacements
  >;
const mockedIsPlacementsFinalized =
  sortterPlacementsServices.isPlacementsFinalized as jest.MockedFunction<
    typeof sortterPlacementsServices.isPlacementsFinalized
  >;
const mockedGetTeamValuesForSorter =
  getTeamValuesForSorter as jest.MockedFunction<typeof getTeamValuesForSorter>;

// Type for test placements
type TestPlacement = {
  team_id: number;
  team_name: string;
  division: number;
  comments: string;
  original_avg: number;
  original_position: number;
};

describe("sortter-placements.controllers", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      params: { season_id: "14" },
      body: {
        placements: [
          {
            team_id: 1,
            team_name: "Test Team 1",
            division: 1,
            comments: "Test comment",
            original_avg: 100,
            original_position: 0
          }
        ]
      },
      auth: {
        account_id: 1,
        provider_id: "test",
        permissions: ["admin:access"],
        roles: ["admin"],
        nickname: "testuser",
        provider: "steam" as const
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe("savePreliminaryPlacementsController", () => {
    it("should save placements successfully for admin user", async () => {
      // Mock the services
      mockedIsPlacementsFinalized.mockResolvedValue(false);
      mockedSavePreliminaryPlacements.mockResolvedValue(true);

      await savePreliminaryPlacementsController(
        mockRequest as RequestWithParamsAndBody<
          { season_id: string },
          { placements: TestPlacement[] }
        >,
        mockResponse as Response
      );

      // Verify the service was called
      expect(mockedIsPlacementsFinalized).toHaveBeenCalledWith(14);
      expect(mockedSavePreliminaryPlacements).toHaveBeenCalledWith(
        14,
        mockRequest.body.placements
      );

      // Verify the response
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Preliminary placements saved successfully",
        season_id: 14
      });
    });

    it("should return 403 if placements are finalized", async () => {
      // Mock the services
      mockedIsPlacementsFinalized.mockResolvedValue(true);

      await savePreliminaryPlacementsController(
        mockRequest as RequestWithParamsAndBody<
          { season_id: string },
          { placements: TestPlacement[] }
        >,
        mockResponse as Response
      );

      // Verify the service was called
      expect(mockedIsPlacementsFinalized).toHaveBeenCalledWith(14);

      // Verify the response
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: "Placements have been finalized and cannot be modified"
        }
      });
    });

    it("should return 400 if placements is not an array", async () => {
      mockRequest.body = { placements: "not an array" };

      await savePreliminaryPlacementsController(
        mockRequest as RequestWithParamsAndBody<
          { season_id: string },
          { placements: TestPlacement[] }
        >,
        mockResponse as Response
      );

      // Verify the response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: { message: "Placements must be an array" }
      });
    });

    it("should handle service errors", async () => {
      // Mock the services to throw an error
      mockedIsPlacementsFinalized.mockResolvedValue(false);
      mockedSavePreliminaryPlacements.mockRejectedValue(
        new Error("Database error")
      );

      await savePreliminaryPlacementsController(
        mockRequest as RequestWithParamsAndBody<
          { season_id: string },
          { placements: TestPlacement[] }
        >,
        mockResponse as Response
      );

      // Verify the response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: { message: "Failed to save preliminary placements" }
      });
    });
  });

  describe("getPreliminaryPlacementsController", () => {
    beforeEach(() => {
      mockRequest = {
        params: { season_id: "14" },
        auth: {
          account_id: 1,
          provider_id: "test",
          permissions: ["admin:access"],
          roles: ["admin"],
          nickname: "testuser",
          provider: "steam" as const
        }
      };
    });

    it("should return existing placements from Redis", async () => {
      const mockPlacements = [
        {
          team_id: 1,
          team_name: "Test Team 1",
          division: 1,
          comments: "Test comment",
          original_avg: 100,
          original_position: 0
        }
      ];

      // Mock the services
      mockedIsPlacementsFinalized.mockResolvedValue(false);
      mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
      jest
        .spyOn(sortterPlacementsServices, "getPreliminaryPlacements")
        .mockResolvedValue(mockPlacements);

      await getPreliminaryPlacementsController(
        mockRequest as RequestWithParams<{ season_id: string }>,
        mockResponse as Response
      );

      // Verify the response
      expect(mockResponse.json).toHaveBeenCalledWith({
        placements: mockPlacements,
        isFinalized: false
      });
    });

    it("should return historical placements if they exist", async () => {
      const mockTeamValues = [
        {
          team_id: 1,
          team_name: "Test Team 1",
          team_logo: "test-logo.png",
          league_name: "Masters",
          top5_sum: 500,
          avg4: 100,
          top5_values: [100, 95, 90, 85, 80]
        }
      ];

      // Mock the services
      mockedIsPlacementsFinalized.mockResolvedValue(true);
      mockedRunQuery
        .mockResolvedValueOnce([{ count: 1 }]) // First query for count
        .mockResolvedValueOnce([
          {
            // Second query for teams with leagues
            team_id: 1,
            team_name: "Test Team 1",
            league_name: "Masters",
            league_id: 1
          }
        ]);
      mockedGetTeamValuesForSorter.mockResolvedValue(mockTeamValues);

      await getPreliminaryPlacementsController(
        mockRequest as RequestWithParams<{ season_id: string }>,
        mockResponse as Response
      );

      // Verify the response
      expect(mockResponse.json).toHaveBeenCalledWith({
        placements: [
          {
            team_id: 1,
            team_name: "Test Team 1",
            division: 1,
            comments: "",
            original_avg: 100,
            original_position: 0
          }
        ],
        isFinalized: true
      });
    });
  });
});
