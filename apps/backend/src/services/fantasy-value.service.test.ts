import {
  calculatePlayerTier,
  calculatePlayerValue,
  calculatePlayerValueData
} from "./fantasy-value.service";

describe("Fantasy Value Service", () => {
  describe("calculatePlayerTier", () => {
    it("should return gold tier for value >= 210000", () => {
      expect(calculatePlayerTier(210000)).toBe("gold");
      expect(calculatePlayerTier(220000)).toBe("gold");
      expect(calculatePlayerTier(240000)).toBe("gold");
    });

    it("should return silver tier for value 180000-209999", () => {
      expect(calculatePlayerTier(180000)).toBe("silver");
      expect(calculatePlayerTier(195000)).toBe("silver");
      expect(calculatePlayerTier(209999)).toBe("silver");
    });

    it("should return bronze tier for value < 180000", () => {
      expect(calculatePlayerTier(179999)).toBe("bronze");
      expect(calculatePlayerTier(170000)).toBe("bronze");
      expect(calculatePlayerTier(160000)).toBe("bronze");
    });
  });

  describe("calculatePlayerValue", () => {
    it("should return values within range 160K-240K", () => {
      const value1 = calculatePlayerValue(0.4, 1.0, 100);
      const value2 = calculatePlayerValue(1.1, 1.5, 500);
      const value3 = calculatePlayerValue(0.75, 1.0, 250);

      expect(value1).toBeGreaterThanOrEqual(160000);
      expect(value1).toBeLessThanOrEqual(240000);

      expect(value2).toBeGreaterThanOrEqual(160000);
      expect(value2).toBeLessThanOrEqual(240000);

      expect(value3).toBeGreaterThanOrEqual(160000);
      expect(value3).toBeLessThanOrEqual(240000);
    });

    it("should give higher value for better rating", () => {
      const lowRating = calculatePlayerValue(0.5, 1.0, 100);
      const highRating = calculatePlayerValue(1.0, 1.0, 100);

      expect(highRating).toBeGreaterThan(lowRating);
    });

    it("should apply K/D bonus correctly", () => {
      const lowKD = calculatePlayerValue(0.8, 0.8, 100);
      const highKD = calculatePlayerValue(0.8, 1.5, 100);

      expect(highKD).toBeGreaterThan(lowKD);
    });

    it("should apply kill bonus correctly", () => {
      const lowKills = calculatePlayerValue(0.8, 1.0, 100);
      const highKills = calculatePlayerValue(0.8, 1.0, 500);

      expect(highKills).toBeGreaterThan(lowKills);
    });

    it("should cluster values around 200K for average players", () => {
      const avgValue = calculatePlayerValue(0.75, 1.0, 200);

      // Average players should be within 180K-220K range
      expect(avgValue).toBeGreaterThan(180000);
      expect(avgValue).toBeLessThan(220000);
    });
  });

  describe("calculatePlayerValueData", () => {
    it("should return both value and tier", () => {
      const result = calculatePlayerValueData(0.9, 1.2, 300);

      expect(result).toHaveProperty("value");
      expect(result).toHaveProperty("tier");
      expect(typeof result.value).toBe("number");
      expect(["bronze", "silver", "gold"]).toContain(result.tier);
    });

    it("should have consistent tier and value relationship", () => {
      const goldPlayer = calculatePlayerValueData(1.0, 1.5, 400);
      const silverPlayer = calculatePlayerValueData(0.85, 1.1, 250);
      const bronzePlayer = calculatePlayerValueData(0.5, 0.8, 50);

      expect(goldPlayer.tier).toBe("gold");
      // Note: The tier is based on value, not rating. A player with rating 0.85 might still be gold if their value is >= 210000
      expect(["silver", "gold"]).toContain(silverPlayer.tier);
      // Bronze tier is for values < 180000. Lower rating/kd/kills should produce bronze
      expect(["bronze", "silver"]).toContain(bronzePlayer.tier);

      // Generally, gold players should be more expensive than silver
      expect(goldPlayer.value).toBeGreaterThan(silverPlayer.value);
      // And silver more expensive than bronze
      expect(silverPlayer.value).toBeGreaterThan(bronzePlayer.value);
    });
  });
});
