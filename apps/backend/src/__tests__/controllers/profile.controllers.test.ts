import { updateProfile } from "../../controllers/profile.controllers";
import { getConnection } from "../../db/mysqlConnection";
import {
  insertUserPolicyAcceptance,
  updateProfileData,
  updateUserPolicyAcceptance,
  userPolicyAcceptance
} from "../../models/profile.models";
import type { Request, Response } from "express";

jest.mock("../../db/mysqlConnection", () => ({
  getConnection: jest.fn()
}));

jest.mock("../../models/profile.models", () => ({
  insertUserPolicyAcceptance: jest.fn(),
  updateProfileData: jest.fn(),
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
      auth: { steamId: "12345", displayName: "hehe" },
      body: {
        name: "Test User",
        player_name: "TestPlayer",
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
    process.env.PRIVACY_POLICY_VERSION = "1.0";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    req.auth = undefined;
    await updateProfile(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
  });

  it("should return 400 if validation fails", async () => {
    req.body = { invalidField: "invalid" };
    await updateProfile(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid profile data" })
    );
  });

  it("should update profile and policy acceptance if user exists", async () => {
    (userPolicyAcceptance as jest.Mock).mockResolvedValue(true);
    await updateProfile(req as Request, res as Response);
    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(updateProfileData).toHaveBeenCalledWith(
      "12345",
      expect.any(Object),
      connection
    );
    expect(updateUserPolicyAcceptance).toHaveBeenCalledWith(
      "12345",
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
    await updateProfile(req as Request, res as Response);
    expect(insertUserPolicyAcceptance).toHaveBeenCalledWith(
      "12345",
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
    (updateProfileData as jest.Mock).mockRejectedValue(new Error("DB Error"));
    await expect(
      updateProfile(req as Request, res as Response)
    ).rejects.toThrow("DB Error");
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });
});
