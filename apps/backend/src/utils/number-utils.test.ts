import { coerceAvgScore, roundSideKd } from "./number-utils";

describe("coerceAvgScore", () => {
  it("returns 0 for nullish", () => {
    expect(coerceAvgScore(undefined)).toBe(0);
    expect(coerceAvgScore(null)).toBe(0);
  });

  it("passes through finite numbers", () => {
    expect(coerceAvgScore(13.5)).toBe(13.5);
    expect(coerceAvgScore(0)).toBe(0);
  });

  it("parses numeric strings", () => {
    expect(coerceAvgScore("13.5")).toBe(13.5);
    expect(coerceAvgScore("0.0")).toBe(0);
  });

  it("returns 0 for non-numeric strings", () => {
    expect(coerceAvgScore("x")).toBe(0);
  });
});

describe("roundSideKd", () => {
  it("returns ratio rounded to two decimals", () => {
    expect(roundSideKd(130, 121)).toBe(1.07);
    expect(roundSideKd(29, 50)).toBe(0.58);
  });

  it("returns 1 when deaths are zero", () => {
    expect(roundSideKd(10, 0)).toBe(1);
  });
});
