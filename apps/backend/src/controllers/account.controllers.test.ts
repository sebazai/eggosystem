import { type UserPolicyAcceptance, type Account } from "@eggosystem/types";
import { updateAccountProfileController } from "./account.controllers";
import { getConnection } from "../db/mysqlConnection";
import * as accountModels from "../models/account.models";
import type { Request, Response } from "express";
import _ from "lodash";

jest.mock("../db/mysqlConnection", () => ({
  getConnection: jest.fn()
}));

const mockedAccount = {
  id: 1,
  steam_id: "12345",
  nickname: "TestUser",
  full_name: "Test User",
  work_email: "new@kana.fi",
  work_email_verified: false,
  work_email_token: null,
  work_email_token_expires_at: null,
  is_work_email_personal_email: false,
  discord: null,
  updated_at: "",
  created_at: ""
} satisfies Account;

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
    await updateAccountProfileController(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
  });

  it("should return 400 if validation fails", async () => {
    req.body = { invalidField: "invalid" };
    await updateAccountProfileController(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid profile data" })
    );
  });

  it("should update profile and policy acceptance if user exists", async () => {
    jest.spyOn(accountModels, "userPolicyAcceptance").mockResolvedValue({
      id: 0,
      account_id: 0,
      accepted_privacy_policy: false,
      accepted_marketing: false,
      created_at: new Date(),
      updated_at: new Date(),
      privacy_policy_version: ""
    } satisfies UserPolicyAcceptance);
    const updatedAccountSpy = jest
      .spyOn(accountModels, "updateAccountData")
      .mockResolvedValue(undefined);
    const updatedPolicySpy = jest
      .spyOn(accountModels, "updateUserPolicyAcceptance")
      .mockResolvedValue(undefined);
    await updateAccountProfileController(req as Request, res as Response);
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
    const newMock: Account = {
      ..._.cloneDeep(mockedAccount),
      work_email: "test@example.com"
    };

    jest.spyOn(accountModels, "getAccountById").mockResolvedValue(newMock);
    jest.spyOn(accountModels, "userPolicyAcceptance").mockResolvedValue(null);
    const insertSpy = jest
      .spyOn(accountModels, "insertUserPolicyAcceptance")
      .mockResolvedValue();
    await updateAccountProfileController(req as Request, res as Response);
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
    await expect(
      updateAccountProfileController(req as Request, res as Response)
    ).rejects.toThrow("DB Error");
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });
});
