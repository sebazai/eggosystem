import {
  createMockAccount,
  createMockUserPolicyAcceptance
} from "@eggosystem/types";
import { updateAccountProfileController } from "./account.controllers";
import { getConnection } from "../db/mysqlConnection";
import * as accountModels from "../models/account.models";
import type { Request, Response } from "express";
import _ from "lodash";

jest.mock("../db/mysqlConnection", () => ({
  getConnection: jest.fn()
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
      .spyOn(accountModels, "updateUserPolicyAcceptance")
      .mockResolvedValue(undefined);
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
    jest.spyOn(accountModels, "userPolicyAcceptance").mockResolvedValue(
      createMockUserPolicyAcceptance({
        accepted_tournament_newsletter: true
      })
    );
    const updatedAccountSpy = jest
      .spyOn(accountModels, "updateAccountData")
      .mockResolvedValue(undefined);
    const updatedPolicySpy = jest
      .spyOn(accountModels, "updateUserPolicyAcceptance")
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
    jest.spyOn(accountModels, "userPolicyAcceptance").mockResolvedValue(null);
    const insertSpy = jest
      .spyOn(accountModels, "insertUserPolicyAcceptance")
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
    jest.spyOn(accountModels, "userPolicyAcceptance").mockResolvedValue(null);
    jest.spyOn(accountModels, "insertUserPolicyAcceptance").mockResolvedValue();

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
