import {
  calendarMatchHomeLeftTeamNames,
  calendarMatchVersusTitle,
  dualTeamRowToHomeLeftDisplay,
  dualTeamScoresToHomeLeftDisplay,
  focalTeamWonVersusOpponent,
  homeAwayScoresFromFocalVersusOpponent,
  matchScoreHomeAwayPresentation,
  homeLeftVersusLabelFromSides,
  orderMatchParticipantsBySideHomeLeft,
  orderTwoByMatchTeamSideHomeLeftAway
} from "./order-match-teams-home-left-away";
import type {
  Match,
  MatchTeamSide,
  MatchWithStreamUrls
} from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";

type OrderTestRow = { id: number; side: MatchTeamSide; name?: string };

describe("orderTwoByMatchTeamSideHomeLeftAway", () => {
  it("swaps away-home input to home-left / away-right", () => {
    const awayFirst: OrderTestRow = { id: 2, side: "away", name: "B" };
    const homeSecond: OrderTestRow = { id: 1, side: "home", name: "A" };
    const [l, r] = orderTwoByMatchTeamSideHomeLeftAway(awayFirst, homeSecond);
    expect(l.side).toBe("home");
    expect(r.side).toBe("away");
  });

  it("keeps home-away input order", () => {
    const h: OrderTestRow = { id: 1, side: "home" };
    const a: OrderTestRow = { id: 2, side: "away" };
    expect(orderTwoByMatchTeamSideHomeLeftAway(h, a)).toEqual([h, a]);
  });

  it("uses legacy order when either side is unknown", () => {
    const first: OrderTestRow = { id: 1, side: null };
    const second: OrderTestRow = { id: 2, side: "away" };
    expect(orderTwoByMatchTeamSideHomeLeftAway(first, second)).toEqual([
      first,
      second
    ]);
  });
});

describe("orderMatchParticipantsBySideHomeLeft", () => {
  it("leaves non-pairs unchanged", () => {
    const one = [{ side: "home" as const }];
    expect(orderMatchParticipantsBySideHomeLeft(one)).toEqual(one);
  });

  it("falls back to deterministic name ordering when sides are unknown", () => {
    const a: OrderTestRow = { id: 1, side: null, name: "Beta" };
    const b: OrderTestRow = { id: 2, side: null, name: "Alpha" };
    expect(orderMatchParticipantsBySideHomeLeft([a, b])).toEqual([b, a]);
  });
});

describe("dualTeamRowToHomeLeftDisplay", () => {
  it("orders row fields to home left", () => {
    const row = {
      team1_side: "away" as const,
      team2_side: "home" as const,
      team1_name: "Beta",
      team2_name: "Alpha",
      team1_logo: "b.png",
      team2_logo: "a.png",
      team1_score: 14,
      team2_score: 16
    };
    const d = dualTeamRowToHomeLeftDisplay(row);
    expect(d.left.name).toBe("Alpha");
    expect(d.left.score).toBe(16);
    expect(d.right.name).toBe("Beta");
    expect(d.right.score).toBe(14);
  });

  it("uses deterministic name ordering when sides are unknown", () => {
    const row = {
      team1_side: null,
      team2_side: null,
      team1_name: "Beta",
      team2_name: "Alpha",
      team1_logo: "b.png",
      team2_logo: "a.png",
      team1_score: 14,
      team2_score: 16
    };
    const d = dualTeamRowToHomeLeftDisplay(row);
    expect(d.left.name).toBe("Alpha");
    expect(d.right.name).toBe("Beta");
  });
});

describe("dualTeamScoresToHomeLeftDisplay", () => {
  it("orders scores for map strip", () => {
    const o = dualTeamScoresToHomeLeftDisplay({
      team1_score: 13,
      team2_score: 10,
      team1_side: "away",
      team2_side: "home"
    });
    expect(o).toEqual({ leftScore: 10, rightScore: 13 });
  });
});

