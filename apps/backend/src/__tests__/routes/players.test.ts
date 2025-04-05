import request from "supertest";
import express from "express";
import playerRouter from "../../routes/v1/player.routes";

describe("GET /players", () => {
  const app = express();
  app.use(express.json());
  app.use(playerRouter);

  it("should return 200", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });

  it("should return 404 when steam_id not found", async () => {
    const response = await request(app).get(`/123123123`);
    expect(response.status).toBe(404);
  });
});
