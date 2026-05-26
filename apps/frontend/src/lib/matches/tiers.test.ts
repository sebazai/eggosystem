import { leagueColor, numericTierColors, formatLeagueName } from "./tiers";

describe("formatLeagueName", () => {
  it.each([
    ["div5", "Div 5"],
    ["div11", "Div 11"],
    ["Masters", "Masters"],
    ["MKT", "MKT"]
  ])("formats %s → %s", (input, expected) => {
    expect(formatLeagueName(input)).toBe(expected);
  });
});

describe("leagueColor", () => {
  it("returns masters token for Masters/Pro variants", () => {
    expect(leagueColor("Masters").color).toBe("hsl(var(--tier-masters))");
    expect(leagueColor("CS2 Pro").color).toBe("hsl(var(--tier-masters))");
    expect(leagueColor("Pro").color).toBe("hsl(var(--tier-masters))");
  });

  it("returns challengers token for Semi-pro/Challengers/Elite", () => {
    expect(leagueColor("Semi-pro").color).toBe("hsl(var(--tier-challengers))");
    expect(leagueColor("Challengers").color).toBe(
      "hsl(var(--tier-challengers))"
    );
    expect(leagueColor("Elite").color).toBe("hsl(var(--tier-challengers))");
  });

  it("returns prospects token for Prospects/Challenge/MKT/div2", () => {
    expect(leagueColor("Prospects").color).toBe("hsl(var(--tier-prospects))");
    expect(leagueColor("Challenge").color).toBe("hsl(var(--tier-prospects))");
    expect(leagueColor("MKT").color).toBe("hsl(var(--tier-prospects))");
    expect(leagueColor("div2").color).toBe("hsl(var(--tier-prospects))");
  });

  it("returns default token for div3 and all lower divisions", () => {
    const grey = "hsl(var(--tier-default))";
    expect(leagueColor("div3").color).toBe(grey);
    expect(leagueColor("div4").color).toBe(grey);
    expect(leagueColor("div5").color).toBe(grey);
    expect(leagueColor("div6").color).toBe(grey);
    expect(leagueColor("div11").color).toBe(grey);
    expect(leagueColor("kanakahakka").color).toBe(grey);
    expect(leagueColor("some unknown league").color).toBe(grey);
  });

  it("returns bg at 16% opacity", () => {
    expect(leagueColor("Masters").bg).toBe("hsl(var(--tier-masters) / 0.16)");
  });

  it("returns border at 50% opacity", () => {
    expect(leagueColor("Masters").border).toBe(
      "hsl(var(--tier-masters) / 0.5)"
    );
  });
});

describe("numericTierColors", () => {
  it("maps tier 1 to masters", () => {
    expect(numericTierColors(1).color).toBe("hsl(var(--tier-masters))");
  });
  it("maps tier 2 to challengers", () => {
    expect(numericTierColors(2).color).toBe("hsl(var(--tier-challengers))");
  });
  it("maps tier 3 to prospects", () => {
    expect(numericTierColors(3).color).toBe("hsl(var(--tier-prospects))");
  });
  it("maps tier 4+ to default", () => {
    expect(numericTierColors(4).color).toBe("hsl(var(--tier-default))");
    expect(numericTierColors(6).color).toBe("hsl(var(--tier-default))");
    expect(numericTierColors(12).color).toBe("hsl(var(--tier-default))");
  });
});
