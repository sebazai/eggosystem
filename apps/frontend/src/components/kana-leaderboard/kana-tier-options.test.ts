import { KANA_TIERS } from "@eggosystem/types";
import {
  DEFAULT_KANA_TIER,
  KANA_TIER_OPTION_GROUPS,
  isKanaTier
} from "./kana-tier-options";

const flatOptionValues = KANA_TIER_OPTION_GROUPS.flatMap((group) =>
  group.options.map((option) => option.value)
);

describe("kana-tier-options", () => {
  it("offers exactly the shared KANA_TIERS values, with no extras or duplicates", () => {
    // The dropdown must surface every tier the API accepts — the broad
    // groupings (EGG, CHICK, CHICKEN, COCK, TOP_COCK) and each numbered
    // sub-rank (COCK_1..COCK_3, CHICKEN_1..CHICKEN_3, CHICK_1..CHICK_3,
    // EGG_1..EGG_3).
    expect([...flatOptionValues].sort()).toEqual([...KANA_TIERS].sort());
    expect(new Set(flatOptionValues).size).toBe(flatOptionValues.length);
  });

  it("includes each broad grouping", () => {
    for (const grouping of ["TOP_COCK", "COCK", "CHICKEN", "CHICK", "EGG"]) {
      expect(flatOptionValues).toContain(grouping);
    }
  });

  it("includes every numbered sub-rank", () => {
    for (const rank of ["COCK", "CHICKEN", "CHICK", "EGG"]) {
      for (const subrank of [1, 2, 3]) {
        expect(flatOptionValues).toContain(`${rank}_${subrank}`);
      }
    }
  });

  it("gives every option a non-empty human-readable label", () => {
    for (const group of KANA_TIER_OPTION_GROUPS) {
      expect(group.label.length).toBeGreaterThan(0);
      for (const option of group.options) {
        expect(option.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("defaults to a valid tier", () => {
    expect(KANA_TIERS).toContain(DEFAULT_KANA_TIER);
  });

  describe("isKanaTier", () => {
    it("accepts every valid tier", () => {
      for (const tier of KANA_TIERS) {
        expect(isKanaTier(tier)).toBe(true);
      }
    });

    it("rejects arbitrary strings", () => {
      for (const value of ["", "NOT_A_TIER", "cock", "TOP_COCK_4"]) {
        expect(isKanaTier(value)).toBe(false);
      }
    });
  });
});
