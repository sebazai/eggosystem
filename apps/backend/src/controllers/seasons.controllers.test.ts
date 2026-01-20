import { type Response } from "express";
import {
  getSeasonsController,
  getSeasonByIdController,
  getSeasonDetailsByIdController,
  getTeamCaptainsBySeasonIdController
} from "./seasons.controllers";
import {
  getSeasons,
  getSeasonById,
  getSeasonDetailsById
} from "../models/season.models";
import { getTeamCaptainsBySeasonId } from "../models/team.models";
import type { RequestWithParams } from "@eggosystem/types";
import type { Season, SeasonDetails } from "@eggosystem/types";
import { SeasonPlatform, createMockSeason } from "@eggosystem/types";

// Mock the models and Redis
jest.mock("../models/season.models");
jest.mock("../utils/redisClient");
jest.mock("../db/mysqlRunQuery");
jest.mock("../services/season.services");
jest.mock("../models/team.models");

const mockGetTeamCaptainsBySeasonId =
  getTeamCaptainsBySeasonId as jest.MockedFunction<
    typeof getTeamCaptainsBySeasonId
  >;

const mockGetSeasons = getSeasons as jest.MockedFunction<typeof getSeasons>;
const mockGetSeasonById = getSeasonById as jest.MockedFunction<
  typeof getSeasonById
>;
const mockGetSeasonDetailsById = getSeasonDetailsById as jest.MockedFunction<
  typeof getSeasonDetailsById
>;

// Test data objects
const mockSeason = createMockSeason({
  id: 123,
  name: "Test Season",
  full_name: "Test Season Full Name",
  signup_end_date: "2024-12-31",
  platform: SeasonPlatform.FACEIT,
  start_date: "2024-01-01",
  end_date: "2024-12-31"
});

const mockSeasonDetails = {
  ...mockSeason,
  app_id: 730
} satisfies SeasonDetails;

const mockSeasons = [mockSeason] satisfies Season[];

// Type definitions for test requests
type TestRequestWithParams<P = Record<string, string>> =
  RequestWithParams<P> & {
    parsedParams?: Record<string, unknown>;
  };

describe("Seasons Controllers", () => {
  let mockRequest: TestRequestWithParams;
  let mockResponse: Response;
  let mockJson: jest.MockedFunction<Response["json"]>;
  let mockStatus: jest.MockedFunction<Response["status"]>;
  let mockSet: jest.MockedFunction<Response["set"]>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      parsedParams: {}
    } as TestRequestWithParams;

    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    mockSet = jest.fn().mockReturnThis();

    mockResponse = {
      json: mockJson,
      status: mockStatus,
      set: mockSet
    } as unknown as Response;

    jest.clearAllMocks();
  });

  describe("getSeasonsController", () => {
    it("should return all seasons", async () => {
      mockGetSeasons.mockResolvedValue(mockSeasons);

      await getSeasonsController(
        mockRequest as TestRequestWithParams,
        mockResponse as Response
      );

      expect(mockGetSeasons).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(mockSeasons);
    });

    it("should handle empty seasons list", async () => {
      mockGetSeasons.mockResolvedValue([]);

      await getSeasonsController(
        mockRequest as TestRequestWithParams,
        mockResponse as Response
      );

      expect(mockGetSeasons).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith([]);
    });
  });

  describe("getSeasonByIdController", () => {
    it("should return season for valid ID", async () => {
      mockRequest.params = { season_id: "123" };
      mockGetSeasonById.mockResolvedValue(mockSeason);

      const mockNext = jest.fn();
      await getSeasonByIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetSeasonById).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(mockSeason);
    });

    it("should return 404 for non-existent season", async () => {
      mockRequest.params = { season_id: "123" };
      mockGetSeasonById.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await getSeasonByIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Season not found",
          status: 404
        })
      );
    });

    it("should handle invalid season ID", async () => {
      mockRequest.params = { season_id: "invalid" };
      mockGetSeasonById.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await getSeasonByIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetSeasonById).toHaveBeenCalledWith(NaN);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Season not found",
          status: 404
        })
      );
    });

    it("should handle negative season ID", async () => {
      mockRequest.params = { season_id: "-123" };
      mockGetSeasonById.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await getSeasonByIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetSeasonById).toHaveBeenCalledWith(-123);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Season not found",
          status: 404
        })
      );
    });

    it("should handle zero season ID", async () => {
      mockRequest.params = { season_id: "0" };
      mockGetSeasonById.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await getSeasonByIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetSeasonById).toHaveBeenCalledWith(0);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Season not found",
          status: 404
        })
      );
    });
  });

  describe("getSeasonDetailsByIdController", () => {
    it("should return season details for valid ID", async () => {
      mockRequest.params = { season_id: "123" };
      mockGetSeasonDetailsById.mockResolvedValue(mockSeasonDetails);

      const mockNext = jest.fn();
      await getSeasonDetailsByIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetSeasonDetailsById).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(mockSeasonDetails);
    });

    it("should return 404 for non-existent season details", async () => {
      mockRequest.params = { season_id: "123" };
      mockGetSeasonDetailsById.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await getSeasonDetailsByIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Season not found",
          status: 404
        })
      );
    });

    it("should handle invalid season details ID", async () => {
      mockRequest.params = { season_id: "invalid" };
      mockGetSeasonDetailsById.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await getSeasonDetailsByIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetSeasonDetailsById).toHaveBeenCalledWith(NaN);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Season not found",
          status: 404
        })
      );
    });

    it("should handle negative season details ID", async () => {
      mockRequest.params = { season_id: "-123" };
      mockGetSeasonDetailsById.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await getSeasonDetailsByIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetSeasonDetailsById).toHaveBeenCalledWith(-123);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Season not found",
          status: 404
        })
      );
    });
  });

  describe("getTeamCaptainsBySeasonIdController", () => {
    it("should return captains for specific season ID", async () => {
      const mockCaptains = [
        {
          team_id: 1650,
          team_name: "Team Alpha",
          captain_discord: "enzoj#1234",
          co_captain_discord: "co1#5678"
        },
        {
          team_id: 1651,
          team_name: "Team Beta",
          captain_discord: "captain2#1234",
          co_captain_discord: null
        }
      ];

      mockRequest.params = { season_id: "14" };
      mockGetTeamCaptainsBySeasonId.mockResolvedValue(mockCaptains);

      await getTeamCaptainsBySeasonIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response
      );

      expect(mockGetTeamCaptainsBySeasonId).toHaveBeenCalledWith(14);
      expect(mockJson).toHaveBeenCalledWith(mockCaptains);

      // Specific test: team 1650 captain should be enzoj
      const team1650 = mockCaptains.find((captain) => captain.team_id === 1650);
      expect(team1650).toBeDefined();
      expect(team1650?.team_name).toBe("Team Alpha");
      expect(team1650?.captain_discord).toBe("enzoj#1234");
    });

    it("should return empty array for season with no captains", async () => {
      mockRequest.params = { season_id: "999" };
      mockGetTeamCaptainsBySeasonId.mockResolvedValue([]);

      await getTeamCaptainsBySeasonIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response
      );

      expect(mockGetTeamCaptainsBySeasonId).toHaveBeenCalledWith(999);
      expect(mockJson).toHaveBeenCalledWith([]);
    });
  });
});
