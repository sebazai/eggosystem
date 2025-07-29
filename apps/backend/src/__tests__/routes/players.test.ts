// Set environment variables before any imports
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.PRIVACY_POLICY_VERSION = "1";

import request from "supertest";
import express from "express";
import playerRouter from "../../routes/v1/player.routes";
import _ from "lodash";

describe("GET /players", () => {
  const app = express();
  app.use(express.json());
  app.use(playerRouter);

  it("/:steam_id/details", async () => {
    const response = await request(app).get("/76561198049745649/details");
    expect(response.status).toBe(200);
    expect(_.omit(response.body, "discord")).toStrictEqual({
      account_id: 2925,
      steam_id: "76561198049745649",
      nickname: "sububobi",
      is_valid_work_email: 1,
      is_valid_full_name: 1,
      has_accepted_latest_privacy_policy: 0,
      work_email_verified: false
    });
  });

  it("should return 404 when steam_id not found", async () => {
    const response = await request(app).get(`/123123123/details`);
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ message: "User not found" });
  });
});
