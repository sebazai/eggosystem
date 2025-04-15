import { updateAccount } from "../../controllers/account.controllers";
import { getConnection } from "../../db/mysqlConnection";
import {
  insertUserPolicyAcceptance,
  updateAccountData,
  updateUserPolicyAcceptance,
  userPolicyAcceptance
} from "../../models/account.models";
import type { Request, Response } from "express";

jest.mock("../../db/mysqlConnection", () => ({
  getConnection: jest.fn()
}));

jest.mock("../../models/account.models", () => ({
  insertUserPolicyAcceptance: jest.fn(),
  updateAccountData: jest.fn(),
  updateUserPolicyAcceptance: jest.fn(),
  userPolicyAcceptance: jest.fn()
}));

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
      status: statusMock
    };

    connection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    (getConnection as jest.Mock).mockResolvedValue(connection);
    process.env.PRIVACY_POLICY_VERSION = "1";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    req.auth = undefined;
    await updateAccount(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
  });

  it("should return 400 if validation fails", async () => {
    req.body = { invalidField: "invalid" };
    await updateAccount(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid profile data" })
    );
  });

  it("should update profile and policy acceptance if user exists", async () => {
    (userPolicyAcceptance as jest.Mock).mockResolvedValue(true);
    await updateAccount(req as Request, res as Response);
    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(updateAccountData).toHaveBeenCalledWith(
      1,
      expect.any(Object),
      connection
    );
    expect(updateUserPolicyAcceptance).toHaveBeenCalledWith(
      1,
      expect.any(Object),
      connection
    );
    expect(connection.commit).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "User policy acceptances updated successfully"
    });
  });

  it("should insert policy acceptance if none exists", async () => {
    (userPolicyAcceptance as jest.Mock).mockResolvedValue(null);
    await updateAccount(req as Request, res as Response);
    expect(insertUserPolicyAcceptance).toHaveBeenCalledWith(
      1,
      expect.any(Object),
      connection
    );
    expect(connection.commit).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Profile updated successfully"
    });
  });

  it("should rollback and throw error on failure", async () => {
    (updateAccountData as jest.Mock).mockRejectedValue(new Error("DB Error"));
    await expect(
      updateAccount(req as Request, res as Response)
    ).rejects.toThrow("DB Error");
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });
});
