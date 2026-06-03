import {
  RoundEndReasonInfo,
  type MatchGameAfterplantRound
} from "@eggosystem/types";

export const T_WIN_REASONS: RoundEndReasonInfo[] = [
  RoundEndReasonInfo.TargetBombed,
  RoundEndReasonInfo.T_Win
];

const ROUND_END_LABEL: Record<RoundEndReasonInfo, string> = {
  [RoundEndReasonInfo.BombDefused]: "Defused",
  [RoundEndReasonInfo.TargetBombed]: "Bombed",
  [RoundEndReasonInfo.TargetSaved]: "Time",
  [RoundEndReasonInfo.T_Win]: "Elim",
  [RoundEndReasonInfo.CT_WIN]: "Elim"
};

export interface AfterplantRoundOutcome {
  winnerTeamName: string;
  planterHeld: boolean;
  /** Single outcome phrase — avoids repeating held/retaken alongside Defused, Bombed, Elim, etc. */
  outcomeLabel: string;
  winnerColor: string;
}

/** One label for the chip: end reason alone (it already implies held vs retaken). */
export function getAfterplantOutcomeLabel(
  roundEndReason: RoundEndReasonInfo
): string {
  return ROUND_END_LABEL[roundEndReason];
}

export function getAfterplantRoundOutcome(
  round: MatchGameAfterplantRound,
  tColor: string,
  ctColor: string
): AfterplantRoundOutcome {
  const planterHeld = T_WIN_REASONS.includes(round.round_end_reason_info);
  return {
    planterHeld,
    winnerTeamName: planterHeld ? round.t_team_name : round.ct_team_name,
    outcomeLabel: getAfterplantOutcomeLabel(round.round_end_reason_info),
    winnerColor: planterHeld ? tColor : ctColor
  };
}

const TIMELINE_PAD = 3;

export function getAfterplantTimelineRange(
  kills: MatchGameAfterplantRound["kills_after_plant"],
  plantTime: number | null
): { timeMin: number; timeMax: number } {
  const times = [
    ...kills.map((k) => k.time_in_round),
    ...(plantTime != null ? [plantTime] : [])
  ];
  if (times.length === 0) {
    return { timeMin: 0, timeMax: 30 };
  }
  return {
    timeMin: Math.max(0, Math.min(...times) - TIMELINE_PAD),
    timeMax: Math.max(...times) + TIMELINE_PAD
  };
}

export function formatRoundTimeSeconds(seconds: number): string {
  const roundedTenth = Math.round(seconds * 10) / 10;
  if (Math.abs(roundedTenth - Math.round(roundedTenth)) < 0.05) {
    return `${Math.round(roundedTenth)}s`;
  }
  return `${roundedTenth.toFixed(1)}s`;
}

export function getTimelineAxisLabels(
  timeMin: number,
  timeMax: number
): number[] {
  const range = timeMax - timeMin;
  if (range <= 0) return [timeMin];

  const step =
    range <= 4 ? 0.5 : range <= 10 ? 1 : range <= 20 ? 2 : range <= 40 ? 5 : 10;

  const start = Math.ceil(timeMin / step - 1e-9) * step;
  const labels: number[] = [];
  for (let t = start; t <= timeMax + 1e-9; t += step) {
    labels.push(Math.round(t * 10) / 10);
  }
  return labels;
}

export function timeToTimelinePct(
  time: number,
  timeMin: number,
  timeMax: number
): number {
  const range = Math.max(timeMax - timeMin, 1);
  return Math.min(Math.max(((time - timeMin) / range) * 100, 0), 100);
}

export interface SituationStat {
  key: string;
  won: number;
  total: number;
}

export interface SiteWinRecord {
  won: number;
  total: number;
}

export interface TeamAfterplantSummary {
  attackWon: number;
  attackTotal: number;
  attackSiteA: SiteWinRecord;
  attackSiteB: SiteWinRecord;
  defendWon: number;
  defendTotal: number;
  defendSiteA: SiteWinRecord;
  defendSiteB: SiteWinRecord;
}

export function winPct(won: number, total: number): number {
  return total > 0 ? Math.round((won / total) * 100) : 0;
}

function siteWinRecord(
  rounds: MatchGameAfterplantRound[],
  site: "A" | "B",
  wonFn: (round: MatchGameAfterplantRound) => boolean
): SiteWinRecord {
  const siteRounds = rounds.filter((r) => r.plant_site === site);
  return {
    won: siteRounds.filter(wonFn).length,
    total: siteRounds.length
  };
}

export function computeTeamAfterplantSummary(
  attackRounds: MatchGameAfterplantRound[],
  defendRounds: MatchGameAfterplantRound[]
): TeamAfterplantSummary {
  const attackWon = attackRounds.filter((r) =>
    T_WIN_REASONS.includes(r.round_end_reason_info)
  ).length;
  const defendWon = defendRounds.filter(
    (r) => !T_WIN_REASONS.includes(r.round_end_reason_info)
  ).length;
  const attackHeld = (r: MatchGameAfterplantRound) =>
    T_WIN_REASONS.includes(r.round_end_reason_info);
  const defendRetaken = (r: MatchGameAfterplantRound) =>
    !T_WIN_REASONS.includes(r.round_end_reason_info);

  return {
    attackWon,
    attackTotal: attackRounds.length,
    attackSiteA: siteWinRecord(attackRounds, "A", attackHeld),
    attackSiteB: siteWinRecord(attackRounds, "B", attackHeld),
    defendWon,
    defendTotal: defendRounds.length,
    defendSiteA: siteWinRecord(defendRounds, "A", defendRetaken),
    defendSiteB: siteWinRecord(defendRounds, "B", defendRetaken)
  };
}

export function buildAfterplantSituations(
  attackRounds: MatchGameAfterplantRound[]
): SituationStat[] {
  const map = new Map<string, { won: number; total: number }>();
  for (const r of attackRounds) {
    const key = `${r.t_alive_at_plant}v${r.ct_alive_at_plant}`;
    const cur = map.get(key) ?? { won: 0, total: 0 };
    cur.total++;
    if (T_WIN_REASONS.includes(r.round_end_reason_info)) cur.won++;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.total - a.total);
}

export function buildRetakeSituations(
  defendRounds: MatchGameAfterplantRound[]
): SituationStat[] {
  const map = new Map<string, { won: number; total: number }>();
  for (const r of defendRounds) {
    const key = `${r.ct_alive_at_plant}v${r.t_alive_at_plant}`;
    const cur = map.get(key) ?? { won: 0, total: 0 };
    cur.total++;
    if (!T_WIN_REASONS.includes(r.round_end_reason_info)) cur.won++;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.total - a.total);
}
