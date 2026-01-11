import {
  createMockAccount,
  createMockUserPolicyAcceptance,
  type RequestWithParams
} from "@eggosystem/types";
import {
  updateAccountProfileController,
  sendVerificationEmails
} from "./account.controllers";
import { getConnection } from "../db/mysqlConnection";
import * as accountModels from "../models/account.models";
import * as userPolicyAcceptanceModels from "../models/user-policy-acceptance.models";
import * as accountServices from "../services/account.services";
import { runQuery } from "../db/mysqlRunQuery";
import { redisClient } from "../utils/redisClient";
import { getSevenDaysLaterInMillis } from "../utils/date-utils";
import type { Request, Response } from "express";
import _ from "lodash";
import * as uuid from "uuid";

jest.mock("../db/mysqlConnection", () => ({
  getConnection: jest.fn()
}));

jest.mock("../db/mysqlRunQuery", () => ({
  runQuery: jest.fn()
}));

jest.mock("../utils/redisClient", () => ({
  redisClient: {
    del: jest.fn()
  }
}));

jest.mock("../services/account.services", () => ({
  handleEmailVerification: jest.fn()
}));

jest.mock("uuid");

jest.mock("../utils/date-utils", () => ({
  getSevenDaysLaterInMillis: jest.fn()
}));

const mockedAccount = createMockAccount({
  steam_id: "12345",
  nickname: "TestUser",
  full_name: "Test User",
  work_email: "new@kana.fi",
  work_email_verified: false,
  is_work_email_personal_email: false,
  updated_at: "",
  created_at: ""
});

describe("updateProfile Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let connection: any;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    req = {
      auth: {
        account_id: 1,
        provider_id: "12345",
        permissions: [],
        roles: [],
        nickname: "hehe",
        provider: "steam"
      },
      body: {
        nickname: "Test User",
        full_name: "Test Player",
        work_email: "test@example.com",
        discord: "testDiscord",
        acceptPrivacyPolicy: true,
        acceptMarketing: false
      }
    };

    res = {
      status: statusMock,
      json: jsonMock
    };

    connection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      execute: jest.fn()
    };
    (getConnection as jest.Mock).mockResolvedValue(connection);
    process.env.PRIVACY_POLICY_VERSION = "1";

    jest
      .spyOn(accountModels, "getAccountById")
      .mockResolvedValue(mockedAccount);
    jest.spyOn(accountModels, "updateAccountData").mockResolvedValue(undefined);
    jest
      .spyOn(userPolicyAcceptanceModels, "updateUserPolicyAcceptance")
      .mockResolvedValue(undefined);
    (accountServices.handleEmailVerification as jest.Mock).mockResolvedValue(
      undefined
    );
  });

  it("should return 401 if user is not authenticated", async () => {
    req.auth = undefined;
    const mockNext = jest.fn();
    await updateAccountProfileController(
      req as Request,
      res as Response,
      mockNext
    );
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Unauthorized",
        status: 401
      })
    );
  });

  it("should return 400 if validation fails", async () => {
    req.body = { invalidField: "invalid" };
    const mockNext = jest.fn();
    await updateAccountProfileController(
      req as Request,
      res as Response,
      mockNext
    );
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid profile data",
        status: 400
      })
    );
  });

  it("should update profile and policy acceptance if user exists", async () => {
    jest
      .spyOn(userPolicyAcceptanceModels, "userPolicyAcceptance")
      .mockResolvedValue(
        createMockUserPolicyAcceptance({
          accepted_tournament_newsletter: true
        })
      );
    const updatedAccountSpy = jest
      .spyOn(accountModels, "updateAccountData")
      .mockResolvedValue(undefined);
    const updatedPolicySpy = jest
      .spyOn(userPolicyAcceptanceModels, "updateUserPolicyAcceptance")
      .mockResolvedValue(undefined);

    const mockNext = jest.fn();
    await updateAccountProfileController(
      req as Request,
      res as Response,
      mockNext
    );
    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(updatedAccountSpy).toHaveBeenCalledWith(
      1,
      expect.any(Object),
      connection
    );
    expect(updatedPolicySpy).toHaveBeenCalledWith(
      1,
      expect.any(Object),
      connection
    );
    expect(connection.commit).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message:
        "Profile updated successfully. Please verify your email. Remember to check junk folder as well."
    });
  });

  it("should insert policy acceptance if none exists", async () => {
    const newMock = createMockAccount({
      ...mockedAccount,
      work_email: "test@example.com"
    });

    jest.spyOn(accountModels, "getAccountById").mockResolvedValue(newMock);
    jest
      .spyOn(userPolicyAcceptanceModels, "userPolicyAcceptance")
      .mockResolvedValue(null);
    const insertSpy = jest
      .spyOn(userPolicyAcceptanceModels, "insertUserPolicyAcceptance")
      .mockResolvedValue();

    const mockNext = jest.fn();
    await updateAccountProfileController(
      req as Request,
      res as Response,
      mockNext
    );
    expect(insertSpy).toHaveBeenCalledWith(1, expect.any(Object), connection);
    expect(connection.commit).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Profile updated successfully."
    });
  });

  it("should rollback and throw error on failure", async () => {
    jest
      .spyOn(accountModels, "updateAccountData")
      .mockRejectedValue(new Error("DB Error"));
    const mockNext = jest.fn();
    await expect(
      updateAccountProfileController(req as Request, res as Response, mockNext)
    ).rejects.toThrow("DB Error");
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });

  it("should preserve existing work email token when work email has not changed", async () => {
    // Create account with existing unverified work email and token
    const accountWithExistingToken = createMockAccount({
      ...mockedAccount,
      work_email: "test@example.com",
      work_email_verified: false,
      work_email_token: "existing-token-123",
      work_email_token_expires_at: new Date("2024-12-31").toISOString()
    });

    jest
      .spyOn(accountModels, "getAccountById")
      .mockResolvedValue(accountWithExistingToken);
    jest
      .spyOn(userPolicyAcceptanceModels, "userPolicyAcceptance")
      .mockResolvedValue(null);
    jest
      .spyOn(userPolicyAcceptanceModels, "insertUserPolicyAcceptance")
      .mockResolvedValue();

    // Update profile with same work email (no change)
    req.body = {
      nickname: "Updated User",
      full_name: "Updated Full Name",
      work_email: "test@example.com", // Same email - no change
      discord: "updatedDiscord",
      acceptPrivacyPolicy: true,
      acceptMarketing: false
    };

    const updateAccountDataSpy = jest
      .spyOn(accountModels, "updateAccountData")
      .mockResolvedValue(undefined);

    const mockNext = jest.fn();
    await updateAccountProfileController(
      req as Request,
      res as Response,
      mockNext
    );

    // Verify that updateAccountData was called with preserved token data
    expect(updateAccountDataSpy).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        work_email: "test@example.com",
        work_email_token: "existing-token-123", // Should preserve existing token
        work_email_token_expires_at: new Date("2024-12-31"), // Should preserve existing expiry
        work_email_verified: false // Should remain false
      }),
      connection
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Profile updated successfully."
    });
  });
});

