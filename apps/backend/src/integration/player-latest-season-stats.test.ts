import request from "supertest";
import { app } from "../../app";

describe("GET /api/v1/players/:steam_id/latest-season-stats", () => {
  it("should return player stats from latest season", async () => {
    const response = await request(app)
      .get("/api/v1/players/76561197967885016/latest-season-stats")
      .expect(200);

    expect(response.body).toEqual({
      steam_id: "76561197967885016",
      nickname: "enzoj",
      latest_season_id: 14,
      avg_kana_rating: 0.82,
      kpd: 0.92,
      adr: 80.0,
      level: 4
    });
  });

  it("should return 404 for non-existent player", async () => {
    const response = await request(app)
      .get("/api/v1/players/12345678901234567/latest-season-stats")
      .expect(404);

    expect(response.body).toEqual({
      message: "Player stats not found for latest season"
    });
  });
});
