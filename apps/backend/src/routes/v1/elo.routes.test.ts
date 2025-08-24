// Mock API key - set before importing app since middleware is created at require time
const TEST_API_KEY = "test-api-key-for-unit-tests";
process.env.BACKEND_SERVICE_API_KEY = TEST_API_KEY;

import request from "supertest";
import { app } from "../../app";
import { runQuery } from "../../db/mysqlRunQuery";
import { redisClient } from "../../utils/redisClient";

// Mock the database
jest.mock("../../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

// Mock Redis
jest.mock("../../utils/redisClient");
const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;

// Mock the logger
jest.mock("../../utils/app-logger");

describe("POST /api/v1/elo/stabilize", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Redis operations
    mockRedisClient.set.mockResolvedValue("OK");
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.keys.mockResolvedValue([]);
    mockRedisClient.mget.mockResolvedValue([]);
  });

  afterAll(() => {
    // Clean up environment variables
    delete process.env.BACKEND_SERVICE_API_KEY;
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
      ]) // League average rating query
      .mockResolvedValueOnce([{ team_id: 123 }]); // Team lookup query

    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .set("X-API-KEY", TEST_API_KEY)
      .send({
        playerId: "76561198000000000",
        currentValue: 280,
        season: "2024-spring",
        metadata: {
          timestamp: "2024-01-15T10:30:00Z",
          source: "kanaelo-calc"
        }
      })
      .expect(200);

    expect(response.body).toHaveProperty("stabilizedValue");
    expect(response.body.stabilizedValue).toBeGreaterThan(280); // Should be higher because player performed better than average
    expect(response.body).toHaveProperty("confidence");
    expect(response.body).toHaveProperty("adjustmentFactor");
    expect(response.body).toHaveProperty("metadata");
    expect(response.body.metadata).toHaveProperty("processed", true);
    expect(response.body.metadata).toHaveProperty(
      "method",
      "kanarating-stabilization"
    );
  });

  it("should return offered ELO when player has no current ELO", async () => {
    mockRunQuery.mockResolvedValueOnce([{ kana_elo: null }]);

    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .set("X-API-KEY", TEST_API_KEY)
      .send({
        playerId: "76561198000000000",
        currentValue: 280,
        season: "2024-spring"
      })
      .expect(200);

    expect(response.body).toEqual({
      stabilizedValue: 280,
      confidence: 0.1,
      adjustmentFactor: 1.0,
      metadata: {
        processed: false,
        timestamp: expect.any(String),
        method: "no-current-elo"
      }
    });
  });

  it("should return offered ELO when player has no kana rating data", async () => {
    mockRunQuery
      .mockResolvedValueOnce([{ kana_elo: 250 }])
      .mockResolvedValueOnce([]); // No season/league data

    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .set("X-API-KEY", TEST_API_KEY)
      .send({
        playerId: "76561198000000000",
        currentValue: 280,
        season: "2024-spring"
      })
      .expect(200);

    expect(response.body).toEqual({
      stabilizedValue: 280,
      confidence: 0.1,
      adjustmentFactor: 1.0,
      metadata: {
        processed: false,
        timestamp: expect.any(String),
        method: "no-game-data"
      }
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
          rowCount: 5, // Too small sample (less than 10)
          leagueAvgRating: 1.0
        }
      ]);

    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .set("X-API-KEY", TEST_API_KEY)
      .send({
        playerId: "76561198000000000", // Valid 17-digit Steam ID
        currentValue: 280,
        season: "2024-spring"
      })
      .expect(200);

    expect(response.body).toEqual({
      stabilizedValue: 280,
      confidence: 0.2,
      adjustmentFactor: 1.0,
      metadata: {
        processed: false,
        timestamp: expect.any(String),
        method: "insufficient-sample-size"
      }
    });
  });

  it("should validate required fields", async () => {
    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .set("X-API-KEY", TEST_API_KEY)
      .send({
        playerId: "76561198000000000",
        season: "2024-spring"
        // Missing currentValue
      })
      .expect(400);

    expect(response.body).toEqual({
      type: "about:blank",
      title: "Bad Request",
      status: 400,
      detail: "currentValue is required",
      instance: "/api/v1/elo/stabilize"
    });
  });

  it("should validate playerId format", async () => {
    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .set("X-API-KEY", TEST_API_KEY)
      .send({
        playerId: "invalid",
        currentValue: 280,
        season: "2024-spring"
      })
      .expect(400);

    expect(response.body).toEqual({
      type: "about:blank",
      title: "Bad Request",
      status: 400,
      detail: "playerId must be a valid 17-digit Steam ID",
      instance: "/api/v1/elo/stabilize"
    });
  });

  it("should cap currentValue at 400 when value exceeds maximum", async () => {
    // Mock database responses for the stabilizePlayerElo function
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
      ]) // League average rating query
      .mockResolvedValueOnce([{ team_id: 123 }]); // Team lookup query

    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .set("X-API-KEY", TEST_API_KEY)
      .send({
        playerId: "76561198000000000",
        currentValue: 500, // Above max of 400, should be capped
        season: "2024-spring"
      })
      .expect(200);

    // Should succeed with capped value
    expect(response.body).toHaveProperty("stabilizedValue");
    expect(response.body).toHaveProperty("confidence");
    expect(response.body).toHaveProperty("adjustmentFactor");
    expect(response.body).toHaveProperty("metadata");
  });

  it("should reject requests with invalid API key", async () => {
    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .set("X-API-KEY", "invalid-api-key")
      .send({
        playerId: "76561198000000000",
        currentValue: 280,
        season: "2024-spring"
      })
      .expect(401);

    expect(response.body).toEqual({
      type: "about:blank",
      title: "Unauthorized",
      status: 401,
      detail: "Invalid API key",
      instance: "/api/v1/elo/stabilize"
    });
  });

  it("should reject requests with missing API key", async () => {
    const response = await request(app)
      .post("/api/v1/elo/stabilize")
      .send({
        playerId: "76561198000000000",
        currentValue: 280,
        season: "2024-spring"
      })
      .expect(401);

    expect(response.body).toEqual({
      type: "about:blank",
      title: "Unauthorized",
      status: 401,
      detail: "API key required",
      instance: "/api/v1/elo/stabilize"
    });
  });
});
