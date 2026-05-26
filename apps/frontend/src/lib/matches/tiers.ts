/** Formats a raw DB league name for display. "div5" → "Div 5"; "div11" → "Div 11". */
export function formatLeagueName(name: string): string {
  const m = name.match(/^div(\d+)$/i);
  return m ? `Div ${m[1]}` : name;
}

export interface LeagueColors {
  /** Foreground / icon color */
  color: string;
  /** 16%-opacity background */
  bg: string;
  /** 50%-opacity border */
  border: string;
}

// Three distinct colors for the top three tiers; everything else gets a neutral.
// HSL values are softened (~20% lower saturation, slightly higher lightness) from
// the original design-spec palette, which was too vivid for a dark UI.
const BANDS = {
  masters: [35, 78, 56] as const, // warm amber
  challengers: [262, 68, 68] as const, // soft lavender
  prospects: [199, 74, 58] as const, // sky blue
  default: [215, 12, 55] as const // cool grey (div3 and below)
};

type BandKey = keyof typeof BANDS;

function bandFor(leagueName: string): BandKey {
  const lower = leagueName.toLowerCase();
  // --- Top tier: Masters / Pro ---
  if (lower.includes("semi-pro") || lower.includes("semipro"))
    return "challengers";
  if (lower.includes("masters") || /\bpro\b/.test(lower)) return "masters";
  // --- Second tier: Challengers / Elite ---
  if (lower.includes("challengers") || lower.includes("elite"))
    return "challengers";
  // --- Third tier: Prospects / Challenge / MKT / div2 ---
  if (
    lower.includes("prospects") ||
    lower.includes("challenge") ||
    lower === "mkt" ||
    lower === "div2"
  ) {
    return "prospects";
  }
  // Everything else (div3–div11, kanakahakka, …) gets the neutral default
  return "default";
}

function colorsFrom([h, s, l]: readonly [
  number,
  number,
  number
]): LeagueColors {
  return {
    color: `hsl(${h} ${s}% ${l}%)`,
    bg: `hsl(${h} ${s}% ${l}% / 0.16)`,
    border: `hsl(${h} ${s}% ${l}% / 0.5)`
  };
}

/** Returns CSS color values for a DB league name. */
export function leagueColor(leagueName: string): LeagueColors {
  return colorsFrom(BANDS[bandFor(leagueName)]);
}

/** Returns CSS color values for a numeric SeasonLeague.tier (used by calendar / TierDot). */
export function numericTierColors(tier: number): LeagueColors {
  const band: BandKey =
    tier === 1
      ? "masters"
      : tier === 2
        ? "challengers"
        : tier === 3
          ? "prospects"
          : "default";
  return colorsFrom(BANDS[band]);
}
