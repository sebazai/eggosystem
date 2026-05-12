import { type Response } from "express";
import { getOrganizerActiveSeasonForAppId } from "../models/season.models";
import { redisClient } from "../utils/redisClient";
import type { RequestWithParams } from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";
import {
  getActiveSeasonForApp,
  redirectToActiveSignup
} from "./organizer.controllers";

// Mock the models and Redis
jest.mock("../models/season.models");
jest.mock("../models/game.models");
jest.mock("../utils/redisClient");

const mockGetActiveSeason =
  getOrganizerActiveSeasonForAppId as jest.MockedFunction<
    typeof getOrganizerActiveSeasonForAppId
  >;
const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;

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
  let mockRedirect: jest.MockedFunction<Response["redirect"]>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      parsedParams: {}
    } as TestRequestWithParams;

    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    mockSet = jest.fn().mockReturnThis();
    mockRedirect = jest.fn().mockReturnThis();

    mockResponse = {
      json: mockJson,
      status: mockStatus,
      set: mockSet,
      redirect: mockRedirect
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
  });

  describe("redirectToActiveSignup", () => {
    const originalEnv = process.env.FRONTEND_URL;

    beforeEach(() => {
      process.env.FRONTEND_URL = "https://example.com";
    });

    afterEach(() => {
      process.env.FRONTEND_URL = originalEnv;
    });

    it("should redirect to signup page when active season is found", async () => {
      mockRequest.params = { app_id: "730", organizer_id: "1" };
      mockRequest.query = { gametype: "comp" };
      mockGetActiveSeason.mockResolvedValue({
        season_id: 123,
        platform: SeasonPlatform.Kanaliiga,
        signup_end_date: "2024-12-31T23:59:59Z",
        full_name: "Test Season"
      });

      const mockNext = jest.fn();
      await redirectToActiveSignup(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }> & { query: { gametype?: string } },
        mockResponse as Response,
        mockNext
      );

      expect(mockGetActiveSeason).toHaveBeenCalledWith(1, 730, "comp");
      expect(mockRedirect).toHaveBeenCalledWith(
        "https://example.com/seasons/123/signup"
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle case-insensitive gametype", async () => {
      mockRequest.params = { app_id: "730", organizer_id: "1" };
      mockRequest.query = { gametype: "Comp" };
      mockGetActiveSeason.mockResolvedValue({
        season_id: 123,
        platform: SeasonPlatform.Kanaliiga,
        signup_end_date: "2024-12-31T23:59:59Z",
        full_name: "Test Season"
      });

      const mockNext = jest.fn();
      await redirectToActiveSignup(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }> & { query: { gametype?: string } },
        mockResponse as Response,
        mockNext
      );

      expect(mockGetActiveSeason).toHaveBeenCalledWith(1, 730, "Comp");
      expect(mockRedirect).toHaveBeenCalledWith(
        "https://example.com/seasons/123/signup"
      );
    });

    it("should use default gametype when gametype is missing", async () => {
      const testRequest = {
        params: { app_id: "730", organizer_id: "1" },
        query: { gametype: undefined }
      } as TestRequestWithParams<{
        app_id: string;
        organizer_id: string;
      }> & { query: { gametype?: string } };

      mockGetActiveSeason.mockResolvedValue({
        season_id: 123,
        platform: SeasonPlatform.Kanaliiga,
        signup_end_date: "2024-12-31T23:59:59Z",
        full_name: "Test Season"
      });

      const mockNext = jest.fn();
      await redirectToActiveSignup(
        testRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetActiveSeason).toHaveBeenCalledWith(1, 730, "comp");
      expect(mockRedirect).toHaveBeenCalledWith(
        "https://example.com/seasons/123/signup"
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 404 when default gametype season is not found", async () => {
      const testRequest = {
        params: { app_id: "730", organizer_id: "1" },
        query: { gametype: undefined }
      } as TestRequestWithParams<{
        app_id: string;
        organizer_id: string;
      }> & { query: { gametype?: string } };

      mockGetActiveSeason.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await redirectToActiveSignup(
        testRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetActiveSeason).toHaveBeenCalledWith(1, 730, "comp");
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "No active signup season found for app 730, organizer 1, and game type 'comp'",
          status: 404
        })
      );
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("should return 404 when gametype is empty string and season not found", async () => {
      const testRequest = {
        params: { app_id: "730", organizer_id: "1" },
        query: { gametype: "" }
      } as TestRequestWithParams<{
        app_id: string;
        organizer_id: string;
      }> & { query: { gametype?: string } };

      mockGetActiveSeason.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await redirectToActiveSignup(
        testRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetActiveSeason).toHaveBeenCalledWith(1, 730, "");
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "No active signup season found for app 730, organizer 1, and game type ''",
          status: 404
        })
      );
    });

    it("should return 404 when season is not found for gametype", async () => {
      mockRequest.params = { app_id: "730", organizer_id: "1" };
      mockRequest.query = { gametype: "invalid" };
      mockGetActiveSeason.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await redirectToActiveSignup(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }> & { query: { gametype?: string } },
        mockResponse as Response,
        mockNext
      );

      expect(mockGetActiveSeason).toHaveBeenCalledWith(1, 730, "invalid");
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "No active signup season found for app 730, organizer 1, and game type 'invalid'",
          status: 404
        })
      );
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("should return 404 when no active signup season is found", async () => {
      mockRequest.params = { app_id: "730", organizer_id: "1" };
      mockRequest.query = { gametype: "comp" };
      mockGetActiveSeason.mockResolvedValue(undefined);

      const mockNext = jest.fn();
      await redirectToActiveSignup(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }> & { query: { gametype?: string } },
        mockResponse as Response,
        mockNext
      );

      expect(mockGetActiveSeason).toHaveBeenCalledWith(1, 730, "comp");
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "No active signup season found for app 730, organizer 1, and game type 'comp'",
          status: 404
        })
      );
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("should return 400 when app_id is invalid", async () => {
      mockRequest.params = { app_id: "invalid", organizer_id: "1" };
      mockRequest.query = { gametype: "comp" };

      const mockNext = jest.fn();
      await redirectToActiveSignup(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }> & { query: { gametype?: string } },
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid app ID or organizer ID: app_id=NaN, organizer_id=1",
          status: 400
        })
      );
      expect(mockGetActiveSeason).not.toHaveBeenCalled();
    });

    it("should return 400 when organizer_id is invalid", async () => {
      mockRequest.params = { app_id: "730", organizer_id: "invalid" };
      mockRequest.query = { gametype: "comp" };

      const mockNext = jest.fn();
      await redirectToActiveSignup(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }> & { query: { gametype?: string } },
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "Invalid app ID or organizer ID: app_id=730, organizer_id=NaN",
          status: 400
        })
      );
    });

    it("should return 400 when app_id is negative", async () => {
      mockRequest.params = { app_id: "-730", organizer_id: "1" };
      mockRequest.query = { gametype: "comp" };

      const mockNext = jest.fn();
      await redirectToActiveSignup(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }> & { query: { gametype?: string } },
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "Invalid app ID or organizer ID: app_id=-730, organizer_id=1",
          status: 400
        })
      );
    });

    it("should return 400 when organizer_id is negative", async () => {
      mockRequest.params = { app_id: "730", organizer_id: "-1" };
      mockRequest.query = { gametype: "comp" };

      const mockNext = jest.fn();
      await redirectToActiveSignup(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }> & { query: { gametype?: string } },
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "Invalid app ID or organizer ID: app_id=730, organizer_id=-1",
          status: 400
        })
      );
    });

    it("should return error when FRONTEND_URL is not set", async () => {
      delete process.env.FRONTEND_URL;
      mockRequest.params = { app_id: "730", organizer_id: "1" };
      mockRequest.query = { gametype: "comp" };
      mockGetActiveSeason.mockResolvedValue({
        season_id: 123,
        platform: SeasonPlatform.Kanaliiga,
        signup_end_date: "2024-12-31T23:59:59Z",
        full_name: "Test Season"
      });

      const mockNext = jest.fn();
      await redirectToActiveSignup(
        mockRequest as TestRequestWithParams<{
          app_id: string;
          organizer_id: string;
        }> & { query: { gametype?: string } },
        mockResponse as Response,
        mockNext
      );

      expect(mockGetActiveSeason).toHaveBeenCalledWith(1, 730, "comp");
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "FRONTEND_URL environment variable is not set"
        })
      );
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });
});
