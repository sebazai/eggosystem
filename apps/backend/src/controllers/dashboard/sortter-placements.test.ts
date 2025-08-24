import { type Response } from "express";
import {
  savePreliminaryPlacementsController,
  getPreliminaryPlacementsController
} from "./sortter-placements.controllers";
import * as sortterPlacementsServices from "../../services/sortter-placements.services";
import { runQuery } from "../../db/mysqlRunQuery";
import { getTeamValuesForSorter } from "../../models/sortter.models";
import type {
  RequestWithParamsAndBody,
  RequestWithParamsAndQuery,
  RequestWithParamsAndQueryAndBody
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
  let mockRequest: Partial<
    RequestWithParamsAndQueryAndBody<
      { season_id: string },
      { teams_per_division: string },
      { placements: TestPlacement[] }
    >
  >;
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

      const mockNext = jest.fn();
      await savePreliminaryPlacementsController(
        mockRequest as RequestWithParamsAndBody<
          { season_id: string },
          { placements: TestPlacement[] }
        >,
        mockResponse as Response,
        mockNext
      );

      // Verify the service was called
      expect(mockedIsPlacementsFinalized).toHaveBeenCalledWith(14);
      expect(mockedSavePreliminaryPlacements).toHaveBeenCalledWith(
        14,
        mockRequest.body?.placements
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

      const mockNext = jest.fn();
      await savePreliminaryPlacementsController(
        mockRequest as RequestWithParamsAndBody<
          { season_id: string },
          { placements: TestPlacement[] }
        >,
        mockResponse as Response,
        mockNext
      );

      // Verify the service was called
      expect(mockedIsPlacementsFinalized).toHaveBeenCalledWith(14);

      // Verify the response
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Placements have been finalized and cannot be modified",
          status: 403
        })
      );
    });

    it("should return 400 if placements is not an array", async () => {
      mockRequest.body = {
        placements: "not an array" as unknown as TestPlacement[]
      };

      const mockNext = jest.fn();
      await savePreliminaryPlacementsController(
        mockRequest as RequestWithParamsAndBody<
          { season_id: string },
          { placements: TestPlacement[] }
        >,
        mockResponse as Response,
        mockNext
      );

      // Verify the response
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Placements must be an array",
          status: 400
        })
      );
    });

    it("should handle service errors", async () => {
      // Mock the services to throw an error
      mockedIsPlacementsFinalized.mockResolvedValue(false);
      mockedSavePreliminaryPlacements.mockRejectedValue(
        new Error("Database error")
      );

      const mockNext = jest.fn();
      await savePreliminaryPlacementsController(
        mockRequest as RequestWithParamsAndBody<
          { season_id: string },
          { placements: TestPlacement[] }
        >,
        mockResponse as Response,
        mockNext
      );

      // Verify the response
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Failed to save preliminary placements",
          status: 500
        })
      );
    });
  });

  describe("getPreliminaryPlacementsController", () => {
    beforeEach(() => {
      mockRequest = {
        params: { season_id: "14" },
        query: { teams_per_division: "12" },
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

      const mockNext = jest.fn();
      await getPreliminaryPlacementsController(
        mockRequest as RequestWithParamsAndQuery<
          {
            season_id: string;
          },
          { teams_per_division: string }
        >,
        mockResponse as Response,
        mockNext
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
          orig4: 100,
          top5_values: [100, 95, 90, 85, 80],
          top5_offered_values: [100, 95, 90, 85, 80],
          is_flagged: false
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
            league_id: 1,
            tier: 1
          }
        ]);
      mockedGetTeamValuesForSorter.mockResolvedValue(mockTeamValues);

      const mockNext = jest.fn();
      await getPreliminaryPlacementsController(
        mockRequest as RequestWithParamsAndQuery<
          {
            season_id: string;
          },
          { teams_per_division: string }
        >,
        mockResponse as Response,
        mockNext
      );

      // Verify the response
      expect(mockResponse.json).toHaveBeenCalledWith({
        placements: [
          {
            team_id: 1,
            team_name: "Test Team 1",
            division: 1,
            comments: "Test comment",
            original_avg: 100,
            original_position: 0
          }
        ],
        isFinalized: true
      });
    });
  });
});
