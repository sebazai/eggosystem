import { render, screen } from "@testing-library/react";
import { MatchCard } from "./MatchCard";
import { useMatchMvp } from "@/context/MatchMvpContext";
import type { MatchMvp, MatchesByFilters } from "@eggosystem/types";
import type { ReactElement } from "react";

jest.mock("@/context/MatchMvpContext", () => ({
  ...jest.requireActual("@/context/MatchMvpContext"),
  useMatchMvp: jest.fn()
}));

const mockUseMatchMvp = useMatchMvp as jest.MockedFunction<typeof useMatchMvp>;

jest.mock("@/components/layout/NextImageFallback", () => ({
  NextImageFallback: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => <img src={src} alt={alt} {...props} />
}));

const baseMatch: MatchesByFilters = {
  match_id: 1,
  match_game_id: 101,
  match_group: 3,
  match_round: 1,
  best_of: 3,
  season_id: 5,
  match_date: "2026-05-23",
  start_timestamp: "2026-05-23T19:00:00Z",
  end_timestamp: "2026-05-23T21:11:00Z",
  stage: 2,
  league_name: "CS2 Masters",
  maps_json: [
    { name: "de_nuke", home_score: 9, away_score: 13 },
    { name: "de_mirage", home_score: 6, away_score: 13 }
  ],
  home_team: {
    name: "WIOSS",
    logo: "wioss-logo.png",
    score: 0
  },
  away_team: {
    name: "KT",
    logo: "kt-logo.png",
    score: 2
  }
};

function renderMatchCard(ui: ReactElement) {
  return render(ui);
}

const seededMvp: MatchMvp = {
  match_id: 1,
  steam_id: "76561198024059644",
  nickname: "Shwifty",
  avatar: null,
  team_id: 2035,
  kana_rating: 1.02
};

