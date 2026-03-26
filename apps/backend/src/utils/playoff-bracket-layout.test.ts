import {
  buildRound1SeedPairs,
  buildSeedOrder,
  buildSeedPositionMap,
  getLowerBracketR1LayoutSlot,
  getLowerBracketR1LayoutSlotOrGuess,
  getUpperBracketR1SlotForSeed,
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

  describe("getUpperBracketR1SlotForSeed / getLowerBracketR1LayoutSlot", () => {
    it("maps seeds to UB R1 slot index for 16 teams", () => {
      const n = 16;
      expect(getUpperBracketR1SlotForSeed(1, n)).toBe(0);
      expect(getUpperBracketR1SlotForSeed(16, n)).toBe(0);
      expect(getUpperBracketR1SlotForSeed(8, n)).toBe(1);
      expect(getUpperBracketR1SlotForSeed(9, n)).toBe(1);
      expect(getUpperBracketR1SlotForSeed(4, n)).toBe(2);
      expect(getUpperBracketR1SlotForSeed(13, n)).toBe(2);
    });

    it("places losers of UB slots 0 and 1 in lower R1 slot 0", () => {
      const n = 16;
      expect(
        getLowerBracketR1LayoutSlot({
          seed1: 16,
          seed2: 8,
          bracketSize: n
        })
      ).toBe(0);
      expect(
        getLowerBracketR1LayoutSlot({
          seed1: 1,
          seed2: 9,
          bracketSize: n
        })
      ).toBe(0);
    });

    it("places losers of UB slots 2 and 3 in lower R1 slot 1", () => {
      const n = 16;
      expect(
        getLowerBracketR1LayoutSlot({
          seed1: 13,
          seed2: 5,
          bracketSize: n
        })
      ).toBe(1);
    });

    it("returns null for non-adjacent upper R1 slots", () => {
      const n = 16;
      expect(
        getLowerBracketR1LayoutSlot({
          seed1: 1,
          seed2: 4,
          bracketSize: n
        })
      ).toBeNull();
    });
  });

  describe("getLowerBracketR1LayoutSlotOrGuess", () => {
    it("infers column from one seed when opponent has no seed yet (FACEIT placeholder)", () => {
      const n = 16;
      expect(
        getLowerBracketR1LayoutSlotOrGuess({
          seed1: 13,
          seed2: undefined,
          bracketSize: n
        })
      ).toBe(1);
      expect(
        getLowerBracketR1LayoutSlotOrGuess({
          seed1: 16,
          seed2: undefined,
          bracketSize: n
        })
      ).toBe(0);
    });

    it("matches full slot when both seeds are known", () => {
      const n = 16;
      expect(
        getLowerBracketR1LayoutSlotOrGuess({
          seed1: 16,
          seed2: 8,
          bracketSize: n
        })
      ).toBe(0);
      expect(
        getLowerBracketR1LayoutSlotOrGuess({
          seed1: 15,
          seed2: 7,
          bracketSize: n
        })
      ).toBe(2);
    });
  });
});
