import { BadRequestError } from "../utils/errors";
import { validateCs2TeamGameScorePair } from "./team-game-score.models";

describe("validateCs2TeamGameScorePair", () => {
  it("accepts a typical 13-9 regulation score with 6-6 first half (MR12)", () => {
    expect(() =>
      validateCs2TeamGameScorePair(
        { score: 13, halftime_score: 6, overtime_score: 0 },
        { score: 9, halftime_score: 6, overtime_score: 0 },
        24
      )
    ).not.toThrow();
  });

  it("rejects when first-half wins do not sum to half the regulation count", () => {
    expect(() =>
      validateCs2TeamGameScorePair(
        { score: 13, halftime_score: 5, overtime_score: 0 },
        { score: 9, halftime_score: 6, overtime_score: 0 },
        24
      )
    ).toThrow(BadRequestError);
  });

  it("rejects when regulation team wins exceed the map regulation cap", () => {
    expect(() =>
      validateCs2TeamGameScorePair(
        { score: 20, halftime_score: 6, overtime_score: 0 },
        { score: 9, halftime_score: 6, overtime_score: 0 },
        24
      )
    ).toThrow(BadRequestError);
  });

  it("rejects an odd regulation_rounds value", () => {
    expect(() =>
      validateCs2TeamGameScorePair(
        { score: 1, halftime_score: 0, overtime_score: 0 },
        { score: 1, halftime_score: 0, overtime_score: 0 },
        11
      )
    ).toThrow(BadRequestError);
  });
});
