import { type Response, type Request, type NextFunction } from "express";
import request from "supertest";
import { app } from "../app";
import {
  getTeamValuesController,
  getTeamValueByIdController,
  getTeamPlayerValuesController
} from "./sortter.controllers";
import * as sortterModels from "../models/sortter.models";
import {
  type TeamSortterValues,
  type RequestWithParams
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { getTeamValuesForSorter } from "../models/sortter.models";

// Mock express-jwt middleware to recognize our test token
jest.mock("express-jwt", () => ({
  expressjwt: jest.fn(
    () => (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const token = authHeader.split(" ")[1];

      // Recognize our mock-access-token as valid
      if (token === "mock-access-token") {
        req.auth = {
          account_id: 15004,
          provider_id: "66561198999999902",
          provider: "steam",
          permissions: ["admin:all"],
          roles: ["admin"],
          nickname: "heppajpg"
        };
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    }
  )
}));

// Mock auth middleware
jest.mock("../middlewares/auth.middleware", () => ({
  authenticateJWT: jest.fn(
    (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const token = authHeader.split(" ")[1];
      if (token === "mock-access-token") {
        req.auth = {
          account_id: 15004,
          provider_id: "66561198999999902",
          provider: "steam",
          permissions: ["admin:all"],
          roles: ["admin"],
          nickname: "heppajpg"
        };
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    }
  ),
  checkJWTPermissions: jest.fn(
    () => (req: Request, res: Response, next: NextFunction) => {
      // Allow admin role through
      if (req.auth && req.auth.roles && req.auth.roles.includes("admin")) {
        next();
      } else {
        res
          .status(403)
          .json({ error: { message: "Forbidden: Insufficient permissions" } });
      }
    }
  ),
  checkPermissions: jest.fn(
    () => (req: Request, res: Response, next: NextFunction) => {
      // Allow admin role through
      if (req.auth && req.auth.roles && req.auth.roles.includes("admin")) {
        next();
      } else {
        res
          .status(403)
          .json({ error: { message: "Forbidden: Insufficient permissions" } });
      }
    }
  )
}));

// Mock the model functions
jest.mock("../models/sortter.models");
jest.mock("../db/mysqlRunQuery");
const mockedRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetTeamValuesForSorter =
  getTeamValuesForSorter as jest.MockedFunction<typeof getTeamValuesForSorter>;

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
            top5_values: [20, 20, 20, 20, 20]
          }
        ];

        mockRequest.params = { season_id: "1" };
        mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
        mockSortterModels.getTeamValuesForSorter.mockResolvedValue(
          mockTeamValues
        );

        await getTeamValuesController(
          mockRequest as RequestWithParams<{ season_id: string }>,
          mockResponse as Response
        );

        expect(mockSortterModels.getTeamValuesForSorter).toHaveBeenCalledWith(
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
            top5_values: [20, 20, 20, 20, 20]
          }
        ];

        mockRequest.params = { season_id: "1", team_id: "1" };
        mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
        mockSortterModels.getTeamValuesForSorter.mockResolvedValue(
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

        expect(mockSortterModels.getTeamValuesForSorter).toHaveBeenCalledWith(
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
            top5_values: [20, 20, 20, 20, 20]
          }
        ];

        mockRequest.params = { season_id: "1", team_id: "2" };
        mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
        mockSortterModels.getTeamValuesForSorter.mockResolvedValue(
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

        expect(mockSortterModels.getTeamValuesForSorter).toHaveBeenCalledWith(
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
            steamid: "76561197960383236",
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

  // Integration Tests
  describe("Integration Tests", () => {
    describe("GET /api/v1/dashboard/sortter/season/:season/teams", () => {
      it("should return team values for a given season", async () => {
        // Mock data setup
        const mockTeamValues = [
          {
            team_id: 2053,
            team_name: "CSKeisari",
            team_logo: "logo_url_1",
            league_name: "League 1",
            top5_sum: 1418,
            avg4: 288.75,
            top5_values: [300, 295, 285, 275, 263]
          }
        ];

        mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
        mockGetTeamValuesForSorter.mockResolvedValue(mockTeamValues);

        // Make request to the endpoint with authentication
        const response = await request(app)
          .get("/api/v1/dashboard/sortter/season/14/teams")
          .set("Authorization", "Bearer mock-access-token");

        // Verify response
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockTeamValues);

        // Verify model function was called with correct season ID
        expect(mockGetTeamValuesForSorter).toHaveBeenCalledWith(14);
      });

      it("should handle invalid season ID parameter", async () => {
        // Make request with invalid season ID
        const response = await request(app)
          .get("/api/v1/dashboard/sortter/season/invalid")
          .set("Authorization", "Bearer mock-access-token");

        // Verify response indicates not found (invalid season ID results in 404, not 400)
        expect(response.status).toBe(404);
      });
    });

    describe("GET /api/v1/dashboard/sortter/season/:season/team/:team", () => {
      it("should get a specific team by ID", async () => {
        // Mock data setup
        const mockTeamValues = [
          {
            team_id: 2053,
            team_name: "CSKeisari",
            team_logo: "logo_url_1",
            league_name: "League 1",
            top5_sum: 1418,
            avg4: 288.75,
            top5_values: [300, 295, 285, 275, 263]
          },
          {
            team_id: 2054,
            team_name: "TeamTwo",
            team_logo: "logo_url_2",
            league_name: "League 2",
            top5_sum: 1000,
            avg4: 200.0,
            top5_values: [250, 250, 250, 250, 0]
          }
        ];

        mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
        mockGetTeamValuesForSorter.mockResolvedValue(mockTeamValues);

        // Make request to the endpoint with authentication
        const response = await request(app)
          .get("/api/v1/dashboard/sortter/season/14/team/2053")
          .set("Authorization", "Bearer mock-access-token");

        // Verify response
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockTeamValues[0]);

        // Verify model function was called with correct season ID
        expect(mockGetTeamValuesForSorter).toHaveBeenCalledWith(14);
      });

      it("should handle team not found", async () => {
        // Mock empty data
        mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
        mockGetTeamValuesForSorter.mockResolvedValue([]);

        // Make request with valid season but non-existent team
        const response = await request(app)
          .get("/api/v1/dashboard/sortter/season/14/team/9999")
          .set("Authorization", "Bearer mock-access-token");

        // Verify response indicates not found
        expect(response.status).toBe(404);
        expect(response.body).toEqual({
          type: "about:blank",
          title: "Not Found",
          status: 404,
          detail: "Team with ID 9999 not found for season 14",
          instance: "/api/v1/dashboard/sortter/season/14/team/9999"
        });
      });
    });
  });
});
