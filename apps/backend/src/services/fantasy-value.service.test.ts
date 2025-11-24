import {
  calculatePlayerTier,
  calculatePlayerValue,
  calculatePlayerValueData
} from "./fantasy-value.service";

describe("Fantasy Value Service", () => {
  describe("calculatePlayerTier", () => {
    it("should return gold tier for rating >= 0.95", () => {
      expect(calculatePlayerTier(0.95)).toBe("gold");
      expect(calculatePlayerTier(1.0)).toBe("gold");
      expect(calculatePlayerTier(1.3)).toBe("gold");
    });

    it("should return silver tier for rating 0.80-0.94", () => {
      expect(calculatePlayerTier(0.8)).toBe("silver");
      expect(calculatePlayerTier(0.85)).toBe("silver");
      expect(calculatePlayerTier(0.94)).toBe("silver");
    });

    it("should return bronze tier for rating < 0.80", () => {
      expect(calculatePlayerTier(0.79)).toBe("bronze");
      expect(calculatePlayerTier(0.5)).toBe("bronze");
      expect(calculatePlayerTier(0.4)).toBe("bronze");
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
      const bronzePlayer = calculatePlayerValueData(0.6, 0.9, 150);

      expect(goldPlayer.tier).toBe("gold");
      expect(silverPlayer.tier).toBe("silver");
      expect(bronzePlayer.tier).toBe("bronze");

      // Generally, gold players should be more expensive than silver
      expect(goldPlayer.value).toBeGreaterThan(silverPlayer.value);
      // And silver more expensive than bronze
      expect(silverPlayer.value).toBeGreaterThan(bronzePlayer.value);
    });
  });
});
