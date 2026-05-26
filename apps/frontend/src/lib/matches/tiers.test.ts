import {
  leagueNameToTierKey,
  numericTierToKey,
  tierCssColor,
  tierCssBorderColor
} from "./tiers";

describe("leagueNameToTierKey", () => {
  it("maps Masters variants to premier", () => {
    expect(leagueNameToTierKey("Masters")).toBe("premier");
    expect(leagueNameToTierKey("CS2 Masters")).toBe("premier");
  });

  it("maps Challengers/Elite variants to elite", () => {
    expect(leagueNameToTierKey("Challengers")).toBe("elite");
    expect(leagueNameToTierKey("Elite")).toBe("elite");
  });

  it("maps Prospects/Challenge variants to challenge", () => {
    expect(leagueNameToTierKey("Prospects")).toBe("challenge");
    expect(leagueNameToTierKey("Challenge")).toBe("challenge");
  });

  it("maps unknown/lower divisions to open", () => {
    expect(leagueNameToTierKey("Div 4")).toBe("open");
    expect(leagueNameToTierKey("Div 5")).toBe("open");
    expect(leagueNameToTierKey("Open")).toBe("open");
    expect(leagueNameToTierKey("some unknown league")).toBe("open");
  });
});

describe("numericTierToKey", () => {
  it("maps 1 to premier", () => expect(numericTierToKey(1)).toBe("premier"));
  it("maps 2 to elite", () => expect(numericTierToKey(2)).toBe("elite"));
  it("maps 3 to challenge", () =>
    expect(numericTierToKey(3)).toBe("challenge"));
  it("maps 4+ to open", () => {
    expect(numericTierToKey(4)).toBe("open");
    expect(numericTierToKey(12)).toBe("open");
  });
});

describe("tierCssColor / tierCssBorderColor", () => {
  it("returns hsl(var(--tier-{key})) strings", () => {
    expect(tierCssColor("premier")).toBe("hsl(var(--tier-premier))");
    expect(tierCssColor("open")).toBe("hsl(var(--tier-open))");
  });

  it("returns opacity border variants", () => {
    expect(tierCssBorderColor("elite")).toBe("hsl(var(--tier-elite) / 0.5)");
  });
});
