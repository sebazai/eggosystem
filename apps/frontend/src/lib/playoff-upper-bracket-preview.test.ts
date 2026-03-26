import type { PlayoffBracketMatch } from "@eggosystem/types";
import { buildUpperBracketDisplaySlots } from "./playoff-upper-bracket-preview";

const baseMatch = (): PlayoffBracketMatch => ({
  match_id: 1,
  external_match_id: "ext-1",
  round: 1,
  group: 1,
  status: "SCHEDULED",
  best_of: 3,
  start_timestamp: "2026-03-25T18:00:00.000Z",
  team1_id: 10,
  team1_name: "Team A",
  team1_logo: "logo-a",
  team2_id: 20,
  team2_name: "Team B",
  team2_logo: "logo-b",
  team1_score: 0,
  team2_score: 0,
  slot: 0,
  seed1: 1,
  seed2: 16
});

describe("buildUpperBracketDisplaySlots", () => {
  it("maps round 1 to match or empty only", () => {
    const m = {
      ...baseMatch(),
      status: "FINISHED" as const,
      team1_score: 2,
      team2_score: 0
    };
    const map = new Map<number, (PlayoffBracketMatch | null)[]>([
      [1, [m, null]]
    ]);
    const out = buildUpperBracketDisplaySlots(map);
    expect(out.get(1)).toEqual([
      { kind: "match", match: m },
      { kind: "empty" }
    ]);
  });

  it("shows preview for R2 when parent R1 matches are finished (16-team slot 0)", () => {
    const r1slot0: PlayoffBracketMatch = {
      ...baseMatch(),
      match_id: 100,
      external_match_id: "m0",
      slot: 0,
      seed1: 1,
      seed2: 16,
      status: "FINISHED",
      team1_score: 2,
      team2_score: 0,
      team1_name: "WIOSS KT"
    };
    const r1slot1: PlayoffBracketMatch = {
      ...baseMatch(),
      match_id: 101,
      external_match_id: "m1",
      slot: 1,
      seed1: 8,
      seed2: 9,
      status: "FINISHED",
      team1_score: 2,
      team2_score: 1,
      team1_name: "Joki ICT Oy"
    };
    const map = new Map<number, (PlayoffBracketMatch | null)[]>([
      [1, [r1slot0, r1slot1, null, null, null, null, null, null]],
      [2, [null, null, null, null]]
    ]);
    const out = buildUpperBracketDisplaySlots(map);
    const r2 = out.get(2);
    expect(r2?.[0]?.kind).toBe("preview");
    if (r2?.[0]?.kind === "preview") {
      expect(r2[0].team1?.team_name).toBe("WIOSS KT");
      expect(r2[0].team2?.team_name).toBe("Joki ICT Oy");
    }
    expect(r2?.[1]?.kind).toBe("empty");
  });

  it("shows partial preview when only one parent finished", () => {
    const done: PlayoffBracketMatch = {
      ...baseMatch(),
      match_id: 1,
      slot: 0,
      status: "FINISHED",
      team1_score: 2,
      team2_score: 0
    };
    const pending: PlayoffBracketMatch = {
      ...baseMatch(),
      match_id: 2,
      slot: 1,
      status: "SCHEDULED",
      team1_score: 0,
      team2_score: 0
    };
    const map = new Map<number, (PlayoffBracketMatch | null)[]>([
      [1, [done, pending]],
      [2, [null]]
    ]);
    const out = buildUpperBracketDisplaySlots(map);
    const r2 = out.get(2)?.[0];
    expect(r2?.kind).toBe("preview");
    if (r2?.kind === "preview") {
      expect(r2.team1).not.toBeNull();
      expect(r2.team2).toBeNull();
    }
  });

  it("keeps API match when round 2 slot exists", () => {
    const r2 = {
      ...baseMatch(),
      round: 2,
      slot: 0,
      match_id: 50,
      status: "SCHEDULED" as const
    };
    const map = new Map<number, (PlayoffBracketMatch | null)[]>([
      [1, [baseMatch(), baseMatch()]],
      [2, [r2]]
    ]);
    const out = buildUpperBracketDisplaySlots(map);
    expect(out.get(2)?.[0]).toEqual({ kind: "match", match: r2 });
  });

  it("uses team1 as winner for FINISHED bye in parent slot", () => {
    const bye: PlayoffBracketMatch = {
      ...baseMatch(),
      match_id: 3,
      slot: 0,
      status: "FINISHED",
      team2_id: null,
      team2_name: null,
      team2_logo: null,
      team2_score: 0,
      team1_score: 1,
      team1_name: "Solo Seed"
    };
    const pending = { ...baseMatch(), match_id: 4, slot: 1 };
    const map = new Map<number, (PlayoffBracketMatch | null)[]>([
      [1, [bye, pending]],
      [2, [null]]
    ]);
    const out = buildUpperBracketDisplaySlots(map);
    const r2 = out.get(2)?.[0];
    expect(r2?.kind).toBe("preview");
    if (r2?.kind === "preview") {
      expect(r2.team1?.team_name).toBe("Solo Seed");
      expect(r2.team2).toBeNull();
    }
  });
});
