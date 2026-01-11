import {
  getAccountByLookup,
  getEmailVerificationStatus,
  regenerateVerificationToken
} from "./email-verification.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { redisClient } from "../../utils/redisClient";
import { getSevenDaysLaterInMillis } from "../../utils/date-utils";
import { v4 as uuidv4 } from "uuid";

jest.mock("../../db/mysqlRunQuery");
jest.mock("../../utils/redisClient");
jest.mock("../../utils/date-utils");
jest.mock("uuid", () => ({
  v4: jest.fn()
}));

describe("Email Verification Models", () => {
  const mockConnection = {} as any;
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
  const sevenDaysLater = Date.now() + 7 * 24 * 60 * 60 * 1000;

  beforeEach(() => {
    jest.clearAllMocks();
    (getSevenDaysLaterInMillis as jest.Mock).mockReturnValue(sevenDaysLater);
    (uuidv4 as jest.Mock).mockReturnValue("new-token-123");
    process.env.FRONTEND_URL = "https://example.com";
  });

  describe("getAccountByLookup", () => {
    const mockAccountResult = {
      account_id: 1,
      steam_id: "76561198012345678",
      nickname: "TestPlayer",
      work_email: "test@example.com",
      work_email_verified: false,
      work_email_token: "token-123",
      work_email_token_expires_at: futureDate.toISOString()
    };

    it("should find account by steam_id", async () => {
      (runQuery as jest.Mock).mockResolvedValue([mockAccountResult]);

      const result = await getAccountByLookup(
        "76561198012345678",
        "steam_id",
        mockConnection
      );

      expect(result).toEqual(mockAccountResult);
      expect(runQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE sp.steam_id = ?"),
        ["76561198012345678"],
        mockConnection
      );
    });

    it("should find account by account_id", async () => {
      (runQuery as jest.Mock).mockResolvedValue([mockAccountResult]);

      const result = await getAccountByLookup(
        "1",
        "account_id",
        mockConnection
      );

      expect(result).toEqual(mockAccountResult);
      expect(runQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE a.id = ?"),
        ["1"],
        mockConnection
      );
    });

    it("should find account by nickname", async () => {
      (runQuery as jest.Mock).mockResolvedValue([mockAccountResult]);

      const result = await getAccountByLookup(
        "TestPlayer",
        "nickname",
        mockConnection
      );

      expect(result).toEqual(mockAccountResult);
      expect(runQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE sp.nickname = ?"),
        ["TestPlayer"],
        mockConnection
      );
    });

    it("should find account by email (case insensitive)", async () => {
      (runQuery as jest.Mock).mockResolvedValue([mockAccountResult]);

      const result = await getAccountByLookup(
        "TEST@EXAMPLE.COM",
        "email",
        mockConnection
      );

      expect(result).toEqual(mockAccountResult);
      expect(runQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE a.work_email = ?"),
        ["test@example.com"], // Should be lowercased
        mockConnection
      );
    });

    it("should return null when account not found", async () => {
      (runQuery as jest.Mock).mockResolvedValue([]);

      const result = await getAccountByLookup(
        "nonexistent",
        "steam_id",
        mockConnection
      );

      expect(result).toBeNull();
    });

    it("should throw error for invalid lookup type", async () => {
      await expect(
        getAccountByLookup("test", "invalid" as any, mockConnection)
      ).rejects.toThrow("Invalid lookup type: invalid");
    });
  });

  describe("getEmailVerificationStatus", () => {
    it("should return status with valid token", async () => {
      const mockAccount = {
        account_id: 1,
        steam_id: "76561198012345678",
        nickname: "TestPlayer",
        work_email: "test@example.com",
        work_email_verified: false,
        work_email_token: "valid-token",
        work_email_token_expires_at: futureDate.toISOString()
      };

      (runQuery as jest.Mock).mockResolvedValue([mockAccount]);

      const result = await getEmailVerificationStatus(1, mockConnection);

      expect(result).toEqual({
        accountId: 1,
        steamId: "76561198012345678",
        nickname: "TestPlayer",
        workEmail: "test@example.com",
        workEmailVerified: false,
        workEmailToken: "valid-token",
        workEmailTokenExpiresAt: futureDate.toISOString(),
        isTokenValid: true,
        verificationUrl: "https://example.com/verify-email?token=valid-token"
      });
    });

    it("should return status with expired token", async () => {
      const mockAccount = {
        account_id: 1,
        steam_id: "76561198012345678",
        nickname: "TestPlayer",
        work_email: "test@example.com",
        work_email_verified: false,
        work_email_token: "expired-token",
        work_email_token_expires_at: pastDate.toISOString()
      };

      (runQuery as jest.Mock).mockResolvedValue([mockAccount]);

      const result = await getEmailVerificationStatus(1, mockConnection);

      expect(result.isTokenValid).toBe(false);
      expect(result.verificationUrl).toBeNull();
    });

    it("should return status with no token", async () => {
      const mockAccount = {
        account_id: 1,
        steam_id: "76561198012345678",
        nickname: "TestPlayer",
        work_email: "test@example.com",
        work_email_verified: false,
        work_email_token: null,
        work_email_token_expires_at: null
      };

      (runQuery as jest.Mock).mockResolvedValue([mockAccount]);

      const result = await getEmailVerificationStatus(1, mockConnection);

      expect(result.isTokenValid).toBe(false);
      expect(result.verificationUrl).toBeNull();
    });

    it("should throw NotFoundError when account not found", async () => {
      (runQuery as jest.Mock).mockResolvedValue([]);

      await expect(
        getEmailVerificationStatus(999, mockConnection)
      ).rejects.toThrow("Account not found");
    });
  });

  describe("regenerateVerificationToken", () => {
    it("should regenerate token successfully", async () => {
      const mockAccount = {
        account_id: 1,
        steam_id: "76561198012345678",
        nickname: "TestPlayer",
        work_email: "test@example.com",
        work_email_verified: false,
        work_email_token: "old-token",
        work_email_token_expires_at: pastDate.toISOString()
      };

      (runQuery as jest.Mock)
        .mockResolvedValueOnce([mockAccount]) // getAccountByLookup
        .mockResolvedValueOnce(undefined); // UPDATE query

      (redisClient.del as jest.Mock).mockResolvedValue(1);
      (redisClient.set as jest.Mock).mockResolvedValue("OK");

      const result = await regenerateVerificationToken(1, mockConnection);

      expect(result).toEqual({
        success: true,
        token: "new-token-123",
        expiresAt: new Date(sevenDaysLater).toISOString(),
        verificationUrl: "https://example.com/verify-email?token=new-token-123"
      });

      // Should delete old token from Redis
      expect(redisClient.del).toHaveBeenCalledWith(
        "verify:work-email:old-token"
      );

      // Should update database
      expect(runQuery).toHaveBeenCalledWith(
        "UPDATE Accounts SET work_email_token = ?, work_email_token_expires_at = ? WHERE id = ?",
        ["new-token-123", new Date(sevenDaysLater), 1],
        mockConnection
      );

      // Should store in Redis
      expect(redisClient.set).toHaveBeenCalledWith(
        "verify:work-email:new-token-123",
        JSON.stringify({
          accountId: 1,
          email: "test@example.com",
          expirationTime: sevenDaysLater
        }),
        "EX",
        604800 // 7 days in seconds
      );
    });

    it("should skip Redis deletion when no old token exists", async () => {
      const mockAccount = {
        account_id: 1,
        steam_id: "76561198012345678",
        nickname: "TestPlayer",
        work_email: "test@example.com",
        work_email_verified: false,
        work_email_token: null,
        work_email_token_expires_at: null
      };

      (runQuery as jest.Mock)
        .mockResolvedValueOnce([mockAccount])
        .mockResolvedValueOnce(undefined);

      (redisClient.set as jest.Mock).mockResolvedValue("OK");

      await regenerateVerificationToken(1, mockConnection);

      // Should NOT delete from Redis since no old token
      expect(redisClient.del).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when account not found", async () => {
      (runQuery as jest.Mock).mockResolvedValue([]);

      await expect(
        regenerateVerificationToken(999, mockConnection)
      ).rejects.toThrow("Account not found");
    });

    it("should throw BadRequestError when work email not set", async () => {
      const mockAccount = {
        account_id: 1,
        steam_id: "76561198012345678",
        nickname: "TestPlayer",
        work_email: null,
        work_email_verified: false,
        work_email_token: null,
        work_email_token_expires_at: null
      };

      (runQuery as jest.Mock).mockResolvedValue([mockAccount]);

      await expect(
        regenerateVerificationToken(1, mockConnection)
      ).rejects.toThrow("Account does not have a work email");
    });

    it("should throw BadRequestError when email already verified", async () => {
      const mockAccount = {
        account_id: 1,
        steam_id: "76561198012345678",
        nickname: "TestPlayer",
        work_email: "test@example.com",
        work_email_verified: true,
        work_email_token: "old-token",
        work_email_token_expires_at: futureDate.toISOString()
      };

      (runQuery as jest.Mock).mockResolvedValue([mockAccount]);

      await expect(
        regenerateVerificationToken(1, mockConnection)
      ).rejects.toThrow("Account email is already verified");
    });
  });
});
