import type { PlayoffBracketMatch } from "@eggosystem/types";

/** Winner derived from a finished playoff match (for upper-bracket preview rows). */
export interface PlayoffUpperBracketWinner {
  team_id: number;
  team_name: string;
  team_logo: string | null;
  seed?: number;
}

/**
 * What to render in one bracket cell: real match, inferred next-round preview, or empty.
 * Lower / grand final use only `match` and `empty`.
 */
export type PlayoffBracketSlotDisplay =
  | { kind: "match"; match: PlayoffBracketMatch }
  | {
      kind: "preview";
      team1: PlayoffUpperBracketWinner | null;
      team2: PlayoffUpperBracketWinner | null;
    }
  | { kind: "empty" };

/**
 * Same rules as MatchCard: FINISHED + bye → team1; else compare scores.
 * Ties return null (no predicted winner).
 */
function getFinishedWinner(
  match: PlayoffBracketMatch
): PlayoffUpperBracketWinner | null {
  if (match.status !== "FINISHED") return null;
  const isBye = match.team2_id === null;
  if (isBye) {
    return {
      team_id: match.team1_id,
      team_name: match.team1_name,
      team_logo: match.team1_logo,
      seed: match.seed1
    };
  }
  const s1 = match.team1_score;
  const s2 = match.team2_score ?? 0;
  if (s1 > s2) {
    return {
      team_id: match.team1_id,
      team_name: match.team1_name,
      team_logo: match.team1_logo,
      seed: match.seed1
    };
  }
  if (s2 > s1) {
    if (
      match.team2_id == null ||
      match.team2_name == null ||
      match.team2_id <= 0
    ) {
      return null;
    }
    return {
      team_id: match.team2_id,
      team_name: match.team2_name,
      team_logo: match.team2_logo,
      seed: match.seed2
    };
  }
  return null;
}

/**
 * Upper bracket (group 1): for each round > 1, empty API slots show preview teams from
 * FINISHED parents at round `r-1` slots `2k` and `2k+1`.
 * Round 1 is unchanged (match or empty). Real API matches always win over preview.
 */
export function buildUpperBracketDisplaySlots(
  slotsByRound: Map<number, (PlayoffBracketMatch | null)[]>
): Map<number, PlayoffBracketSlotDisplay[]> {
  const rounds = [...slotsByRound.keys()].sort((a, b) => a - b);
  const out = new Map<number, PlayoffBracketSlotDisplay[]>();

  for (const round of rounds) {
    const slots = slotsByRound.get(round);
    if (!slots) continue;

    if (round === 1) {
      out.set(
        round,
        slots.map((m) =>
          m ? { kind: "match" as const, match: m } : { kind: "empty" as const }
        )
      );
      continue;
    }

    const prevSlots = slotsByRound.get(round - 1);
    if (!prevSlots) {
      out.set(
        round,
        slots.map((m) =>
          m ? { kind: "match" as const, match: m } : { kind: "empty" as const }
        )
      );
      continue;
    }

    const display: PlayoffBracketSlotDisplay[] = [];
    for (let k = 0; k < slots.length; k++) {
      const m = slots[k];
      if (m) {
        display.push({ kind: "match", match: m });
        continue;
      }
      const left = prevSlots[2 * k] ?? null;
      const right = prevSlots[2 * k + 1] ?? null;
      const w1 = left ? getFinishedWinner(left) : null;
      const w2 = right ? getFinishedWinner(right) : null;
      if (w1 || w2) {
        display.push({ kind: "preview", team1: w1, team2: w2 });
      } else {
        display.push({ kind: "empty" });
      }
    }
    out.set(round, display);
  }

  return out;
}

/** Map lower / GF rounds to display slots (no preview). */
export function bracketMatchesToDisplaySlots(
  slots: (PlayoffBracketMatch | null)[]
): PlayoffBracketSlotDisplay[] {
  return slots.map((m) =>
    m ? { kind: "match" as const, match: m } : { kind: "empty" as const }
  );
}
