import { KANA_TIERS, type KanaTier } from "@eggosystem/types";

/**
 * A single selectable tier in the kana leaderboard dropdown, with a
 * human-readable label.
 */
interface KanaTierOption {
  value: KanaTier;
  label: string;
}

/**
 * A labelled group of tier options for the dropdown — broad groupings are
 * listed first, then their numbered sub-ranks.
 */
export interface KanaTierOptionGroup {
  label: string;
  options: KanaTierOption[];
}

/**
 * Tier dropdown groups, ordered highest rank first (TOP_COCK → EGG).
 *
 * Every value here is a member of the shared `KANA_TIERS` union; the grouping
 * is purely presentational for the dropdown and does not affect the API query.
 */
export const KANA_TIER_OPTION_GROUPS: KanaTierOptionGroup[] = [
  {
    label: "Top Cock",
    options: [{ value: "TOP_COCK", label: "Top Cock (Top 10)" }]
  },
  {
    label: "Cock",
    options: [
      { value: "COCK", label: "Cock (All)" },
      { value: "COCK_1", label: "Cock 1" },
      { value: "COCK_2", label: "Cock 2" },
      { value: "COCK_3", label: "Cock 3" }
    ]
  },
  {
    label: "Chicken",
    options: [
      { value: "CHICKEN", label: "Chicken (All)" },
      { value: "CHICKEN_1", label: "Chicken 1" },
      { value: "CHICKEN_2", label: "Chicken 2" },
      { value: "CHICKEN_3", label: "Chicken 3" }
    ]
  },
  {
    label: "Chick",
    options: [
      { value: "CHICK", label: "Chick (All)" },
      { value: "CHICK_1", label: "Chick 1" },
      { value: "CHICK_2", label: "Chick 2" },
      { value: "CHICK_3", label: "Chick 3" }
    ]
  },
  {
    label: "Egg",
    options: [
      { value: "EGG", label: "Egg (All)" },
      { value: "EGG_1", label: "Egg 1" },
      { value: "EGG_2", label: "Egg 2" },
      { value: "EGG_3", label: "Egg 3" }
    ]
  }
];

/** The tier selected by default when the page first loads. */
export const DEFAULT_KANA_TIER: KanaTier = "TOP_COCK";

/**
 * Narrow an arbitrary string (e.g. the value emitted by the tier dropdown) to a
 * valid `KanaTier`, avoiding a type assertion at the call site.
 */
export const isKanaTier = (value: string): value is KanaTier =>
  KANA_TIERS.some((tier) => tier === value);
