import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "../../routes/v1/auth.routes";
import * as authServices from "../../services/auth.services";
import * as authModels from "../../models/auth.models";
import * as accountModels from "../../models/account.models";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn((payload, secret, _options) => {
    if (secret === "mock-refresh-private-key") {
      return "mock-refresh-token";
    }
    return "mock-access-token";
  })
}));

// Mock express-jwt middleware
jest.mock("express-jwt", () => ({
  expressjwt: jest.fn(
    () =>
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        // Check if Authorization header exists and has valid token
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }

        const token = authHeader.split(" ")[1];

        // Only allow "valid_token" as a valid token
        if (token === "valid_token") {
          req.auth = {
            account_id: 1,
            provider_id: "76561198049745649",
            provider: "steam",
            permissions: [],
            roles: [],
            nickname: "sububobi"
          };
          next();
        } else {
          res.status(401).json({ message: "Unauthorized" });
        }
      }
  )
}));

describe("GET /me", () => {
  const app = express();
  app.use(express.json());
  app.use(authRouter);

  beforeEach(() => {
    process.env.PRIVACY_POLICY_VERSION = "1";

    // Mock auth services
    jest.spyOn(authServices, "getRolesForAccountId").mockResolvedValue([]);

    // Mock auth models
    jest.spyOn(authModels, "getAuthUserBySteamId").mockResolvedValue({
      account_id: 1,
      steam_id: "76561198049745649",
      nickname: "sububobi",
      is_work_email_personal_email: false,
      discord_user_id: null,
      provider: "steam",
      full_name: "Test User",
      work_email: "test@example.com",
      discord: null
    });

    // Mock account models
    jest
      .spyOn(accountModels, "getUserProfileAcceptanceForVersion")
      .mockResolvedValue({
        id: 1,
        account_id: 1,
        accepted_privacy_policy: true,
        accepted_marketing: false,
        privacy_policy_version: "1",
        created_at: new Date(),
        updated_at: new Date()
      });
    jest
      .spyOn(accountModels, "getLatestUserProfileMarketingConsent")
      .mockResolvedValue(false);
  });

  it("should return user data when token is valid", async () => {
    const response = await request(app)
      .get("/me")
      .set("Authorization", "Bearer valid_token");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty(
      "provider_id",
      "76561198049745649"
    );
    expect(response.body.user).toHaveProperty("nickname", "sububobi");
    expect(response.body.user).not.toHaveProperty("fullName");
    expect(response.body.user).not.toHaveProperty("workEmail");
    expect(response.body.user).not.toHaveProperty("discord");
    expect(response.body.user).toHaveProperty("acceptedPrivacyPolicy");
    expect(response.body.user).toHaveProperty("acceptedMarketing");
  });

  it("should return 401 Unauthorized when token is invalid", async () => {
    const response = await request(app)
      .get("/me")
      .set("Authorization", "Bearer invalid_token");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized" });
  });

  it("should return 401 Unauthorized when no token is provided", async () => {
    const response = await request(app).get("/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized" });
  });
});

describe("GET /steam/return", () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(authRouter);

  jest.mock("passport");
  beforeEach(() => {
    process.env.FRONTEND_URL = "https://example.com";
    process.env.PRIVACY_POLICY_VERSION = "1";
    jest
      .spyOn(authServices, "getPermissionsForAccountId")
      .mockResolvedValue([]);
    jest.spyOn(authServices, "getRolesForAccountId").mockResolvedValue([]);
  });

  it("should redirect to the valid returnUrl from cookie and call jwt sign with correct params", async () => {
    const response = await request(app)
      .get("/steam/return")
      .set("Authorization", "Bearer valid_token")
      .set("Cookie", "steam_returnUrl=/dashboard");

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "sububobi",
        jti: expect.any(String),
        permissions: [],
        steamId: "76561198049745649"
      }),
      "mock-private-key",
      { algorithm: "RS256", expiresIn: 1200 }
    );

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "sububobi",
        jti: expect.any(String),
        permissions: [],
        steamId: "76561198049745649"
      }),
      "mock-refresh-private-key",
      { algorithm: "RS256", expiresIn: 604800 }
    );
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("https://example.com/dashboard");
  });

  it("should default to /login-success if no returnUrl is provided", async () => {
    const response = await request(app)
      .get("/steam/return")
      .set("Authorization", "Bearer valid_token");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("https://example.com/login-success");
  });

  it("should default to /login-success if returnUrl is invalid", async () => {
    const response = await request(app)
      .get("/steam/return")
      .set("Authorization", "Bearer valid_token")
      .set("Cookie", "steam_returnUrl=https://malicious.com/steal-data");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("https://example.com/login-success");
  });

  it("should redirect to /login-failed if authentication fails due to no req.user", async () => {
    const response = await request(app).get("/steam/return");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("https://example.com/login-failed");
  });
});
