import { type Request, type Response } from "express";
import { getUserDiscordStatus } from "../../controllers/discord.controllers";
import { getAccountById } from "../../models/account.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { logger } from "../../utils/app-logger";
import type { Account, UserPayload } from "@eggosystem/types";

// Mock dependencies
jest.mock("../../models/account.models");
jest.mock("../../db/mysqlRunQuery");
jest.mock("../../utils/app-logger");

const mockGetAccountById = getAccountById as jest.MockedFunction<
  typeof getAccountById
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
      auth: {
        account_id: 123,
        provider_id: "steam123",
        permissions: [],
        roles: [],
        nickname: "testuser",
        provider: "steam"
      } as UserPayload
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  describe("getUserDiscordStatus", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockRequest.auth = undefined;

      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return user Discord status with Discord username", async () => {
      const mockAccount: Account = {
        id: 123,
        steam_id: "steam123",
        nickname: "testuser",
        full_name: "Test User",
        work_email: "test@example.com",
        work_email_verified: true,
        work_email_token: null,
        work_email_token_expires_at: null,
        is_work_email_personal_email: false,
        discord: "testuser#1234",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      };

      const mockRegistrations = [
        {
          organization_id: 1,
          organization_name: "Test Organization",
          created_at: "2024-01-01T00:00:00Z"
        }
      ];

      mockGetAccountById.mockResolvedValue(mockAccount);
      mockRunQuery.mockResolvedValue(mockRegistrations);

      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        hasDiscordUsername: true,
        discordUsername: "testuser#1234",
        kanahautomoRegistrations: mockRegistrations
      });
    });

    it("should return user Discord status without Discord username", async () => {
      const mockAccount: Account = {
        id: 123,
        steam_id: "steam123",
        nickname: "testuser",
        full_name: "Test User",
        work_email: "test@example.com",
        work_email_verified: true,
        work_email_token: null,
        work_email_token_expires_at: null,
        is_work_email_personal_email: false,
        discord: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      };

      const mockRegistrations = [
        {
          organization_id: 1,
          organization_name: "Test Organization",
          created_at: "2024-01-01T00:00:00Z"
        }
      ];

      mockGetAccountById.mockResolvedValue(mockAccount);
      mockRunQuery.mockResolvedValue(mockRegistrations);

      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        hasDiscordUsername: false,
        discordUsername: null,
        kanahautomoRegistrations: mockRegistrations
      });
    });

    it("should return empty registrations when user has no Kanahautomo registrations", async () => {
      const mockAccount: Account = {
        id: 123,
        steam_id: "steam123",
        nickname: "testuser",
        full_name: "Test User",
        work_email: "test@example.com",
        work_email_verified: true,
        work_email_token: null,
        work_email_token_expires_at: null,
        is_work_email_personal_email: false,
        discord: "testuser#1234",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      };

      mockGetAccountById.mockResolvedValue(mockAccount);
      mockRunQuery.mockResolvedValue([]);

      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        hasDiscordUsername: true,
        discordUsername: "testuser#1234",
        kanahautomoRegistrations: []
      });
    });

    it("should handle database errors gracefully", async () => {
      const mockAccount: Account = {
        id: 123,
        steam_id: "steam123",
        nickname: "testuser",
        full_name: "Test User",
        work_email: "test@example.com",
        work_email_verified: true,
        work_email_token: null,
        work_email_token_expires_at: null,
        is_work_email_personal_email: false,
        discord: "testuser#1234",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      };

      mockGetAccountById.mockResolvedValue(mockAccount);
      mockRunQuery.mockRejectedValue(new Error("Database error"));

      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error getting user Discord status:",
        expect.any(Error)
      );
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
    });

    it("should handle account retrieval errors gracefully", async () => {
      mockGetAccountById.mockRejectedValue(new Error("Account not found"));

      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error getting user Discord status:",
        expect.any(Error)
      );
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: "Internal server error" });
    });

    it("should query Kanahautomo registrations with correct steam ID", async () => {
      const mockAccount: Account = {
        id: 123,
        steam_id: "steam123",
        nickname: "testuser",
        full_name: "Test User",
        work_email: "test@example.com",
        work_email_verified: true,
        work_email_token: null,
        work_email_token_expires_at: null,
        is_work_email_personal_email: false,
        discord: "testuser#1234",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      };

      mockGetAccountById.mockResolvedValue(mockAccount);
      mockRunQuery.mockResolvedValue([]);

      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["steam123"]
      );
    });

    it("should handle multiple Kanahautomo registrations", async () => {
      const mockAccount: Account = {
        id: 123,
        steam_id: "steam123",
        nickname: "testuser",
        full_name: "Test User",
        work_email: "test@example.com",
        work_email_verified: true,
        work_email_token: null,
        work_email_token_expires_at: null,
        is_work_email_personal_email: false,
        discord: "testuser#1234",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      };

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

      mockGetAccountById.mockResolvedValue(mockAccount);
      mockRunQuery.mockResolvedValue(mockRegistrations);

      await getUserDiscordStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockJson).toHaveBeenCalledWith({
        hasDiscordUsername: true,
        discordUsername: "testuser#1234",
        kanahautomoRegistrations: mockRegistrations
      });
    });
  });
});
