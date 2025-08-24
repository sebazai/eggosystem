import { redisClient, expireIn30Days } from "../utils/redisClient";

// Test data for a team flag
// Use the current active season (season 16)
const CURRENT_SEASON = 16;

const testFlag = {
  season_id: CURRENT_SEASON,
  league_id: 1,
  team_id: 123,
  flagged: true,
  reason: "Test flag - Team has 3 players with >15 ELO adjustment",
  flagged_players: [
    "76561198123456789",
    "76561198987654321",
    "76561198111222333"
  ],
  timestamp: new Date().toISOString()
};

// Test data for ELO adjustments
const testAdjustments = [
  {
    steam_id: "76561198123456789",
    season_id: CURRENT_SEASON,
    league_id: 1,
    team_id: 123,
    offered_elo: 200,
    adjusted_elo: 220,
    adjustment_reason: "stabilized",
    timestamp: new Date().toISOString()
  },
  {
    steam_id: "76561198987654321",
    season_id: CURRENT_SEASON,
    league_id: 1,
    team_id: 123,
    offered_elo: 180,
    adjusted_elo: 200,
    adjustment_reason: "stabilized",
    timestamp: new Date().toISOString()
  },
  {
    steam_id: "76561198111222333",
    season_id: CURRENT_SEASON,
    league_id: 1,
    team_id: 123,
    offered_elo: 220,
    adjusted_elo: 240,
    adjustment_reason: "stabilized",
    timestamp: new Date().toISOString()
  }
];

async function createTestData() {
  try {
    // Store the team flag
    const flagKey = `team-flag:s${testFlag.season_id}:l${testFlag.league_id}:${testFlag.team_id}`;
    await redisClient.set(
      flagKey,
      JSON.stringify(testFlag),
      "EX",
      expireIn30Days
    );
    console.warn(`Team flag stored with key: ${flagKey}`);

    // Store the ELO adjustments
    for (const adjustment of testAdjustments) {
      const adjustmentKey = `elo-adjustment:s${adjustment.season_id}:l${adjustment.league_id}:${adjustment.steam_id}`;
      await redisClient.set(
        adjustmentKey,
        JSON.stringify(adjustment),
        "EX",
        expireIn30Days
      );
      console.warn(`ELO adjustment stored with key: ${adjustmentKey}`);
    }

    console.warn("Test data created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating test data:", error);
    process.exit(1);
  }
}

// Handle the promise properly
createTestData().catch((error) => {
  console.error("Failed to create test data:", error);
  process.exit(1);
});
