import type { MatchTeamSide, MatchWithStreamUrls } from "@eggosystem/types";

/**
 * Orders two participants as **left = home**, **right = away** when both
 * `side` values are explicit `home` / `away`. Otherwise preserves the given
 * order (legacy / API order).
 */
export function orderTwoByMatchTeamSideHomeLeftAway<
  T extends { side: MatchTeamSide }
>(first: T, second: T): [T, T] {
  if (first.side === "home" && second.side === "away") return [first, second];
  if (second.side === "home" && first.side === "away") return [second, first];
  return [first, second];
}

function hasName(value: unknown): value is { name: string } {
  if (!value || typeof value !== "object") return false;
  if (!Object.prototype.hasOwnProperty.call(value, "name")) return false;
  return typeof Reflect.get(value, "name") === "string";
}

function orderTwoByNameAsc<T extends { name: string }>(a: T, b: T): [T, T] {
  return a.name.localeCompare(b.name, "en", { sensitivity: "base" }) <= 0
    ? [a, b]
    : [b, a];
}

/**
 * Orders two participants with a deterministic fallback when sides are unknown.
 *
 * - If sides are explicit `home` / `away` → home-left, away-right.
 * - Otherwise, if both have names → sort by name (case-insensitive).
 * - Otherwise preserves given order.
 */
export function orderTwoParticipantsBySideHomeLeft<
  T extends { side: MatchTeamSide }
>(a: T, b: T): [T, T] {
  const [x, y] = orderTwoByMatchTeamSideHomeLeftAway(a, b);
  const sidesAreExplicitHomeAway =
    (x.side === "home" && y.side === "away") ||
    (x.side === "away" && y.side === "home");
  if (sidesAreExplicitHomeAway) return [x, y];

  if (hasName(x) && hasName(y)) return orderTwoByNameAsc(x, y);
  return [x, y];
}

/**
 * Same home-left/away-right rule for a two-element array.
 *
 * When sides are unknown, applies a deterministic fallback ordering by `name`
 * (case-insensitive) if both participants have names; otherwise preserves the
 * given order.
 */
export function orderMatchParticipantsBySideHomeLeft<
  T extends { side: MatchTeamSide }
>(teams: readonly T[]): T[] {
  if (teams.length !== 2) return [...teams];
  const a = teams[0];
  const b = teams[1];
  if (a === undefined || b === undefined) return [...teams];
  return [...orderTwoParticipantsBySideHomeLeft(a, b)];
}

export interface DualTeamRowSlot {
  team1_side: MatchTeamSide;
  team2_side: MatchTeamSide;
  team1_name: string;
  team2_name: string;
  team1_logo: string | null;
  team2_logo: string | null;
  team1_score: number;
  team2_score: number;
}

export function dualTeamRowToHomeLeftDisplay(row: DualTeamRowSlot): {
  left: { name: string; logo: string | null; score: number };
  right: { name: string; logo: string | null; score: number };
} {
  const slot1 = {
    side: row.team1_side,
    name: row.team1_name,
    logo: row.team1_logo,
    score: row.team1_score
  };
  const slot2 = {
    side: row.team2_side,
    name: row.team2_name,
    logo: row.team2_logo,
    score: row.team2_score
  };
  const [left, right] = orderTwoParticipantsBySideHomeLeft(slot1, slot2);
  return {
    left: { name: left.name, logo: left.logo, score: left.score },
    right: { name: right.name, logo: right.logo, score: right.score }
  };
}

export function dualTeamScoresToHomeLeftDisplay(row: {
  team1_score: number;
  team2_score: number;
  team1_side: MatchTeamSide;
  team2_side: MatchTeamSide;
  team1_name?: string;
  team2_name?: string;
}): { leftScore: number; rightScore: number } {
  const a = {
    side: row.team1_side,
    score: row.team1_score,
    name: row.team1_name
  };
  const b = {
    side: row.team2_side,
    score: row.team2_score,
    name: row.team2_name
  };
  const [l, r] =
    a.name && b.name
      ? orderTwoParticipantsBySideHomeLeft(a, b)
      : orderTwoByMatchTeamSideHomeLeftAway(a, b);
  return { leftScore: l.score, rightScore: r.score };
}

export type CalendarMatchHomeLeftInput = {
  match_team1: string;
  match_team2: string;
  teams?: MatchWithStreamUrls["teams"];
};

export function calendarMatchHomeLeftTeamNames(
  match: CalendarMatchHomeLeftInput
): {
  leftName: string;
  rightName: string;
} {
  const home = match.teams?.home;
  const away = match.teams?.away;
  if (home && away) {
    return {
      leftName: home.name,
      rightName: away.name
    };
  }
  const [left, right] = orderTwoParticipantsBySideHomeLeft(
    { side: null, name: match.match_team1 },
    { side: null, name: match.match_team2 }
  );
  return { leftName: left.name, rightName: right.name };
}

/** Title string with home on the left; legacy `match_team1` / `match_team2` order when sides unknown. */
export function calendarMatchVersusTitle(
  match: CalendarMatchHomeLeftInput
): string {
  const { leftName, rightName } = calendarMatchHomeLeftTeamNames(match);
  return `${leftName} vs ${rightName}`;
}

export function homeAwayScoresFromFocalVersusOpponent(input: {
  focalScore: number;
  opponentScore: number;
  focalSide: MatchTeamSide;
  opponentSide: MatchTeamSide;
}): { homeScore: number; awayScore: number } {
  const { focalScore, opponentScore, focalSide, opponentSide } = input;
  if (focalSide === "home" && opponentSide === "away") {
    return { homeScore: focalScore, awayScore: opponentScore };
  }
  if (focalSide === "away" && opponentSide === "home") {
    return { homeScore: opponentScore, awayScore: focalScore };
  }
  return { homeScore: focalScore, awayScore: opponentScore };
}

/** Same mapping as the score column: home on the left, legacy focal/opponent order when unknown. */
export function matchScoreHomeAwayPresentation(input: {
  focalScore: number;
  opponentScore: number;
  focalSide: MatchTeamSide;
  opponentSide: MatchTeamSide;
}): {
  homeScore: number;
  awayScore: number;
  tie: boolean;
  homeWon: boolean;
  awayWon: boolean;
} {
  const { homeScore, awayScore } = homeAwayScoresFromFocalVersusOpponent(input);
  const tie = homeScore === awayScore;
  return {
    homeScore,
    awayScore,
    tie,
    homeWon: homeScore > awayScore,
    awayWon: awayScore > homeScore
  };
}

export function focalTeamWonVersusOpponent(input: {
  focalScore: number;
  opponentScore: number;
  focalSide: MatchTeamSide;
  opponentSide: MatchTeamSide;
}): boolean {
  const { homeScore, awayScore } = homeAwayScoresFromFocalVersusOpponent(input);
  if (input.focalSide === "home" && input.opponentSide === "away") {
    return homeScore > awayScore;
  }
  if (input.focalSide === "away" && input.opponentSide === "home") {
    return awayScore > homeScore;
  }
  return input.focalScore > input.opponentScore;
}

export function homeLeftVersusLabelFromSides(input: {
  aName: string;
  bName: string;
  aSide: MatchTeamSide;
  bSide: MatchTeamSide;
}): { leftName: string; rightName: string } {
  const [l, r] = orderTwoParticipantsBySideHomeLeft(
    { side: input.aSide, name: input.aName },
    { side: input.bSide, name: input.bName }
  );
  return { leftName: l.name, rightName: r.name };
}
