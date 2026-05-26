export type TierKey = "premier" | "elite" | "challenge" | "open";

/** Returns `hsl(var(--tier-{key}))` for use as an inline CSS color value. */
export function tierCssColor(key: TierKey): string {
  return `hsl(var(--tier-${key}))`;
}

/** Returns a 50%-opacity border color for the given tier. */
export function tierCssBorderColor(key: TierKey): string {
  return `hsl(var(--tier-${key}) / 0.5)`;
}

/**
 * Maps a league name string (as returned by the API) to a tier key.
 * Falls back to "open" for unknown/lower divisions.
 */
export function leagueNameToTierKey(leagueName: string): TierKey {
  const lower = leagueName.toLowerCase();
  if (lower.includes("masters")) return "premier";
  if (lower.includes("challengers") || lower.includes("elite")) return "elite";
  if (lower.includes("prospects") || lower.includes("challenge")) {
    return "challenge";
  }
  return "open";
}

/**
 * Maps a numeric tier (league.tier from the API) to a tier key.
 * Tiers 1–3 map to premier/elite/challenge; 4 and above map to open.
 */
export function numericTierToKey(tier: number): TierKey {
  if (tier === 1) return "premier";
  if (tier === 2) return "elite";
  if (tier === 3) return "challenge";
  return "open";
}
