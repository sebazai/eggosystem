import request from "supertest";
import { app } from "../app";

describe("Utility Metrics Tests", () => {
  it("should calculate correct utility metrics for player with good utility usage", async () => {
    const response = await request(app)
      .get("/api/v1/filters/players/76561198100952924/skill-diagram")
      .expect(200);

    const { body } = response;

    // Test overall utility score
    expect(body.steam_id).toBe("76561198100952924");
    expect(body.nickname).toBe("ville1");
    expect(body.utility).toBeGreaterThan(60);
    expect(body.utility).toBeLessThan(70);

    // Test specific utility metrics
    const metrics = body.detailed_metrics;

    // Utility metrics
    expect(metrics.flash_assists).toBeCloseTo(0.0675, 4);
    expect(metrics.enemies_flashed).toBeCloseTo(0.6685, 4);
    expect(metrics.enemies_flashed_duration).toBeCloseTo(2.91, 2);
    expect(metrics.utility_damage).toBeCloseTo(7.14, 2);
    expect(metrics.he_damage_per_round).toBeCloseTo(3.53, 2);
    expect(metrics.molotov_damage_per_round).toBeCloseTo(1.78, 2);
    expect(metrics.teammates_flashed_inverse).toBeCloseTo(0.26, 2);
    expect(metrics.flash_assists_per_flash).toBeCloseTo(0.09, 2);
    expect(metrics.enemies_flashed_per_flash).toBeCloseTo(0.88, 2);
    expect(metrics.teammates_flashed_per_flash).toBeCloseTo(0.74, 2);
  });

  it("should calculate correct utility metrics for player with low flash assists", async () => {
    const response = await request(app)
      .get("/api/v1/filters/players/76561198049745649/skill-diagram")
      .expect(200);

    const { body } = response;

    // Test overall utility score
    expect(body.steam_id).toBe("76561198049745649");
    expect(body.nickname).toBe("sububobi");
    expect(body.utility).toBe(43);

    // Test specific utility metrics
    const metrics = body.detailed_metrics;

    // Utility metrics - the focus of our recent changes
    expect(metrics.flash_assists).toBeCloseTo(0.0033, 4);
    expect(metrics.enemies_flashed).toBeCloseTo(0.2857, 4);
    expect(metrics.enemies_flashed_duration).toBeCloseTo(2.46, 2);
    expect(metrics.utility_damage).toBeCloseTo(5.87, 2);
    expect(metrics.he_damage_per_round).toBeCloseTo(4.33, 2);
    expect(metrics.molotov_damage_per_round).toBeCloseTo(1.53, 2);
    expect(metrics.teammates_flashed_inverse).toBeCloseTo(0.15, 2);
    expect(metrics.flash_assists_per_flash).toBeCloseTo(0.01, 2);
    expect(metrics.enemies_flashed_per_flash).toBeCloseTo(1.11, 2);
    expect(metrics.teammates_flashed_per_flash).toBeCloseTo(0.85, 2);
  });

  it("should properly calculate utility score based on weighted metrics", async () => {
    // Get both players' data
    const player1 = await request(app)
      .get("/api/v1/filters/players/76561198100952924/skill-diagram")
      .expect(200);

    const player2 = await request(app)
      .get("/api/v1/filters/players/76561198049745649/skill-diagram")
      .expect(200);

    // Player with higher flash assists and balanced utility damage should have higher utility score
    expect(player1.body.utility).toBeGreaterThan(player2.body.utility);

    // Verify the difference is reasonable (not too extreme)
    const utilityScoreDifference = player1.body.utility - player2.body.utility;
    expect(utilityScoreDifference).toBeGreaterThan(20); // Significant difference
    expect(utilityScoreDifference).toBeLessThan(40); // But not extreme
  });
});
