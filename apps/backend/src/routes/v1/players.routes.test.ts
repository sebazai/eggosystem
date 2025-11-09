// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.PRIVACY_POLICY_VERSION = "1";

import request from "supertest";
import type express from "express";
import { createExpressTestApp } from "../../test-utils";
import playerRouter from "./player.routes";

describe("GET /players", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    // Use the utility to set up the app with FRONTEND_URL
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      playerRouter,
      "/api/v1/players"
    );
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });

  it("/:steam_id/details", async () => {
    const response = await request(app).get(
      "/api/v1/players/76561198049745649/details"
    );
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      account_id: 2925,
      steam_id: "76561198049745649",
      nickname: "sububobi",
      discord_linked: 1,
      is_valid_work_email: 1,
      is_valid_full_name: 1,
      work_email_verified: true
    });
  });

  it("should return 404 when steam_id not found", async () => {
    const response = await request(app).get(
      `/api/v1/players/123123123/details`
    );
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({
      type: "about:blank",
      title: "Not Found",
      status: 404,
      detail: "User not found",
      instance: "/api/v1/players/123123123/details"
    });
  });
});