describe("MatchCard", () => {
  beforeEach(() => {
    mockUseMatchMvp.mockReturnValue({
      seriesMvp: undefined,
      isMvpLoading: false,
      visibilityRef: jest.fn()
    });
  });

  it("renders both team names", () => {
    renderMatchCard(<MatchCard match={baseMatch} href="/matches/1" />);
    expect(screen.getAllByText("WIOSS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("KT").length).toBeGreaterThan(0);
  });

  it("renders the score", () => {
    renderMatchCard(<MatchCard match={baseMatch} href="/matches/1" />);
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("renders the stage label (Grand Final for stage 2, group 3)", () => {
    renderMatchCard(<MatchCard match={baseMatch} href="/matches/1" />);
    expect(screen.getAllByText("Grand Final").length).toBeGreaterThan(0);
  });

  it("renders map score chips", () => {
    renderMatchCard(<MatchCard match={baseMatch} href="/matches/1" />);
    expect(screen.getAllByText("de_nuke").length).toBeGreaterThan(0);
    expect(screen.getAllByText("de_mirage").length).toBeGreaterThan(0);
  });

  it("renders the DivisionPill label for the league name", () => {
    renderMatchCard(<MatchCard match={baseMatch} href="/matches/1" />);
    expect(screen.getAllByText("CS2 Masters").length).toBeGreaterThan(0);
  });

  it("renders duration when end_timestamp is present", () => {
    renderMatchCard(<MatchCard match={baseMatch} href="/matches/1" />);
    expect(screen.getAllByText("2h 11m").length).toBeGreaterThan(0);
  });

  it("does not render duration when end_timestamp is null", () => {
    const matchNoEnd = { ...baseMatch, end_timestamp: null };
    renderMatchCard(<MatchCard match={matchNoEnd} href="/matches/1" />);
    expect(screen.queryByText(/\dh \d+m/)).toBeNull();
  });

  it("renders SeasonChip when showSeason and seasonLabel are provided", () => {
    renderMatchCard(
      <MatchCard
        match={baseMatch}
        href="/matches/1"
        showSeason
        seasonLabel="S5"
      />
    );
    expect(screen.getAllByText("S5").length).toBeGreaterThan(0);
  });

  it("does not render SeasonChip when showSeason is false", () => {
    renderMatchCard(
      <MatchCard match={baseMatch} href="/matches/1" seasonLabel="S5" />
    );
    expect(screen.queryByText("S5")).toBeNull();
  });

  it("renders no map chips when maps_json is empty", () => {
    const matchNoMaps = { ...baseMatch, maps_json: [] };
    renderMatchCard(<MatchCard match={matchNoMaps} href="/matches/1" />);
    expect(screen.queryByText("de_nuke")).toBeNull();
  });

  it("links to the correct href", () => {
    renderMatchCard(
      <MatchCard match={baseMatch} href="/matches/1/games/101" />
    );
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/matches/1/games/101");
  });

  it("highlights the winning series score on desktop layout", () => {
    const { container } = renderMatchCard(
      <MatchCard match={baseMatch} href="/matches/1" />
    );
    const winnerScores = container.querySelectorAll(".text-kanaliiga-orange");
    expect(winnerScores.length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".opacity-40")).toHaveLength(0);
  });

  it("renders home team on the left and map scores in home:away order", () => {
    const match: MatchesByFilters = {
      ...baseMatch,
      home_team: { name: "Alpha", logo: "a.png", score: 0 },
      away_team: { name: "Beta", logo: "b.png", score: 1 },
      maps_json: [{ name: "de_nuke", home_score: 9, away_score: 13 }]
    };
    const { container } = renderMatchCard(
      <MatchCard match={match} href="/matches/1" />
    );

    expect(screen.getAllByText("Alpha").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Beta").length).toBeGreaterThan(0);

    const nukeLabels = screen.getAllByText("de_nuke");
    for (const label of nukeLabels) {
      const chip = label.closest(".inline-flex");
      expect(chip?.textContent).toContain("9");
      expect(chip?.textContent).toContain("13");
      const boldScore = chip?.querySelector(".font-bold.text-foreground");
      expect(boldScore?.textContent).toBe("13");
    }

    const winnerSeriesScores = container.querySelectorAll(
      ".text-kanaliiga-orange"
    );
    expect(winnerSeriesScores.length).toBeGreaterThan(0);
  });

  it("renders regular season kicker for stage 1", () => {
    const stage1Match = {
      ...baseMatch,
      stage: 1,
      match_group: 2,
      match_round: 3
    };
    renderMatchCard(<MatchCard match={stage1Match} href="/matches/1" />);
    expect(screen.getAllByText("Regular Season").length).toBeGreaterThan(0);
  });

  it("renders series MVP nickname when cached", () => {
    mockUseMatchMvp.mockReturnValue({
      seriesMvp: seededMvp,
      isMvpLoading: false,
      visibilityRef: jest.fn()
    });

    renderMatchCard(<MatchCard match={baseMatch} href="/matches/1" />);
    expect(screen.getAllByText("Shwifty").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1.02").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kanarating").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MVP").length).toBeGreaterThan(0);
  });

  it("renders MVP loading skeleton when fetch is in progress", () => {
    mockUseMatchMvp.mockReturnValue({
      seriesMvp: undefined,
      isMvpLoading: true,
      visibilityRef: jest.fn()
    });

    renderMatchCard(<MatchCard match={baseMatch} href="/matches/1" />);
    expect(document.querySelector('[data-slot="skeleton"]')).toBeTruthy();
  });

  it("renders em dash when MVP is not cached", () => {
    renderMatchCard(<MatchCard match={baseMatch} href="/matches/1" />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders em dash when MVP fetch returned no stats", () => {
    mockUseMatchMvp.mockReturnValue({
      seriesMvp: null,
      isMvpLoading: false,
      visibilityRef: jest.fn()
    });

    renderMatchCard(<MatchCard match={baseMatch} href="/matches/1" />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("truncates long MVP nicknames with a hyphen instead of ellipsis", () => {
    mockUseMatchMvp.mockReturnValue({
      seriesMvp: {
        ...seededMvp,
        nickname: "VeryLongPlayerNickname"
      },
      isMvpLoading: false,
      visibilityRef: jest.fn()
    });

    renderMatchCard(<MatchCard match={baseMatch} href="/matches/1" />);
    expect(screen.getAllByText("VeryLongPlaye-").length).toBeGreaterThan(0);
    expect(screen.queryByText(/\.\.\./)).toBeNull();
  });
});
