import { type Response } from "express";
import {
  getActiveOrLatestSeasonForAppId,
  getActiveSignupSeasonForAppId,
  getActiveSignupOrActiveSeasonForAppId
} from "../models/season.models";
import { redisClient } from "../utils/redisClient";
import type {
  ActiveSignupOrSeasonForAppId,
  RequestWithParams
} from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";
import {
  createMockActiveSignupOrSeasonForAppId,
  createMockOrganizer
} from "@eggosystem/types";
import {
  getActiveSeasonForApp,
  getActiveSignupOrActiveSeasonForAppController,
  getActiveSignupSeasonForApp
} from "./organizer.controllers";

// Mock the models and Redis
jest.mock("../models/season.models");
jest.mock("../utils/redisClient");

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

const mockActiveSeason = createMockActiveSignupOrSeasonForAppId({
  season_id: 456,
  platform: SeasonPlatform.FACEIT,
  signup_end_date: "2024-12-31",
  signup_start_date: "2024-12-01",
  start_date: "2024-12-31",
  end_date: "2025-03-31"
});

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
  describe("getActiveSeasonForApp", () => {
    it("should return cached season if available", async () => {
      mockRequest.params = { app_id: "730", organizer_id: "1" };
      mockRedisClient.get.mockResolvedValue("456");

      const mockNext = jest.fn();
      await getActiveSeasonForApp(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockRedisClient.get).toHaveBeenCalledWith("1-730-active-season");
      expect(mockJson).toHaveBeenCalledWith({ season_id: 456 });
    });

    it("should fetch and cache season if not cached", async () => {
      mockRequest.params = { app_id: "730", organizer_id: "1" };
      mockRedisClient.get.mockResolvedValue(null);
      mockGetActiveOrLatestSeasonForAppId.mockResolvedValue(mockActiveSeason);

      const mockNext = jest.fn();
      await getActiveSeasonForApp(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetActiveOrLatestSeasonForAppId).toHaveBeenCalledWith(1, 730);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "1-730-active-season",
        456,
        "EX",
        86400
      );
      expect(mockJson).toHaveBeenCalledWith(mockActiveSeason);
    });

    it("should return 404 when no active season found", async () => {
      mockRequest.params = { app_id: "730", organizer_id: "1" };
      mockRedisClient.get.mockResolvedValue(null);
      mockGetActiveOrLatestSeasonForAppId.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await getActiveSeasonForApp(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No active season found for app 730 and organizer 1",
          status: 404
        })
      );
    });

    it("should handle invalid app ID", async () => {
      mockRequest.params = { app_id: "invalid", organizer_id: "1" };
      mockGetActiveOrLatestSeasonForAppId.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await getActiveSeasonForApp(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetActiveOrLatestSeasonForAppId).toHaveBeenCalledWith(1, NaN);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No active season found for app NaN and organizer 1",
          status: 404
        })
      );
    });
  });

  describe("getActiveSignupSeasonForApp", () => {
    it("should return 404 when no active signup season found", async () => {
      mockRequest.params = { app_id: "730", organizer_id: "1" };
      mockGetActiveSignupSeasonForAppId.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await getActiveSignupSeasonForApp(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No active signup season found for app 730 and organizer 1",
          status: 404
        })
      );
    });

    it("should handle invalid app ID", async () => {
      mockRequest.params = { app_id: "invalid", organizer_id: "invalid" };
      mockGetActiveSignupSeasonForAppId.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await getActiveSignupSeasonForApp(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetActiveSignupSeasonForAppId).toHaveBeenCalledWith(NaN, NaN);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "No active signup season found for app NaN and organizer NaN",
          status: 404
        })
      );
    });
  });

  describe("GetActiveSignupOrActiveSeasonForAppId", () => {
    const mockNext = jest.fn();
    it("should return undefined when no signup end date found", async () => {
      mockRequest.params = { app_id: "730", organizer_id: "1" };
      mockGetActiveSignupOrActiveSeasonForAppId.mockResolvedValue(undefined);

      await getActiveSignupOrActiveSeasonForAppController(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockJson).toHaveBeenCalledWith(undefined);
    });

    it("should return season when found", async () => {
      mockRequest.params = { app_id: "730", organizer_id: "1" };
      mockGetActiveSignupOrActiveSeasonForAppId.mockResolvedValue(
        mockActiveSeason
      );

      await getActiveSignupOrActiveSeasonForAppController(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetActiveSignupOrActiveSeasonForAppId).toHaveBeenCalledWith(
        1,
        730
      );
      expect(mockJson).toHaveBeenCalledWith(mockActiveSeason);
    });

    it("should handle invalid app ID", async () => {
      mockRequest.params = { app_id: "invalid", organizer_id: "1" };

      await getActiveSignupOrActiveSeasonForAppController(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }>,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockGetActiveSignupOrActiveSeasonForAppId
      ).not.toHaveBeenCalledWith(1, NaN);
    });

    it("should handle negative app ID", async () => {
      mockRequest.params = { app_id: "-730", organizer_id: "1" };

      await getActiveSignupOrActiveSeasonForAppController(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }>,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockGetActiveSignupOrActiveSeasonForAppId
      ).not.toHaveBeenCalledWith(1, -730);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "Invalid app ID or organizer ID: app_id=-730, organizer_id=1",
          status: 400
        })
      );
    });
  });
});
