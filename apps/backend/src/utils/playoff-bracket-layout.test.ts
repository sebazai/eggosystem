import {
  buildRound1SeedPairs,
  buildSeedOrder,
  buildSeedPositionMap,
  getBracketSizeFromMaxSeed,
  getLowerBracketEvenDropRoundLayoutSlotFromState,
  getLowerBracketR1LayoutSlot,
  getLowerBracketR1LayoutSlotOrGuess,
  getLowerSlotsInRound,
  getUpperBracketR1SlotForSeed,
  getUpperBracketSlotForSeeds,
  getUpperSlotsInRound,
  shouldSwapLowerDropRoundHomeAway
} from "./playoff-bracket-layout";

describe("playoff-bracket-layout", () => {
  describe("getBracketSizeFromMaxSeed", () => {
    it("rounds up to next power of two (12 teams → 16 bracket with byes implied)", () => {
      expect(getBracketSizeFromMaxSeed(12)).toBe(16);
      expect(getBracketSizeFromMaxSeed(9)).toBe(16);
      expect(getBracketSizeFromMaxSeed(7)).toBe(8);
    });

    it("returns exact power of two when max seed fills bracket", () => {
      expect(getBracketSizeFromMaxSeed(8)).toBe(8);
      expect(getBracketSizeFromMaxSeed(16)).toBe(16);
    });
  });

  describe("slot counts by bracket size", () => {
    it("8-team: upper R1 has 4 matches, lower R1 has 2 slots", () => {
      expect(getUpperSlotsInRound(8, 1)).toBe(4);
      expect(getLowerSlotsInRound(8, 1)).toBe(2);
    });

    it("16-team: upper R1 has 8 matches, lower R1 has 4 slots", () => {
      expect(getUpperSlotsInRound(16, 1)).toBe(8);
      expect(getLowerSlotsInRound(16, 1)).toBe(4);
    });

    it("32-team: upper R1 has 16 matches, lower R1 has 8 slots", () => {
      expect(getUpperSlotsInRound(32, 1)).toBe(16);
      expect(getLowerSlotsInRound(32, 1)).toBe(8);
    });
  });

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
    it("maps seeds to UB R1 slot index for 8 teams", () => {
      const n = 8;
      expect(getUpperBracketR1SlotForSeed(1, n)).toBe(0);
      expect(getUpperBracketR1SlotForSeed(8, n)).toBe(0);
      expect(getUpperBracketR1SlotForSeed(4, n)).toBe(1);
      expect(getUpperBracketR1SlotForSeed(5, n)).toBe(1);
      expect(getUpperBracketR1SlotForSeed(2, n)).toBe(2);
      expect(getUpperBracketR1SlotForSeed(7, n)).toBe(2);
    });

    it("lower R1 column 0 for 8 teams: losers of UB slots 0 and 1", () => {
      const n = 8;
      expect(
        getLowerBracketR1LayoutSlot({
          seed1: 8,
          seed2: 4,
          bracketSize: n
        })
      ).toBe(0);
      expect(
        getLowerBracketR1LayoutSlot({
          seed1: 1,
          seed2: 5,
          bracketSize: n
        })
      ).toBe(0);
    });

    it("lower R1 column 1 for 8 teams: losers of UB slots 2 and 3", () => {
      const n = 8;
      expect(
        getLowerBracketR1LayoutSlot({
          seed1: 2,
          seed2: 3,
          bracketSize: n
        })
      ).toBe(1);
    });

    it("16-bracket with max seed 12 still uses 16-team FACEIT pairs (byes at seeds 13–16)", () => {
      const n = 16;
      expect(getBracketSizeFromMaxSeed(12)).toBe(n);
      expect(getUpperBracketR1SlotForSeed(12, n)).toBe(3);
      expect(getUpperBracketR1SlotForSeed(2, n)).toBe(4);
      expect(
        getLowerBracketR1LayoutSlot({
          seed1: 12,
          seed2: 2,
          bracketSize: n
        })
      ).toBe(1);
    });

    it("32-team lower R1: losers of UB slots 6 and 7 → column 3 (e.g. seeds 5 and 12)", () => {
      const n = 32;
      expect(getUpperBracketR1SlotForSeed(5, n)).toBe(6);
      expect(getUpperBracketR1SlotForSeed(12, n)).toBe(7);
      expect(
        getLowerBracketR1LayoutSlot({
          seed1: 5,
          seed2: 12,
          bracketSize: n
        })
      ).toBe(3);
    });

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

  describe("shouldSwapLowerDropRoundHomeAway", () => {
    it("swaps when team1 is the LB feeder and team2 is the fresh upper dropper", () => {
      const prev = new Set([103, 1016]);
      expect(
        shouldSwapLowerDropRoundHomeAway({
          team1Id: 103,
          team2Id: 108,
          prevRoundLbTeamIds: prev
        })
      ).toBe(true);
    });

    it("does not swap when team1 is already the upper dropper", () => {
      const prev = new Set([103]);
      expect(
        shouldSwapLowerDropRoundHomeAway({
          team1Id: 108,
          team2Id: 103,
          prevRoundLbTeamIds: prev
        })
      ).toBe(false);
    });

    it("returns false when both teams played the previous lower round (unexpected)", () => {
      const prev = new Set([101, 102]);
      expect(
        shouldSwapLowerDropRoundHomeAway({
          team1Id: 101,
          team2Id: 102,
          prevRoundLbTeamIds: prev
        })
      ).toBe(false);
    });
  });

  describe("getLowerBracketEvenDropRoundLayoutSlotFromState", () => {
    it("LB2: identifies upper dropper by missing LB1 slot (feeder last column → slot 3)", () => {
      const bracketSize = 16;
      const prev = new Map<number, number>([[101, 3]]);
      const loserUbR2Match0 = 8;
      const slot = getLowerBracketEvenDropRoundLayoutSlotFromState({
        bracketSize,
        lowerRound: 2,
        seed1: 3,
        seed2: loserUbR2Match0,
        team1Id: 101,
        team2Id: 202,
        prevRoundParticipantSlotByTeamId: prev
      });
      expect(slot).toBe(3);
    });

    it("LB2: returns null when both sides have a previous lower slot", () => {
      const prev = new Map<number, number>([
        [101, 0],
        [202, 1]
      ]);
      expect(
        getLowerBracketEvenDropRoundLayoutSlotFromState({
          bracketSize: 16,
          lowerRound: 2,
          seed1: 3,
          seed2: 8,
          team1Id: 101,
          team2Id: 202,
          prevRoundParticipantSlotByTeamId: prev
        })
      ).toBeNull();
    });
  });
});
