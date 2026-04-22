export type InsightCategory =
  | "openings" // OD-*: opening duel chains and consequences
  | "timing" // SP-*, CP-*: stagger, co-peek, collapse speed
  | "trades" // TR-*: trade support, denial, spacing
  | "flashes" // FL-*: flash chains, friendly flashes
  | "execution" // EX-*, NA-*: site commitment, entry converts
  | "retakes" // RA-*, RC-*: retake rates, counts at plant
  | "economy" // FB-*: force buy discipline
  | "impact" // WP-*, EK-*, SI-*: win probability, lurk effectiveness
  | "clutch"; // CL-*: clutch situations by count

export interface InsightResult {
  /** Template ID, e.g. "OD-1", "RA-3", "CP-1" */
  id: string;
  category: InsightCategory;
  polarity: "strength" | "concern";
  /** Severity — may be escalated by round importance amplifier */
  severity: "critical" | "notable" | "info";
  side: "CT" | "T";
  team_id: number;
  /** Short label, e.g. "Opening Death → Site Plant" */
  headline: string;
  /** Full narrative with values already interpolated server-side */
  story: string;
  /** Round numbers to cross-reference in demo */
  evidence_rounds: number[];
  /** Steam IDs of the players named in the story */
  players: string[];
}

export interface MatchGameInsightsTeam {
  team_id: number;
  team_name: string;
  team_logo: string | null;
  ct: InsightResult[];
  t: InsightResult[];
}

export interface MatchGameInsights {
  teams: MatchGameInsightsTeam[];
}