describe("calendarMatchHomeLeftTeamNames", () => {
  const base = {
    match_id: "1",
    title: "t",
    match_start: "",
    match_end: "",
    match_status: "SCHEDULED" satisfies Match["status"],
    league_name: "L",
    league_tier: 1,
    match_team1: "Beta",
    match_team2: "Alpha",
    stream_urls: [],
    teams: { home: null, away: null },
    external_match_room_id: null,
    season_platform: SeasonPlatform.FACEIT
  } satisfies MatchWithStreamUrls;

  it("falls back to deterministic name ordering when teams is absent", () => {
    expect(
      calendarMatchHomeLeftTeamNames({
        match_team1: "Beta",
        match_team2: "Alpha"
      })
    ).toEqual({
      leftName: "Alpha",
      rightName: "Beta"
    });
  });

  it("falls back to deterministic name ordering when sides missing", () => {
    expect(calendarMatchHomeLeftTeamNames(base)).toEqual({
      leftName: "Alpha",
      rightName: "Beta"
    });
  });

  it("uses teams.home / teams.away when both set", () => {
    expect(
      calendarMatchHomeLeftTeamNames({
        ...base,
        teams: {
          home: { id: 9, name: "H" },
          away: { id: 8, name: "A" }
        }
      })
    ).toEqual({ leftName: "H", rightName: "A" });
  });
});

describe("calendarMatchVersusTitle", () => {
  const base = {
    match_id: "1",
    title: "t",
    match_start: "",
    match_end: "",
    match_status: "SCHEDULED" satisfies Match["status"],
    league_name: "L",
    league_tier: 1,
    match_team1: "Beta",
    match_team2: "Alpha",
    stream_urls: [],
    teams: { home: null, away: null },
    external_match_room_id: null,
    season_platform: SeasonPlatform.FACEIT
  } satisfies MatchWithStreamUrls;

  it("uses deterministic fallback ordering when sides missing", () => {
    expect(calendarMatchVersusTitle(base)).toBe("Alpha vs Beta");
  });

  it("orders title home-left when sides are known", () => {
    expect(
      calendarMatchVersusTitle({
        ...base,
        teams: {
          home: { id: 1, name: "HomeName" },
          away: { id: 2, name: "AwayName" }
        }
      })
    ).toBe("HomeName vs AwayName");
  });
});

describe("matchScoreHomeAwayPresentation", () => {
  it("matches home-away ordering and tie flag", () => {
    expect(
      matchScoreHomeAwayPresentation({
        focalScore: 14,
        opponentScore: 16,
        focalSide: "away",
        opponentSide: "home"
      })
    ).toEqual({
      homeScore: 16,
      awayScore: 14,
      tie: false,
      homeWon: true,
      awayWon: false
    });
  });

  it("legacy order when sides unknown", () => {
    expect(
      matchScoreHomeAwayPresentation({
        focalScore: 11,
        opponentScore: 9,
        focalSide: null,
        opponentSide: null
      })
    ).toEqual({
      homeScore: 11,
      awayScore: 9,
      tie: false,
      homeWon: true,
      awayWon: false
    });
  });
});

describe("homeAwayScoresFromFocalVersusOpponent", () => {
  it("maps focal away to away score on the right", () => {
    expect(
      homeAwayScoresFromFocalVersusOpponent({
        focalScore: 14,
        opponentScore: 16,
        focalSide: "away",
        opponentSide: "home"
      })
    ).toEqual({ homeScore: 16, awayScore: 14 });
  });

  it("uses legacy column order when sides unknown", () => {
    expect(
      homeAwayScoresFromFocalVersusOpponent({
        focalScore: 9,
        opponentScore: 11,
        focalSide: null,
        opponentSide: null
      })
    ).toEqual({ homeScore: 9, awayScore: 11 });
  });
});

describe("focalTeamWonVersusOpponent", () => {
  it("detects win when focal is away with higher score on the right", () => {
    expect(
      focalTeamWonVersusOpponent({
        focalScore: 16,
        opponentScore: 14,
        focalSide: "away",
        opponentSide: "home"
      })
    ).toBe(true);
  });
});

describe("homeLeftVersusLabelFromSides", () => {
  it("orders names for vs label", () => {
    expect(
      homeLeftVersusLabelFromSides({
        aName: "Z",
        bName: "Y",
        aSide: "away",
        bSide: "home"
      })
    ).toEqual({ leftName: "Y", rightName: "Z" });
  });
});
