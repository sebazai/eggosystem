import {
  buildAfterplantSituations,
  buildRetakeSituations,
  computeTeamAfterplantSummary,
  getAfterplantOutcomeLabel,
  getAfterplantRoundOutcome,
  formatRoundTimeSeconds,
  getAfterplantTimelineRange,
  getTimelineAxisLabels,
  T_WIN_REASONS,
  timeToTimelinePct,
  winPct
} from "./afterplant-round-helpers";
import {
  RoundEndReasonInfo,
  type MatchGameAfterplantRound
} from "@eggosystem/types";

function baseRound(
  overrides: Partial<MatchGameAfterplantRound> = {}
): MatchGameAfterplantRound {
  return {
    round_number: 5,
    plant_site: "A",
    ct_t: { T: ["1"], CT: ["2", "3"] },
    round_end_reason_info: RoundEndReasonInfo.BombDefused,
    ct_team_id: 10,
    t_team_id: 20,
    t_alive_at_plant: 1,
    ct_alive_at_plant: 2,
    ct_team_name: "CT Team",
    t_team_name: "T Team",
    ct_team_logo: null,
    t_team_logo: null,
    plant_time_in_round: 42,
    kills_after_plant: [],
    ...overrides
  };
}

describe("getAfterplantRoundOutcome", () => {
  it("labels retake when CT wins after plant", () => {
    const outcome = getAfterplantRoundOutcome(
      baseRound({ round_end_reason_info: RoundEndReasonInfo.BombDefused }),
      "#f00",
      "#00f"
    );
    expect(outcome.planterHeld).toBe(false);
    expect(outcome.winnerTeamName).toBe("CT Team");
    expect(outcome.outcomeLabel).toBe("Defused");
    expect(getAfterplantOutcomeLabel(RoundEndReasonInfo.BombDefused)).toBe(
      "Defused"
    );
    expect(outcome.winnerColor).toBe("#00f");
  });

  it("labels held when planter wins by bomb", () => {
    const outcome = getAfterplantRoundOutcome(
      baseRound({ round_end_reason_info: RoundEndReasonInfo.TargetBombed }),
      "#f00",
      "#00f"
    );
    expect(outcome.planterHeld).toBe(true);
    expect(outcome.winnerTeamName).toBe("T Team");
    expect(outcome.outcomeLabel).toBe("Bombed");
    expect(T_WIN_REASONS).toContain(RoundEndReasonInfo.TargetBombed);
  });

  it("uses Elim only once for elimination wins (no held suffix)", () => {
    const outcome = getAfterplantRoundOutcome(
      baseRound({ round_end_reason_info: RoundEndReasonInfo.T_Win }),
      "#f00",
      "#00f"
    );
    expect(outcome.outcomeLabel).toBe("Elim");
    expect(outcome.outcomeLabel).not.toMatch(/held/i);
  });
});

describe("getAfterplantTimelineRange", () => {
  it("pads timeline range around post-plant kill times", () => {
    const { timeMin, timeMax } = getAfterplantTimelineRange(
      [
        {
          victim_steam_id: "a",
          victim_team: "CT",
          killer_steam_id: "b",
          time_in_round: 50,
          is_traded: false
        }
      ],
      null
    );
    expect(timeMin).toBeLessThanOrEqual(47);
    expect(timeMax).toBeGreaterThanOrEqual(53);
  });

  it("includes bomb plant time in the visible window", () => {
    const { timeMin, timeMax } = getAfterplantTimelineRange([], 98);
    expect(timeMin).toBeLessThanOrEqual(95);
    expect(timeMax).toBeGreaterThanOrEqual(101);
  });
});

describe("formatRoundTimeSeconds", () => {
  it("shows one decimal for sub-second precision", () => {
    expect(formatRoundTimeSeconds(152.874996224)).toBe("152.9s");
  });

  it("omits decimal for whole seconds", () => {
    expect(formatRoundTimeSeconds(150)).toBe("150s");
  });
});

describe("timeToTimelinePct", () => {
  it("maps time into 0–100", () => {
    expect(timeToTimelinePct(50, 40, 60)).toBe(50);
    expect(getTimelineAxisLabels(40, 60).length).toBeGreaterThan(0);
  });
});

describe("getTimelineAxisLabels", () => {
  it("uses half-second ticks on narrow ranges", () => {
    expect(getTimelineAxisLabels(150, 154)).toEqual([
      150, 150.5, 151, 151.5, 152, 152.5, 153, 153.5, 154
    ]);
  });
});

describe("winPct", () => {
  it("returns rounded percentage", () => {
    expect(winPct(2, 4)).toBe(50);
    expect(winPct(0, 0)).toBe(0);
  });
});

describe("buildAfterplantSituations", () => {
  it("groups attack rounds by alive count at plant", () => {
    const stats = buildAfterplantSituations([
      baseRound({
        t_alive_at_plant: 3,
        ct_alive_at_plant: 2,
        round_end_reason_info: RoundEndReasonInfo.TargetBombed
      }),
      baseRound({
        round_number: 6,
        t_alive_at_plant: 3,
        ct_alive_at_plant: 2,
        round_end_reason_info: RoundEndReasonInfo.BombDefused
      }),
      baseRound({
        round_number: 7,
        t_alive_at_plant: 2,
        ct_alive_at_plant: 4,
        round_end_reason_info: RoundEndReasonInfo.TargetBombed
      })
    ]);
    expect(stats).toEqual([
      { key: "3v2", won: 1, total: 2 },
      { key: "2v4", won: 1, total: 1 }
    ]);
  });
});

describe("buildRetakeSituations", () => {
  it("groups defend rounds by CT v T alive count", () => {
    const stats = buildRetakeSituations([
      baseRound({
        ct_alive_at_plant: 2,
        t_alive_at_plant: 3,
        round_end_reason_info: RoundEndReasonInfo.BombDefused
      }),
      baseRound({
        round_number: 6,
        ct_alive_at_plant: 2,
        t_alive_at_plant: 3,
        round_end_reason_info: RoundEndReasonInfo.TargetBombed
      })
    ]);
    expect(stats).toEqual([{ key: "2v3", won: 1, total: 2 }]);
  });
});

describe("computeTeamAfterplantSummary", () => {
  it("summarises T-side plants and CT-side retakes by site", () => {
    const summary = computeTeamAfterplantSummary(
      [
        baseRound({
          plant_site: "A",
          round_end_reason_info: RoundEndReasonInfo.TargetBombed
        }),
        baseRound({
          round_number: 6,
          plant_site: "B",
          round_end_reason_info: RoundEndReasonInfo.BombDefused
        })
      ],
      [
        baseRound({
          round_number: 10,
          plant_site: "A",
          round_end_reason_info: RoundEndReasonInfo.BombDefused
        })
      ]
    );
    expect(summary.attackWon).toBe(1);
    expect(summary.attackTotal).toBe(2);
    expect(summary.attackSiteA).toEqual({ won: 1, total: 1 });
    expect(summary.attackSiteB).toEqual({ won: 0, total: 1 });
    expect(summary.defendWon).toBe(1);
    expect(summary.defendTotal).toBe(1);
  });
});
