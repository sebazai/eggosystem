import { type Response } from "express";
import {
  getSeasonsController,
  getSeasonByIdController,
  getSeasonDetailsByIdController,
  getActiveSeasonForApp,
  getActiveSignupSeasonForApp,
  getActiveSignupOrActiveSeasonForAppController
} from "../seasons.controllers";
import {
  getSeasons,
  getSeasonById,
  getSeasonDetailsById,
  getActiveOrLatestSeasonForAppId,
  getActiveSignupSeasonForAppId,
  getActiveSignupOrActiveSeasonForAppId
} from "../../models/season.models";
import { redisClient } from "../../utils/redisClient";
import type {
  ActiveSignupOrSeasonForAppId,
  RequestWithParams
} from "@eggosystem/types";
import type { Season, SeasonDetails } from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";

// Mock the models and Redis
jest.mock("../../models/season.models");
jest.mock("../../utils/redisClient");

const mockGetSeasons = getSeasons as jest.MockedFunction<typeof getSeasons>;
const mockGetSeasonById = getSeasonById as jest.MockedFunction<
  typeof getSeasonById
>;
const mockGetSeasonDetailsById = getSeasonDetailsById as jest.MockedFunction<
  typeof getSeasonDetailsById
>;
const mockGetActiveOrLatestSeasonForAppId =
  getActiveOrLatestSeasonForAppId as jest.MockedFunction<
    typeof getActiveOrLatestSeasonForAppId
  >;
const mockGetActiveSignupSeasonForAppId =
  getActiveSignupSeasonForAppId as jest.MockedFunction<
    typeof getActiveSignupSeasonForAppId
  >;
const mockGetActiveSignupOrActiveSeasonForAppId =
  getActiveSignupOrActiveSeasonForAppId as jest.MockedFunction<
    typeof getActiveSignupOrActiveSeasonForAppId
  >;
const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;

// Test data objects
const mockSeason = {
  id: 123,
  game_id: 1,
  name: "Test Season",
  full_name: "Test Season Full Name",
  signup_start_date: "2024-01-01",
  signup_end_date: "2024-12-31",
  platform: SeasonPlatform.FACEIT,
  start_date: "2024-01-01",
  end_date: "2024-12-31"
} satisfies Season;

const mockSeasonDetails = {
  id: 123,
  game_id: 1,
  name: "Test Season",
  full_name: "Test Season Full Name",
  signup_start_date: "2024-01-01",
  signup_end_date: "2024-12-31",
  platform: SeasonPlatform.FACEIT,
  start_date: "2024-01-01",
  end_date: "2024-12-31",
  app_id: 730
} satisfies SeasonDetails;

