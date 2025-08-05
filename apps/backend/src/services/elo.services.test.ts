import { stabilizePlayerElo } from "../../services/elo.services";
import { redisClient } from "../../utils/redisClient";

// Mock Redis client
jest.mock("../../utils/redisClient", () => ({
  redisClient: {
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    keys: jest.fn().mockResolvedValue([]),
    mget: jest.fn().mockResolvedValue([])
  },
  expireIn7Days: 7 * 24 * 60 * 60,
  expireIn30Days: 30 * 24 * 60 * 60
}));

describe("ELO Stabilization Service", () => {
  const _mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should stabilize ELO based on player stats", async () => {
    const playerId = "76561197967885016";
    const currentValue = 140;
    const season = "5";

    // Call the service function directly
    const result = await stabilizePlayerElo(playerId, currentValue, season);

    // Verify the result structure and values
    expect(result).toBeDefined();
    expect(result.stabilizedValue).toBeGreaterThan(currentValue);
    expect(result.metadata.processed).toBe(true);
    expect(result.metadata.method).toBe("kanarating-stabilization");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("adjustmentFactor");
  });
});
