import {
  buildRound1SeedPairs,
  buildSeedOrder,
  buildSeedPositionMap,
  getUpperBracketSlotForSeeds
} from "./playoff-bracket-layout";

describe("playoff-bracket-layout", () => {
  describe("buildSeedOrder / buildRound1SeedPairs", () => {
    it("builds FACEIT seed order for 8", () => {
      expect(buildSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
      expect(buildRound1SeedPairs(8)).toEqual([
        [1, 8],
        [4, 5],
        [2, 7],
        [3, 6]
      ]);
    });

    it("builds FACEIT seed order for 16", () => {
      expect(buildSeedOrder(16)).toEqual([
        1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11
      ]);
      expect(buildRound1SeedPairs(16)).toEqual([
        [1, 16],
        [8, 9],
        [4, 13],
        [5, 12],
        [2, 15],
        [7, 10],
        [3, 14],
        [6, 11]
      ]);
    });
  });

  describe("getUpperBracketSlotForSeeds", () => {
    it("places R1 slots according to FACEIT order (8 team bracket)", () => {
      const bracketSize = 8;
      const seedPos = buildSeedPositionMap(bracketSize);
      const slot = (a: number, b: number): number | null =>
        getUpperBracketSlotForSeeds({
          bracketSize,
          round: 1,
          seed1: a,
          seed2: b,
          seedPos
        });

      expect(slot(1, 8)).toBe(0);
      expect(slot(4, 5)).toBe(1);
      expect(slot(2, 7)).toBe(2);
      expect(slot(3, 6)).toBe(3);
    });

    it("handles BYE by mirroring seed", () => {
      const bracketSize = 8;
      const seedPos = buildSeedPositionMap(bracketSize);
      expect(
        getUpperBracketSlotForSeeds({
          bracketSize,
          round: 1,
          seed1: 1,
          seed2: undefined,
          seedPos
        })
      ).toBe(0);
    });
  });
});
