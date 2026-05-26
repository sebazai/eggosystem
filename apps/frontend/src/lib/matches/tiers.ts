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

const TIER_CSS_VARS = {
  masters: "--tier-masters",
  challengers: "--tier-challengers",
  prospects: "--tier-prospects",
  default: "--tier-default"
} as const;

type BandKey = keyof typeof TIER_CSS_VARS;

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

function colorsFrom(cssVar: string): LeagueColors {
  return {
    color: `hsl(var(${cssVar}))`,
    bg: `hsl(var(${cssVar}) / 0.16)`,
    border: `hsl(var(${cssVar}) / 0.5)`
  };
}

/** Returns CSS color values for a DB league name. */
export function leagueColor(leagueName: string): LeagueColors {
  return colorsFrom(TIER_CSS_VARS[bandFor(leagueName)]);
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
  return colorsFrom(TIER_CSS_VARS[band]);
}