const mockActiveSeason = {
  season_id: 456,
  platform: SeasonPlatform.FACEIT,
  signup_end_date: "2024-12-31",
  full_name: "Test Season Full Name"
} satisfies ActiveSignupOrSeasonForAppId;

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
      mockRequest.params = { id: "123" };
      mockGetSeasonById.mockResolvedValue(mockSeason);

      await getSeasonByIdController(
        mockRequest as TestRequestWithParams<{ id: string }>,
        mockResponse as Response
      );

      expect(mockGetSeasonById).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(mockSeason);
    });

    it("should return 404 for non-existent season", async () => {
      mockRequest.params = { id: "123" };
      mockGetSeasonById.mockResolvedValue(undefined);

      await getSeasonByIdController(
        mockRequest as TestRequestWithParams<{ id: string }>,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Season not found"
      });
    });

    it("should handle invalid season ID", async () => {
      mockRequest.params = { id: "invalid" };

      await getSeasonByIdController(
        mockRequest as TestRequestWithParams<{ id: string }>,
        mockResponse as Response
      );

      expect(mockGetSeasonById).toHaveBeenCalledWith(NaN);
    });

    it("should handle negative season ID", async () => {
      mockRequest.params = { id: "-123" };

      await getSeasonByIdController(
        mockRequest as TestRequestWithParams<{ id: string }>,
        mockResponse as Response
      );

      expect(mockGetSeasonById).toHaveBeenCalledWith(-123);
    });

    it("should handle zero season ID", async () => {
      mockRequest.params = { id: "0" };

      await getSeasonByIdController(
        mockRequest as TestRequestWithParams<{ id: string }>,
        mockResponse as Response
      );

      expect(mockGetSeasonById).toHaveBeenCalledWith(0);
    });
  });

  describe("getSeasonDetailsByIdController", () => {
    it("should return season details for valid ID", async () => {
      mockRequest.params = { id: "123" };
      mockGetSeasonDetailsById.mockResolvedValue(mockSeasonDetails);

      await getSeasonDetailsByIdController(
        mockRequest as TestRequestWithParams<{ id: string }>,
        mockResponse as Response
      );

      expect(mockGetSeasonDetailsById).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(mockSeasonDetails);
    });

    it("should return 404 for non-existent season details", async () => {
      mockRequest.params = { id: "123" };
      mockGetSeasonDetailsById.mockResolvedValue(undefined);

      await getSeasonDetailsByIdController(
        mockRequest as TestRequestWithParams<{ id: string }>,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Season not found"
      });
    });

    it("should handle invalid season details ID", async () => {
      mockRequest.params = { id: "invalid" };

      await getSeasonDetailsByIdController(
        mockRequest as TestRequestWithParams<{ id: string }>,
        mockResponse as Response
      );

      expect(mockGetSeasonDetailsById).toHaveBeenCalledWith(NaN);
    });

    it("should handle negative season details ID", async () => {
      mockRequest.params = { id: "-123" };

      await getSeasonDetailsByIdController(
        mockRequest as TestRequestWithParams<{ id: string }>,
        mockResponse as Response
      );

      expect(mockGetSeasonDetailsById).toHaveBeenCalledWith(-123);
    });
  });

  describe("getActiveSeasonForApp", () => {
    it("should return cached season if available", async () => {
      mockRequest.params = { app_id: "730" };
      mockRedisClient.get.mockResolvedValue("456");

      await getActiveSeasonForApp(
        mockRequest as TestRequestWithParams<{ app_id: string }>,
        mockResponse as Response
      );

      expect(mockRedisClient.get).toHaveBeenCalledWith("730-active-season");
      expect(mockSet).toHaveBeenCalledWith(
        "Cache-Control",
        "public, max-age=86400"
      );
      expect(mockJson).toHaveBeenCalledWith({ season_id: 456 });
    });

    it("should fetch and cache season if not cached", async () => {
      mockRequest.params = { app_id: "730" };
      mockRedisClient.get.mockResolvedValue(null);
      mockGetActiveOrLatestSeasonForAppId.mockResolvedValue(mockActiveSeason);

      await getActiveSeasonForApp(
        mockRequest as TestRequestWithParams<{ app_id: string }>,
        mockResponse as Response
      );

      expect(mockGetActiveOrLatestSeasonForAppId).toHaveBeenCalledWith(730);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "730-active-season",
        456,
        "EX",
        2592000
      );
      expect(mockSet).toHaveBeenCalledWith(
        "Cache-Control",
        "public, max-age=86400"
      );
      expect(mockJson).toHaveBeenCalledWith(mockActiveSeason);
    });

    it("should return 404 when no active season found", async () => {
      mockRequest.params = { app_id: "730" };
      mockRedisClient.get.mockResolvedValue(null);
      mockGetActiveOrLatestSeasonForAppId.mockResolvedValue(undefined);

      await getActiveSeasonForApp(
        mockRequest as TestRequestWithParams<{ app_id: string }>,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "No active season found for app"
      });
    });

    it("should handle invalid app ID", async () => {
      mockRequest.params = { app_id: "invalid" };

      await getActiveSeasonForApp(
        mockRequest as TestRequestWithParams<{ app_id: string }>,
        mockResponse as Response
      );

      expect(mockGetActiveOrLatestSeasonForAppId).toHaveBeenCalledWith(NaN);
    });
  });

  describe("getActiveSignupSeasonForApp", () => {
    it("should return 404 when no active signup season found", async () => {
      mockRequest.params = { app_id: "730" };
      mockGetActiveSignupSeasonForAppId.mockResolvedValue(undefined);

      await getActiveSignupSeasonForApp(
        mockRequest as TestRequestWithParams<{ app_id: string }>,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "No active signup season found for app"
      });
    });

    it("should handle invalid app ID", async () => {
      mockRequest.params = { app_id: "invalid" };

      await getActiveSignupSeasonForApp(
        mockRequest as TestRequestWithParams<{ app_id: string }>,
        mockResponse as Response
      );

      expect(mockGetActiveSignupSeasonForAppId).toHaveBeenCalledWith(NaN);
    });
  });

  describe("GetActiveSignupOrActiveSeasonForAppId", () => {
    it("should return undefined when no signup end date found", async () => {
      mockRequest.params = { app_id: "730" };
      mockGetActiveSignupOrActiveSeasonForAppId.mockResolvedValue(undefined);

      await getActiveSignupOrActiveSeasonForAppController(
        mockRequest as TestRequestWithParams<{ app_id: string }>,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith(undefined);
    });

    it("should return season when found", async () => {
      mockRequest.params = { app_id: "730" };
      mockGetActiveSignupOrActiveSeasonForAppId.mockResolvedValue(
        mockActiveSeason
      );

      await getActiveSignupOrActiveSeasonForAppController(
        mockRequest as TestRequestWithParams<{ app_id: string }>,
        mockResponse as Response
      );

      expect(mockGetActiveSignupOrActiveSeasonForAppId).toHaveBeenCalledWith(
        730
      );
      expect(mockJson).toHaveBeenCalledWith(mockActiveSeason);
    });

    it("should handle invalid app ID", async () => {
      mockRequest.params = { app_id: "invalid" };

      await getActiveSignupOrActiveSeasonForAppController(
        mockRequest as TestRequestWithParams<{ app_id: string }>,
        mockResponse as Response
      );

      expect(mockGetActiveSignupOrActiveSeasonForAppId).toHaveBeenCalledWith(
        NaN
      );
    });

    it("should handle negative app ID", async () => {
      mockRequest.params = { app_id: "-730" };

      await getActiveSignupOrActiveSeasonForAppController(
        mockRequest as TestRequestWithParams<{ app_id: string }>,
        mockResponse as Response
      );

      expect(mockGetActiveSignupOrActiveSeasonForAppId).toHaveBeenCalledWith(
        -730
      );
    });
  });
});
