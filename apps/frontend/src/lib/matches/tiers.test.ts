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
  it("returns masters (amber) for Masters/Pro variants", () => {
    expect(leagueColor("Masters").color).toBe("hsl(35 78% 56%)");
    expect(leagueColor("CS2 Pro").color).toBe("hsl(35 78% 56%)");
    expect(leagueColor("Pro").color).toBe("hsl(35 78% 56%)");
  });

  it("returns challengers (lavender) for Semi-pro/Challengers/Elite", () => {
    expect(leagueColor("Semi-pro").color).toBe("hsl(262 68% 68%)");
    expect(leagueColor("Challengers").color).toBe("hsl(262 68% 68%)");
    expect(leagueColor("Elite").color).toBe("hsl(262 68% 68%)");
  });

  it("returns prospects (sky blue) for Prospects/Challenge/MKT/div2", () => {
    expect(leagueColor("Prospects").color).toBe("hsl(199 74% 58%)");
    expect(leagueColor("Challenge").color).toBe("hsl(199 74% 58%)");
    expect(leagueColor("MKT").color).toBe("hsl(199 74% 58%)");
    expect(leagueColor("div2").color).toBe("hsl(199 74% 58%)");
  });

  it("returns neutral grey for div3 and all lower divisions", () => {
    const grey = "hsl(215 12% 55%)";
    expect(leagueColor("div3").color).toBe(grey);
    expect(leagueColor("div4").color).toBe(grey);
    expect(leagueColor("div5").color).toBe(grey);
    expect(leagueColor("div6").color).toBe(grey);
    expect(leagueColor("div11").color).toBe(grey);
    expect(leagueColor("kanakahakka").color).toBe(grey);
    expect(leagueColor("some unknown league").color).toBe(grey);
  });

  it("returns bg at 16% opacity", () => {
    expect(leagueColor("Masters").bg).toBe("hsl(35 78% 56% / 0.16)");
  });

  it("returns border at 50% opacity", () => {
    expect(leagueColor("Masters").border).toBe("hsl(35 78% 56% / 0.5)");
  });
});

describe("numericTierColors", () => {
  it("maps tier 1 to masters", () => {
    expect(numericTierColors(1).color).toBe("hsl(35 78% 56%)");
  });
  it("maps tier 2 to challengers", () => {
    expect(numericTierColors(2).color).toBe("hsl(262 68% 68%)");
  });
  it("maps tier 3 to prospects", () => {
    expect(numericTierColors(3).color).toBe("hsl(199 74% 58%)");
  });
  it("maps tier 4+ to neutral grey", () => {
    expect(numericTierColors(4).color).toBe("hsl(215 12% 55%)");
    expect(numericTierColors(6).color).toBe("hsl(215 12% 55%)");
    expect(numericTierColors(12).color).toBe("hsl(215 12% 55%)");
  });
});
