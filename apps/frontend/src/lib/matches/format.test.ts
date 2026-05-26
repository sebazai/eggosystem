import {
  stageLabel,
  stageKicker,
  durationLabel,
  matchDurationMinutes
} from "./format";

describe("stageLabel", () => {
  it("returns Group · Round for regular season (stage 1)", () => {
    expect(stageLabel({ stage: 1, match_group: 2, match_round: 3 })).toBe(
      "Group 2 · Round 3"
    );
  });

  it("returns Grand Final for playoff group 3", () => {
    expect(stageLabel({ stage: 2, match_group: 3, match_round: 1 })).toBe(
      "Grand Final"
    );
  });

  it("returns Upper Bracket for playoff group 1", () => {
    expect(stageLabel({ stage: 2, match_group: 1, match_round: 2 })).toBe(
      "Upper Bracket · Round 2"
    );
  });

  it("returns Lower Bracket for playoff group 2", () => {
    expect(stageLabel({ stage: 2, match_group: 2, match_round: 1 })).toBe(
      "Lower Bracket · Round 1"
    );
  });

  it("handles null group/round gracefully", () => {
    expect(stageLabel({ stage: 1, match_group: null, match_round: null })).toBe(
      "Group ? · Round ?"
    );
    expect(stageLabel({ stage: 2, match_group: null, match_round: null })).toBe(
      "Upper Bracket · Round ?"
    );
  });
});

describe("stageKicker", () => {
  it("returns Regular Season for stage 1", () => {
    expect(stageKicker(1)).toBe("Regular Season");
  });

  it("returns Playoff for stage 2", () => {
    expect(stageKicker(2)).toBe("Playoff");
  });
});

describe("durationLabel", () => {
  it("returns minutes-only when under 60", () => {
    expect(durationLabel(45)).toBe("45m");
    expect(durationLabel(59)).toBe("59m");
  });

  it("returns hours and zero-padded minutes for 60+", () => {
    expect(durationLabel(60)).toBe("1h 00m");
    expect(durationLabel(90)).toBe("1h 30m");
    expect(durationLabel(131)).toBe("2h 11m");
  });

  it("zero-pads single-digit minutes", () => {
    expect(durationLabel(65)).toBe("1h 05m");
  });
});

describe("matchDurationMinutes", () => {
  it("returns null when endTimestamp is null", () => {
    expect(matchDurationMinutes("2025-01-01T10:00:00Z", null)).toBeNull();
  });

  it("computes minutes correctly", () => {
    expect(
      matchDurationMinutes("2025-01-01T10:00:00Z", "2025-01-01T12:11:00Z")
    ).toBe(131);
  });

  it("rounds to nearest minute", () => {
    expect(
      matchDurationMinutes("2025-01-01T10:00:00Z", "2025-01-01T10:01:30Z")
    ).toBe(2);
  });
});
