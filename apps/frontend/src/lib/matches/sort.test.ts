import { cycleMatchSortKey, getMatchSortKey, getMatchSortLabel } from "./sort";

describe("match sort helpers", () => {
  it("defaults to newest when sort param is missing or invalid", () => {
    expect(getMatchSortKey(new URLSearchParams())).toBe("newest");
    expect(getMatchSortKey(new URLSearchParams("sort=invalid"))).toBe("newest");
  });

  it("reads oldest and tier from URL params", () => {
    expect(getMatchSortKey(new URLSearchParams("sort=oldest"))).toBe("oldest");
    expect(getMatchSortKey(new URLSearchParams("sort=tier"))).toBe("tier");
  });

  it("cycles sort keys newest -> oldest -> tier -> newest", () => {
    expect(cycleMatchSortKey("newest")).toBe("oldest");
    expect(cycleMatchSortKey("oldest")).toBe("tier");
    expect(cycleMatchSortKey("tier")).toBe("newest");
  });

  it("returns labels for sort keys", () => {
    expect(getMatchSortLabel("newest")).toBe("Newest first");
    expect(getMatchSortLabel("oldest")).toBe("Oldest first");
    expect(getMatchSortLabel("tier")).toBe("Highest tier first");
  });
});
