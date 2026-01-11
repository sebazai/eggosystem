import type { Request, Response, NextFunction } from "express";
import {
  lookupAccountController,
  regenerateTokenController
} from "./email-verification.controllers";
import * as emailVerificationModels from "../../models/dashboard/email-verification.models";

jest.mock("../../models/dashboard/email-verification.models");

describe("Email Verification Controllers", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    req = {
      query: {},
      body: {}
    };
    res = {
      json: jsonMock
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("lookupAccountController", () => {
    const mockAccountData = {
      account_id: 1,
      steam_id: "76561198012345678",
      nickname: "TestPlayer",
      work_email: "test@example.com",
      work_email_verified: false,
      work_email_token: "token-123",
      work_email_token_expires_at: new Date().toISOString()
    };

    const mockVerificationStatus = {
      accountId: 1,
      steamId: "76561198012345678",
      nickname: "TestPlayer",
      workEmail: "test@example.com",
      workEmailVerified: false,
      workEmailToken: "token-123",
      workEmailTokenExpiresAt: new Date().toISOString(),
      isTokenValid: true,
      verificationUrl: "https://example.com/verify-email?token=token-123"
    };

    it("should lookup account successfully by steam_id", async () => {
      req.query = {
        lookup: "76561198012345678",
        lookupType: "steam_id"
      };

      (
        emailVerificationModels.getAccountByLookup as jest.Mock
      ).mockResolvedValue(mockAccountData);
      (
        emailVerificationModels.getEmailVerificationStatus as jest.Mock
      ).mockResolvedValue(mockVerificationStatus);

      await lookupAccountController(req as Request, res as Response, next);

      expect(emailVerificationModels.getAccountByLookup).toHaveBeenCalledWith(
        "76561198012345678",
        "steam_id"
      );
      expect(
        emailVerificationModels.getEmailVerificationStatus
      ).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockVerificationStatus);
      expect(next).not.toHaveBeenCalled();
    });

    it("should lookup account successfully by email", async () => {
      req.query = {
        lookup: "test@example.com",
        lookupType: "email"
      };

      (
        emailVerificationModels.getAccountByLookup as jest.Mock
      ).mockResolvedValue(mockAccountData);
      (
        emailVerificationModels.getEmailVerificationStatus as jest.Mock
      ).mockResolvedValue(mockVerificationStatus);

      await lookupAccountController(req as Request, res as Response, next);

      expect(emailVerificationModels.getAccountByLookup).toHaveBeenCalledWith(
        "test@example.com",
        "email"
      );
      expect(jsonMock).toHaveBeenCalledWith(mockVerificationStatus);
    });

    it("should return 400 when lookup value is missing", async () => {
      req.query = {
        lookupType: "steam_id"
      };

      await lookupAccountController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Lookup value is required",
          status: 400
        })
      );
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should return 400 when lookupType is missing", async () => {
      req.query = {
        lookup: "test"
      };

      await lookupAccountController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Lookup type is required",
          status: 400
        })
      );
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should return 400 when lookupType is invalid", async () => {
      req.query = {
        lookup: "test",
        lookupType: "invalid_type"
      };

      await lookupAccountController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Invalid lookup type"),
          status: 400
        })
      );
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should return 400 when account not found", async () => {
      req.query = {
        lookup: "nonexistent",
        lookupType: "steam_id"
      };

      (
        emailVerificationModels.getAccountByLookup as jest.Mock
      ).mockResolvedValue(null);

      await lookupAccountController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Account not found",
          status: 400
        })
      );
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should handle errors from models", async () => {
      req.query = {
        lookup: "test",
        lookupType: "steam_id"
      };

      const error = new Error("Database error");
      (
        emailVerificationModels.getAccountByLookup as jest.Mock
      ).mockRejectedValue(error);

      await lookupAccountController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe("regenerateTokenController", () => {
    const mockRegenerateResponse = {
      success: true,
      token: "new-token-456",
      expiresAt: new Date().toISOString(),
      verificationUrl: "https://example.com/verify-email?token=new-token-456"
    };

    it("should regenerate token successfully", async () => {
      req.body = {
        accountId: 1
      };

      (
        emailVerificationModels.regenerateVerificationToken as jest.Mock
      ).mockResolvedValue(mockRegenerateResponse);

      await regenerateTokenController(req as Request, res as Response, next);

      expect(
        emailVerificationModels.regenerateVerificationToken
      ).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith(mockRegenerateResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when accountId is missing", async () => {
      req.body = {};

      await regenerateTokenController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Account ID is required",
          status: 400
        })
      );
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should return 400 when accountId is not a number", async () => {
      req.body = {
        accountId: "not-a-number"
      };

      await regenerateTokenController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Account ID is required",
          status: 400
        })
      );
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should handle errors from models", async () => {
      req.body = {
        accountId: 1
      };

      const error = new Error("Account email is already verified");
      (
        emailVerificationModels.regenerateVerificationToken as jest.Mock
      ).mockRejectedValue(error);

      await regenerateTokenController(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });
});
