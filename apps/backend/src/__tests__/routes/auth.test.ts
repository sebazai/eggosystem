import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "../../routes/v1/auth.routes";

describe("GET /me", () => {
  const app = express();
  app.use(express.json());
  app.use(authRouter);

  jest.mock("express-jwt");
  beforeEach(() => {
    process.env.PRIVACY_POLICY_VERSION = "1";
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
    expect(response.body.user).toHaveProperty("fullName");
    expect(response.body.user).toHaveProperty("workEmail");
    expect(response.body.user).toHaveProperty("discord");
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
  });

  it("should redirect to the valid returnUrl from cookie", async () => {
    const response = await request(app)
      .get("/steam/return")
      .set("Authorization", "Bearer valid_token")
      .set("Cookie", "steam_returnUrl=/dashboard");

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
