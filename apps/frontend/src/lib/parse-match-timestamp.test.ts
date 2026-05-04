import { parseMatchTimestampToDate } from "./parse-match-timestamp";

describe("parseMatchTimestampToDate", () => {
  it("appends Z when timestamp has no explicit zone", () => {
    const d = parseMatchTimestampToDate("2024-01-15T14:30:00");
    expect(d.toISOString()).toBe("2024-01-15T14:30:00.000Z");
  });

  it("preserves explicit Z", () => {
    const d = parseMatchTimestampToDate("2024-01-15T14:30:00.000Z");
    expect(d.toISOString()).toBe("2024-01-15T14:30:00.000Z");
  });

  it("preserves numeric offset suffix", () => {
    const d = parseMatchTimestampToDate("2024-01-15T16:30:00+02:00");
    expect(d.toISOString()).toBe("2024-01-15T14:30:00.000Z");
  });
});