describe("sendVerificationEmails Controller", () => {
  let req: Partial<RequestWithParams<{ id: string }>>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let connection: any;
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
  const sevenDaysLater = Date.now() + 7 * 24 * 60 * 60 * 1000;

  beforeEach(() => {
    jsonMock = jest.fn();

    req = {
      auth: {
        account_id: 1,
        provider_id: "12345",
        permissions: [],
        roles: [],
        nickname: "testuser",
        provider: "steam"
      },
      params: {
        id: "1"
      }
    };

    res = {
      json: jsonMock
    };

    connection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };

    (getConnection as jest.Mock).mockResolvedValue(connection);
    (getSevenDaysLaterInMillis as jest.Mock).mockReturnValue(sevenDaysLater);
    (uuid.v4 as jest.Mock).mockReturnValue("new-token-456");
    (runQuery as jest.Mock).mockResolvedValue(undefined);
    (redisClient.del as jest.Mock).mockResolvedValue(1);
    (accountServices.handleEmailVerification as jest.Mock).mockResolvedValue(
      undefined
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    req.auth = undefined;
    const mockNext = jest.fn();

    await sendVerificationEmails(
      req as RequestWithParams<{ id: string }>,
      res as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Unauthorized",
        status: 401
      })
    );
  });

  it("should return 401 if user tries to verify another account", async () => {
    req.params = { id: "2" }; // Different account ID
    const mockNext = jest.fn();

    await sendVerificationEmails(
      req as RequestWithParams<{ id: string }>,
      res as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Unauthorized",
        status: 401
      })
    );
  });

  it("should reuse valid existing token when it has not expired", async () => {
    const accountWithValidToken = createMockAccount({
      id: 1,
      work_email: "test@example.com",
      work_email_verified: false,
      work_email_token: "existing-valid-token",
      work_email_token_expires_at: futureDate.toISOString()
    });

    jest
      .spyOn(accountModels, "getAccountById")
      .mockResolvedValue(accountWithValidToken);

    const mockNext = jest.fn();
    await sendVerificationEmails(
      req as RequestWithParams<{ id: string }>,
      res as Response,
      mockNext
    );

    // Should NOT delete old token
    expect(redisClient.del).not.toHaveBeenCalled();

    // Should NOT generate new token
    expect(uuid.v4).not.toHaveBeenCalled();

    // Should NOT update database
    expect(runQuery).not.toHaveBeenCalled();

    // Should still send email with existing token
    expect(accountServices.handleEmailVerification).toHaveBeenCalledWith(
      1,
      "test@example.com",
      "existing-valid-token",
      futureDate.getTime()
    );

    expect(connection.commit).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith({
      message: "New verification links sent"
    });
  });

  it("should generate new token when existing token has expired", async () => {
    const accountWithExpiredToken = createMockAccount({
      id: 1,
      work_email: "test@example.com",
      work_email_verified: false,
      work_email_token: "expired-token",
      work_email_token_expires_at: pastDate.toISOString()
    });

    jest
      .spyOn(accountModels, "getAccountById")
      .mockResolvedValue(accountWithExpiredToken);

    const mockNext = jest.fn();
    await sendVerificationEmails(
      req as RequestWithParams<{ id: string }>,
      res as Response,
      mockNext
    );

    // Should delete old token
    expect(redisClient.del).toHaveBeenCalledWith(
      "verify:work-email:expired-token"
    );

    // Should generate new token
    expect(uuid.v4).toHaveBeenCalled();

    // Should update database with new token
    expect(runQuery).toHaveBeenCalledWith(
      "UPDATE Accounts SET work_email_token = ?, work_email_token_expires_at = ? WHERE id = ?",
      ["new-token-456", new Date(sevenDaysLater), 1],
      connection
    );

    // Should send email with new token
    expect(accountServices.handleEmailVerification).toHaveBeenCalledWith(
      1,
      "test@example.com",
      "new-token-456",
      sevenDaysLater
    );

    expect(connection.commit).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith({
      message: "New verification links sent"
    });
  });

  it("should generate new token when no token exists", async () => {
    const accountWithoutToken = createMockAccount({
      id: 1,
      work_email: "test@example.com",
      work_email_verified: false,
      work_email_token: null,
      work_email_token_expires_at: null
    });

    jest
      .spyOn(accountModels, "getAccountById")
      .mockResolvedValue(accountWithoutToken);

    const mockNext = jest.fn();
    await sendVerificationEmails(
      req as RequestWithParams<{ id: string }>,
      res as Response,
      mockNext
    );

    // Should NOT try to delete non-existent token
    expect(redisClient.del).not.toHaveBeenCalled();

    // Should generate new token
    expect(uuid.v4).toHaveBeenCalled();

    // Should update database with new token
    expect(runQuery).toHaveBeenCalledWith(
      "UPDATE Accounts SET work_email_token = ?, work_email_token_expires_at = ? WHERE id = ?",
      ["new-token-456", new Date(sevenDaysLater), 1],
      connection
    );

    // Should send email with new token
    expect(accountServices.handleEmailVerification).toHaveBeenCalledWith(
      1,
      "test@example.com",
      "new-token-456",
      sevenDaysLater
    );

    expect(connection.commit).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith({
      message: "New verification links sent"
    });
  });

  it("should throw error if email is already verified", async () => {
    const verifiedAccount = createMockAccount({
      id: 1,
      work_email: "test@example.com",
      work_email_verified: true,
      work_email_token: null,
      work_email_token_expires_at: null
    });

    jest
      .spyOn(accountModels, "getAccountById")
      .mockResolvedValue(verifiedAccount);

    const mockNext = jest.fn();

    await expect(
      sendVerificationEmails(
        req as RequestWithParams<{ id: string }>,
        res as Response,
        mockNext
      )
    ).rejects.toThrow("Account already verified");

    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });

  it("should throw error if work email is not set", async () => {
    const accountWithoutEmail = createMockAccount({
      id: 1,
      work_email: null,
      work_email_verified: false,
      work_email_token: null,
      work_email_token_expires_at: null
    });

    jest
      .spyOn(accountModels, "getAccountById")
      .mockResolvedValue(accountWithoutEmail);

    const mockNext = jest.fn();

    await expect(
      sendVerificationEmails(
        req as RequestWithParams<{ id: string }>,
        res as Response,
        mockNext
      )
    ).rejects.toThrow("Work email not found");

    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });

  it("should rollback transaction on error", async () => {
    jest
      .spyOn(accountModels, "getAccountById")
      .mockRejectedValue(new Error("Database error"));

    const mockNext = jest.fn();

    await expect(
      sendVerificationEmails(
        req as RequestWithParams<{ id: string }>,
        res as Response,
        mockNext
      )
    ).rejects.toThrow("Database error");

    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });
});
