import { type Request, type Response } from "express";
import {
  getUserDiscordStatus,
  unlinkDiscordAccountController
} from "./discord.controllers";
import { runQuery } from "../db/mysqlRunQuery";
import { logger } from "../utils/app-logger";
import {
  getDiscordUsernameByAccountId,
  unlinkDiscordAccount
} from "../models/discord.models";
import { createMockUserPayload } from "@eggosystem/types";

// Mock dependencies
jest.mock("../db/mysqlRunQuery");
jest.mock("../utils/app-logger");
jest.mock("../models/discord.models");

const mockGetDiscordUsernameByAccountId =
  getDiscordUsernameByAccountId as jest.MockedFunction<
    typeof getDiscordUsernameByAccountId
  >;
const mockUnlinkDiscordAccount = unlinkDiscordAccount as jest.MockedFunction<
  typeof unlinkDiscordAccount
>;
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe("Discord Controllers", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockRequest = {
      auth: createMockUserPayload({
        account_id: 123,
        provider_id: "steam123",
        nickname: "testuser"
      })
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  describe("getUserDiscordStatus", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockRequest.auth = undefined;

      const mockNext = jest.fn();
      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Unauthorized",
          status: 401
        })
      );
    });

    it("should return user Discord status with Discord username", async () => {
      const mockRegistrations = [
        {
          organization_id: 1,
          organization_name: "Test Organization",
          created_at: "2024-01-01T00:00:00Z"
        }
      ];

      mockGetDiscordUsernameByAccountId.mockResolvedValue("testuser");
      mockRunQuery.mockResolvedValue(mockRegistrations);

      const mockNext = jest.fn();
      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetDiscordUsernameByAccountId).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith({
        hasDiscordUsername: true,
        discordUsername: "testuser",
        kanahautomoRegistrations: mockRegistrations
      });
    });

    it("should return user Discord status without Discord username", async () => {
      const mockRegistrations = [
        {
          organization_id: 1,
          organization_name: "Test Organization",
          created_at: "2024-01-01T00:00:00Z"
        }
      ];

      mockGetDiscordUsernameByAccountId.mockResolvedValue(null);
      mockRunQuery.mockResolvedValue(mockRegistrations);

      const mockNext = jest.fn();
      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetDiscordUsernameByAccountId).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith({
        hasDiscordUsername: false,
        discordUsername: null,
        kanahautomoRegistrations: mockRegistrations
      });
    });

    it("should return empty registrations when user has no Kanahautomo registrations", async () => {
      mockGetDiscordUsernameByAccountId.mockResolvedValue("testuser");
      mockRunQuery.mockResolvedValue([]);

      const mockNext = jest.fn();
      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetDiscordUsernameByAccountId).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith({
        hasDiscordUsername: true,
        discordUsername: "testuser",
        kanahautomoRegistrations: []
      });
    });

    it("should handle database errors gracefully", async () => {
      mockGetDiscordUsernameByAccountId.mockResolvedValue("testuser");
      mockRunQuery.mockRejectedValue(new Error("Database error"));

      const mockNext = jest.fn();
      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error getting user Discord status:",
        expect.any(Error)
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Internal server error",
          status: 500
        })
      );
    });

    it("should handle account retrieval errors gracefully", async () => {
      mockGetDiscordUsernameByAccountId.mockRejectedValue(
        new Error("Account not found")
      );

      const mockNext = jest.fn();
      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error getting user Discord status:",
        expect.any(Error)
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Internal server error",
          status: 500
        })
      );
    });

    it("should query Kanahautomo registrations with correct steam ID", async () => {
      mockGetDiscordUsernameByAccountId.mockResolvedValue(null);
      mockRunQuery.mockResolvedValue([]);

      const mockNext = jest.fn();
      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["steam123"]
      );
    });

    it("should handle multiple Kanahautomo registrations", async () => {
      const mockRegistrations = [
        {
          organization_id: 1,
          organization_name: "Test Organization 1",
          created_at: "2024-01-01T00:00:00Z"
        },
        {
          organization_id: 2,
          organization_name: "Test Organization 2",
          created_at: "2024-01-02T00:00:00Z"
        }
      ];

      mockGetDiscordUsernameByAccountId.mockResolvedValue("testuser");
      mockRunQuery.mockResolvedValue(mockRegistrations);

      const mockNext = jest.fn();
      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetDiscordUsernameByAccountId).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith({
        hasDiscordUsername: true,
        discordUsername: "testuser",
        kanahautomoRegistrations: mockRegistrations
      });
    });
  });

  describe("unlinkDiscordAccountController", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockRequest.auth = undefined;

      const mockNext = jest.fn();
      await unlinkDiscordAccountController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Unauthorized",
          status: 401
        })
      );
      expect(mockUnlinkDiscordAccount).not.toHaveBeenCalled();
    });

    it("should successfully unlink Discord account when authenticated", async () => {
      mockUnlinkDiscordAccount.mockResolvedValue(true);

      const mockNext = jest.fn();
      await unlinkDiscordAccountController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUnlinkDiscordAccount).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Discord account unlinked successfully"
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return appropriate success response with message", async () => {
      mockUnlinkDiscordAccount.mockResolvedValue(true);

      const mockNext = jest.fn();
      await unlinkDiscordAccountController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockJson).toHaveBeenCalledWith({
        message: "Discord account unlinked successfully"
      });
    });

    it("should handle errors from model function gracefully", async () => {
      const error = new Error("Database error");
      mockUnlinkDiscordAccount.mockRejectedValue(error);

      const mockNext = jest.fn();
      await unlinkDiscordAccountController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error unlinking Discord account:",
        error
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Internal server error",
          status: 500
        })
      );
    });

    it("should ensure user can only unlink their own Discord account", async () => {
      mockUnlinkDiscordAccount.mockResolvedValue(true);

      const mockNext = jest.fn();
      await unlinkDiscordAccountController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify that the account_id from req.auth is used
      expect(mockUnlinkDiscordAccount).toHaveBeenCalledWith(
        mockRequest.auth?.account_id
      );
    });
  });
});
