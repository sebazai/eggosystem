import { seasonFormSchema } from "./SeasonForm.interface";
import { createMockSeasonFormRequestBody } from "./SeasonForm.test-utils";

describe("seasonFormSchema", () => {
  describe("min_players / max_players cross-field refinement", () => {
    it("passes when min_players is less than max_players", () => {
      const result = seasonFormSchema.safeParse(
        createMockSeasonFormRequestBody({ min_players: 5, max_players: 9 })
      );
      expect(result.success).toBe(true);
    });

    it("passes when min_players equals max_players", () => {
      const result = seasonFormSchema.safeParse(
        createMockSeasonFormRequestBody({ min_players: 5, max_players: 5 })
      );
      expect(result.success).toBe(true);
    });

    it("fails when min_players is greater than max_players", () => {
      const result = seasonFormSchema.safeParse(
        createMockSeasonFormRequestBody({ min_players: 6, max_players: 5 })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.max_players).toContain(
          "Minimum players must be less than or equal to maximum players"
        );
      }
    });

    it("fails when min_players is well above max_players", () => {
      const result = seasonFormSchema.safeParse(
        createMockSeasonFormRequestBody({ min_players: 10, max_players: 1 })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.max_players).toBeDefined();
      }
    });
  });

  describe("min_players field validation", () => {
    it("fails when min_players is 0 (below minimum of 1)", () => {
      const result = seasonFormSchema.safeParse(
        createMockSeasonFormRequestBody({ min_players: 0, max_players: 9 })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.min_players).toBeDefined();
      }
    });

    it("fails when min_players exceeds 20", () => {
      const result = seasonFormSchema.safeParse(
        createMockSeasonFormRequestBody({ min_players: 21, max_players: 25 })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.min_players).toBeDefined();
      }
    });

    it("passes at the lower boundary (min_players = 1)", () => {
      const result = seasonFormSchema.safeParse(
        createMockSeasonFormRequestBody({ min_players: 1, max_players: 9 })
      );
      expect(result.success).toBe(true);
    });

    it("passes at the upper boundary (min_players = 20, max_players = 20)", () => {
      const result = seasonFormSchema.safeParse(
        createMockSeasonFormRequestBody({ min_players: 20, max_players: 20 })
      );
      expect(result.success).toBe(true);
    });
  });

  describe("max_players field validation", () => {
    it("fails when max_players is 0 (below minimum of 1)", () => {
      const result = seasonFormSchema.safeParse(
        createMockSeasonFormRequestBody({ min_players: 1, max_players: 0 })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.max_players).toBeDefined();
      }
    });

    it("fails when max_players exceeds 20", () => {
      const result = seasonFormSchema.safeParse(
        createMockSeasonFormRequestBody({ min_players: 5, max_players: 21 })
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.max_players).toBeDefined();
      }
    });
  });
});
