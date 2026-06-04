import {
  CS2_STEAM_APP_ID,
  getSignupWelcomeCopy,
  PUBG_STEAM_APP_ID
} from "./signupWelcomeContent";

describe("getSignupWelcomeCopy", () => {
  it("returns CS2 copy for CS2 app id", () => {
    const copy = getSignupWelcomeCopy(CS2_STEAM_APP_ID);
    expect(copy.introParagraph).toMatch(/CS2 tournament/);
    expect(copy.participationFeeIntro).toMatch(/CS2 tournaments/);
    expect(copy.defaultRulebookUrl).toContain("/CS2/");
    expect(copy.registrationInfoUrl).toContain("/CS2/Registration");
  });

  it("returns PUBG copy for PUBG app id", () => {
    const copy = getSignupWelcomeCopy(PUBG_STEAM_APP_ID);
    expect(copy.introParagraph).toMatch(/PUBG tournament/);
    expect(copy.participationFeeIntro).not.toMatch(/CS2/);
    expect(copy.registrationInfoUrl).toBe(
      "https://wiki.kanaliiga.fi/PUBG/Registration"
    );
  });

  it("returns generic copy for unknown app ids", () => {
    const copy = getSignupWelcomeCopy(999);
    expect(copy.introParagraph).toMatch(/welcome to Kanaliiga/);
    expect(copy.introParagraph).not.toMatch(/CS2|PUBG/);
  });
});
