import request from "supertest";
import { app } from "../../../app";
import { runQuery } from "../../../db/mysqlRunQuery";

// Mock the database
jest.mock("../../../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

// Mock the logger
jest.mock("../../../utils/app-logger");

describe("POST /api/v1/elo/stabilize", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should stabilize ELO for a player with valid data", async () => {
    // Mock current player ELO
    mockRunQuery
      .mockResolvedValueOnce([{ kana_elo: 250 }]) // Current ELO query
      .mockResolvedValueOnce([
        {
          season_id: 11,
          league_id: 1,
          avg_kana_rating: 1.15
        }
      ]) // Latest season and league query
      .mockResolvedValueOnce([
        {
          avg_player_rating: 1.1
        }
      ]) // Player's average rating query
      .mockResolvedValueOnce([
        {
          rowCount: 150,
          leagueAvgRating: 1.0
        }
      ]); // League average rating query

    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .send({
        steam_id: "76561198000000000",
        offered_elo: 280
      })
      .expect(200);

    expect(response.body).toHaveProperty("adjusted_elo");
    expect(response.body.adjusted_elo).toBeGreaterThan(280); // Should be higher because player performed better than average
    expect(response.body).toHaveProperty("details");
    expect(response.body.details).toHaveProperty("current_elo", 250);
    expect(response.body.details).toHaveProperty("offered_elo", 280);
    expect(response.body.details).toHaveProperty("player_rating", 1.15);
    expect(response.body.details).toHaveProperty("league_avg_rating", 1.0);
  });

  it("should return offered ELO when player has no current ELO", async () => {
    mockRunQuery.mockResolvedValueOnce([{ kana_elo: null }]);

    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .send({
        steam_id: "76561198000000000",
        offered_elo: 280
      })
      .expect(200);

    expect(response.body).toEqual({
      adjusted_elo: 280,
      reason: "No current ELO found for player"
    });
  });

  it("should return offered ELO when player has no kana rating data", async () => {
    mockRunQuery
      .mockResolvedValueOnce([{ kana_elo: 250 }])
      .mockResolvedValueOnce([]); // No season/league data

    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .send({
        steam_id: "76561198000000000",
        offered_elo: 280
      })
      .expect(200);

    expect(response.body).toEqual({
      adjusted_elo: 280,
      reason: "No season or league data found for player"
    });
  });

  it("should return offered ELO when sample size is too small", async () => {
    mockRunQuery
      .mockResolvedValueOnce([{ kana_elo: 250 }])
      .mockResolvedValueOnce([
        {
          season_id: 11,
          league_id: 1,
          avg_kana_rating: 1.15
        }
      ])
      .mockResolvedValueOnce([
        {
          avg_player_rating: 1.1
        }
      ])
      .mockResolvedValueOnce([
        {
          rowCount: 50, // Too small sample
          leagueAvgRating: 1.0
        }
      ]);

    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .send({
        steam_id: "76561198000000000",
        offered_elo: 280
      })
      .expect(200);

    expect(response.body).toEqual({
      adjusted_elo: 280,
      reason: "Sample size too small (50 players, minimum 100 required)"
    });
  });

  it("should validate required fields", async () => {
    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .send({
        steam_id: "76561198000000000"
        // Missing offered_elo
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error.message).toContain("offered_elo");
  });

  it("should validate steam_id format", async () => {
    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .send({
        steam_id: "invalid",
        offered_elo: 280
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error.message).toContain("steam_id");
  });

  it("should validate offered_elo is a positive number", async () => {
    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .send({
        steam_id: "76561198000000000",
        offered_elo: -50
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error.message).toContain(
      "offered_elo must be a positive number"
    );
  });

  it("should apply different multiplier scaling for high ELO players", async () => {
    mockRunQuery
      .mockResolvedValueOnce([{ kana_elo: 350 }]) // High ELO player
      .mockResolvedValueOnce([
        {
          season_id: 11,
          league_id: 1,
          avg_kana_rating: 1.2
        }
      ])
      .mockResolvedValueOnce([
        {
          avg_player_rating: 1.1
        }
      ])
      .mockResolvedValueOnce([
        {
          rowCount: 150,
          leagueAvgRating: 1.0
        }
      ]);

    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .send({
        steam_id: "76561198000000000",
        offered_elo: 400 // High offered ELO
      })
      .expect(200);

    expect(response.body).toHaveProperty("adjusted_elo");
    // For high ELO (>270), the multiplier range should be smaller (±0.1 vs ±0.2)
    const adjustment = Math.abs(response.body.adjusted_elo - 400);
    expect(adjustment).toBeLessThan(80); // Should be a smaller adjustment for high ELO
  });
});
