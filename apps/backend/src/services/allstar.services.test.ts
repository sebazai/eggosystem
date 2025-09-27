import { sendDemoForAllStarPOTGClip } from "./allstar.services";
import { insertClipProcessing } from "../models/allstar.models";
import { logger } from "../utils/app-logger";

// Mock dependencies
jest.mock("../models/allstar.models");
jest.mock("../utils/app-logger");

const mockInsertClipProcessing = insertClipProcessing as jest.MockedFunction<
  typeof insertClipProcessing
>;
const mockLogger = logger as jest.Mocked<typeof logger>;

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper function to create mock responses
const createMockResponse = (overrides: Partial<Response> = {}) => {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(""),
    clone: jest.fn(),
    headers: new Headers(),
    redirected: false,
    type: "default" as ResponseType,
    url: "https://prt.allstar.gg/cs/clip/potg",
    ...overrides
  } as unknown as Response;
};

describe("sendDemoForAllStarPOTGClip", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.ALLSTAR_API_KEY = "test-api-key";
    process.env.BACKEND_URL = "https://test-backend.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("environment variable validation", () => {
    it("should return error when ALLSTAR_API_KEY is not set", async () => {
      delete process.env.ALLSTAR_API_KEY;

      const result = await sendDemoForAllStarPOTGClip(123, "https://demo.url");

      expect(result).toEqual({
        success: false,
        error: "ALLSTAR_API_KEY is not set"
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        "ALLSTAR_API_KEY is not set"
      );
    });

    it("should return error when BACKEND_URL is not set", async () => {
      delete process.env.BACKEND_URL;

      const result = await sendDemoForAllStarPOTGClip(123, "https://demo.url");

      expect(result).toEqual({
        success: false,
        error: "BACKEND_URL is not set"
      });
      expect(mockLogger.error).toHaveBeenCalledWith("BACKEND_URL is not set");
    });
  });

  describe("API request handling", () => {
    it("should return success when AllStar API responds successfully", async () => {
      const mockResponse = createMockResponse({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: "test-request-id" })
      });
      mockFetch.mockResolvedValue(mockResponse);
      mockInsertClipProcessing.mockResolvedValue(undefined);

      const result = await sendDemoForAllStarPOTGClip(123, "https://demo.url");

      expect(result).toEqual({
        success: true,
        requestId: "test-request-id",
        message: "Clip request submitted successfully"
      });

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      // The first argument is a Request object, so we need to check its URL property
      expect(callArgs[0].url).toBe("https://prt.allstar.gg/cs/clip/potg");
      expect(callArgs[0].method).toBe("POST");
      expect(callArgs[0].headers.get("X-API-Key")).toBe("test-api-key");
      expect(callArgs[0].headers.get("Content-Type")).toBe("application/json");

      // Parse the body to check the request data
      const bodyText = await callArgs[0].text();
      expect(JSON.parse(bodyText)).toEqual({
        demoUrl: "https://demo.url",
        webhookUrl: "https://test-backend.com/api/v1/allstar/webhook",
        metadata: [
          {
            key: "match_game_id",
            value: "123"
          }
        ]
      });

      expect(mockInsertClipProcessing).toHaveBeenCalledWith(123, "potg");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Sending clip request to AllStar.gg for matchGameId 123 with demoUrl https://demo.url and webhookUrl https://test-backend.com/api/v1/allstar/webhook"
      );
    });

    it("should return error when AllStar API returns non-ok response", async () => {
      const mockResponse = createMockResponse({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: jest.fn().mockResolvedValue("Invalid demo URL")
      });
      mockFetch.mockResolvedValue(mockResponse);

      const result = await sendDemoForAllStarPOTGClip(123, "https://demo.url");

      expect(result).toEqual({
        success: false,
        error: "HTTP 400: Bad Request",
        message: "Invalid demo URL"
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "AllStar API request failed",
        {
          status: 400,
          statusText: "Bad Request",
          error: "Invalid demo URL",
          matchGameId: 123
        }
      );

      // Should not call insertClipProcessing when API fails
      expect(mockInsertClipProcessing).not.toHaveBeenCalled();
    });

    it("should return error when fetch throws an exception", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await sendDemoForAllStarPOTGClip(123, "https://demo.url");

      expect(result).toEqual({
        success: false,
        error: "Network error"
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error sending demo to AllStar for game 123 with demoUrl https://demo.url",
        new Error("Network error")
      );

      // Should not call insertClipProcessing when fetch fails
      expect(mockInsertClipProcessing).not.toHaveBeenCalled();
    });
  });

  describe("database insertion handling", () => {
    it("should not continue with success even if database insert fails", async () => {
      const mockResponse = createMockResponse({
        ok: true,
        json: jest.fn().mockResolvedValue(new Error("Test")),
        text: jest.fn().mockResolvedValue("Errorer")
      });
      mockFetch.mockResolvedValue(mockResponse);
      mockInsertClipProcessing.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await sendDemoForAllStarPOTGClip(123, "https://demo.url");

      expect(result).toEqual({
        success: false,
        error:
          "Error parsing AllStar clip response for game 123 with response: Errorer",
        message:
          "Error parsing AllStar clip response for game 123 with response: Errorer"
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error parsing AllStar clip response for game 123 with response: Errorer",
        new Error("Database connection failed")
      );
    });
  });

  describe("transaction safety", () => {
    it("should never throw exceptions - all errors are handled gracefully", async () => {
      // Test various error scenarios
      const errorScenarios = [
        { name: "missing API key", env: { ALLSTAR_API_KEY: undefined } },
        { name: "missing backend URL", env: { BACKEND_URL: undefined } },
        {
          name: "network error",
          mockFetch: () =>
            mockFetch.mockRejectedValue(new Error("Network error"))
        },
        {
          name: "API error",
          mockFetch: () =>
            mockFetch.mockResolvedValue(
              createMockResponse({
                ok: false,
                status: 500,
                statusText: "Server Error",
                text: () => Promise.resolve("Server error")
              })
            )
        },
        {
          name: "database error",
          mockFetch: () =>
            mockFetch.mockResolvedValue(
              createMockResponse({
                ok: true,
                json: () => Promise.resolve({ requestId: "test" })
              })
            ),
          mockDb: () =>
            mockInsertClipProcessing.mockRejectedValue(new Error("DB error"))
        }
      ];

      for (const scenario of errorScenarios) {
        // Reset mocks
        jest.clearAllMocks();
        process.env = {
          ...originalEnv,
          ALLSTAR_API_KEY: "test-key",
          BACKEND_URL: "https://test.com"
        };

        // Apply scenario-specific setup
        if (scenario.env) {
          Object.entries(scenario.env).forEach(([key, value]) => {
            if (value === undefined) {
              delete process.env[key];
            } else {
              process.env[key] = value;
            }
          });
        }
        if (scenario.mockFetch) scenario.mockFetch();
        if (scenario.mockDb) scenario.mockDb();

        // Verify no exceptions are thrown
        await expect(
          sendDemoForAllStarPOTGClip(123, "https://demo.url")
        ).resolves.toBeDefined();
      }
    });
  });

  describe("integration with transaction context", () => {
    it("should allow transaction to commit when AllStar succeeds", async () => {
      const mockResponse = createMockResponse({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: "test-request-id" })
      });
      mockFetch.mockResolvedValue(mockResponse);
      mockInsertClipProcessing.mockResolvedValue(undefined);

      // Simulate transaction context
      const transaction = {
        commit: jest.fn(),
        rollback: jest.fn()
      };

      try {
        // Simulate the actual usage pattern from game.models.ts
        await Promise.all([
          sendDemoForAllStarPOTGClip(123, "https://demo.url")
        ]);
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }

      expect(transaction.commit).toHaveBeenCalled();
      expect(transaction.rollback).not.toHaveBeenCalled();
    });

    it("should allow transaction to commit when AllStar fails", async () => {
      mockFetch.mockRejectedValue(new Error("AllStar service down"));

      // Simulate transaction context
      const transaction = {
        commit: jest.fn(),
        rollback: jest.fn()
      };

      try {
        // Simulate the actual usage pattern from game.models.ts
        await Promise.all([
          sendDemoForAllStarPOTGClip(123, "https://demo.url")
        ]);
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }

      expect(transaction.commit).toHaveBeenCalled();
      expect(transaction.rollback).not.toHaveBeenCalled();
    });

    it("should allow transaction to commit when database insert fails", async () => {
      const mockResponse = createMockResponse({
        ok: true,
        json: jest.fn().mockResolvedValue({ requestId: "test-request-id" })
      });
      mockFetch.mockResolvedValue(mockResponse);
      mockInsertClipProcessing.mockRejectedValue(new Error("Database error"));

      // Simulate transaction context
      const transaction = {
        commit: jest.fn(),
        rollback: jest.fn()
      };

      try {
        // Simulate the actual usage pattern from game.models.ts
        await Promise.all([
          sendDemoForAllStarPOTGClip(123, "https://demo.url")
        ]);
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }

      expect(transaction.commit).toHaveBeenCalled();
      expect(transaction.rollback).not.toHaveBeenCalled();
    });
  });
});
