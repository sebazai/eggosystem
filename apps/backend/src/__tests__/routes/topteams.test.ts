import request from "supertest";
import { app } from "../../app";

interface TopTeamResponse {
  team_id: number;
  team_name: string;
  team_logo: string;
  league_name: string;
  matches_played: number;
  kana: number;
  rank: number;
}

describe("GET /api/v1/topteams", () => {
  // Test required parameters
  it("should return 400 when league_id is missing", async () => {
    const response = await request(app).get("/api/v1/topteams?season_id=11");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Missing required parameters: league_id and season_id are required"
    );
  });

  it("should return 400 when season_id is missing", async () => {
    const response = await request(app).get("/api/v1/topteams?league_id=1");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Missing required parameters: league_id and season_id are required"
    );
  });

  // Test invalid parameter types
  it("should return 400 when league_id is not a number", async () => {
    const response = await request(app).get(
      "/api/v1/topteams?league_id=abc&season_id=11"
    );
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Invalid parameter types: parameters must be numbers"
    );
  });

  it("should return 400 when season_id is not a number", async () => {
    const response = await request(app).get(
      "/api/v1/topteams?league_id=1&season_id=abc"
    );
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Invalid parameter types: parameters must be numbers"
    );
  });

  it("should return 400 when stage is not a number", async () => {
    const response = await request(app).get(
      "/api/v1/topteams?league_id=1&season_id=11&stage=abc"
    );
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Invalid parameter types: parameters must be numbers"
    );
  });

  it("should return 400 when map_id is not a number", async () => {
    const response = await request(app).get(
      "/api/v1/topteams?league_id=1&season_id=11&map_id=abc"
    );
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Invalid parameter types: parameters must be numbers"
    );
  });

  // Test successful responses
  it("should return top teams for Masters league in season 11", async () => {
    const response = await request(app).get(
      "/api/v1/topteams?league_id=1&season_id=11"
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    // Should return at most 5 teams
    expect(response.body.length).toBeLessThanOrEqual(5);

    // Verify response structure
    if (response.body.length > 0) {
      const team = response.body[0];
      expect(team).toHaveProperty("team_id");
      expect(team).toHaveProperty("team_name");
      expect(team).toHaveProperty("team_logo");
      expect(team).toHaveProperty("league_name");
      expect(team).toHaveProperty("matches_played");
      expect(team).toHaveProperty("kana");
      expect(team).toHaveProperty("rank");

      // Verify data types
      expect(typeof team.team_id).toBe("number");
      expect(typeof team.team_name).toBe("string");
      expect(typeof team.team_logo).toBe("string");
      expect(typeof team.league_name).toBe("string");
      expect(typeof team.matches_played).toBe("number");
      expect(typeof team.kana).toBe("number");
      expect(typeof team.rank).toBe("number");
    }
  });

  it("should return top teams for Masters league playoffs in season 11", async () => {
    const response = await request(app).get(
      "/api/v1/topteams?league_id=1&season_id=11&stage=2"
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeLessThanOrEqual(5);
  });

  it("should return top teams for specific map in Masters league", async () => {
    const response = await request(app).get(
      "/api/v1/topteams?league_id=1&season_id=11&map_id=1"
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeLessThanOrEqual(5);
  });

  // Test sorting and ranking
  it("should return teams sorted by kana rating in descending order", async () => {
    const response = await request(app).get(
      "/api/v1/topteams?league_id=1&season_id=11"
    );
    expect(response.status).toBe(200);

    if (response.body.length > 1) {
      for (let i = 1; i < response.body.length; i++) {
        expect(response.body[i - 1].kana).toBeGreaterThanOrEqual(
          response.body[i].kana
        );
      }
    }
  });

  it("should assign ranks correctly from 1 to 5", async () => {
    const response = await request(app).get(
      "/api/v1/topteams?league_id=1&season_id=11"
    );
    expect(response.status).toBe(200);

    if (response.body.length > 0) {
      const ranks = response.body.map((team: TopTeamResponse) => team.rank);
      const expectedRanks = Array.from(
        { length: response.body.length },
        (_, i) => i + 1
      );
      expect(ranks).toEqual(expectedRanks);
    }
  });
});
