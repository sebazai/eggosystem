import { render, screen } from "@testing-library/react";
import { FilteredMatchesList } from "./FilteredMatchesList";
import type { MatchesByFilters } from "@eggosystem/types";

const mockSwr = jest.fn();
jest.mock("swr", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockSwr(...args)
}));

const mockUseSearchParams = jest.fn(() => new URLSearchParams());
jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
  usePathname: () => "/matches",
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() })
}));

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

const defaultFilterParams = {
  seasons: [1],
  leagues: [1],
  stages: null,
  teams: null,
  maps: null
};

const mockMatch = (
  match_id: number,
  overrides: Partial<Omit<MatchesByFilters, "match_id">> = {}
): MatchesByFilters => ({
  match_id,
  match_game_id: 100 + match_id,
  match_group: 1,
  match_round: 1,
  best_of: 3,
  season_id: 5,
  match_date: "2024-01-15",
  start_timestamp: "2024-01-15T19:00:00Z",
  end_timestamp: "2024-01-15T21:00:00Z",
  stage: 2,
  league_name: "CS2 Masters",
  maps_json: [
    { name: "de_nuke", home_score: 13, away_score: 9 },
    { name: "de_mirage", home_score: 13, away_score: 6 }
  ],
  home_team: {
    name: "Team Alpha",
    logo: "alpha-logo.png",
    score: 2
  },
  away_team: {
    name: "Team Beta",
    logo: "beta-logo.png",
    score: 0
  },
  ...overrides
});

const mockMatches: MatchesByFilters[] = [
  mockMatch(1, { match_date: "2024-01-15" }),
  mockMatch(2, {
    match_date: "2024-01-15",
    home_team: { name: "Team Gamma", logo: "gamma-logo.png", score: 0 },
    away_team: { name: "Team Delta", logo: "delta-logo.png", score: 2 }
  }),
  mockMatch(3, {
    match_date: "2024-01-14",
    start_timestamp: "2024-01-14T19:00:00Z",
    end_timestamp: "2024-01-14T21:00:00Z",
    home_team: { name: "Team Epsilon", logo: "epsilon-logo.png", score: 2 },
    away_team: { name: "Team Zeta", logo: "zeta-logo.png", score: 1 },
    best_of: 5,
    maps_json: [
      { name: "de_inferno", home_score: 13, away_score: 9 },
      { name: "de_anubis", home_score: 7, away_score: 13 },
      { name: "de_mirage", home_score: 13, away_score: 11 }
    ]
  })
];

describe("FilteredMatchesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockSwr.mockImplementation((key: string) => {
      if (key === "/api/v1/seasons") {
        return {
          data: [{ id: 5, full_name: "Season 12" }],
          isLoading: false,
          isValidating: false
        };
      }
      if (key === "/api/v1/leagues") {
        return {
          data: [{ name: "CS2 Masters", sort_priority: 1 }],
          isLoading: false,
          isValidating: false
        };
      }
      return { data: undefined, isLoading: false, isValidating: false };
    });
  });

  function renderList(
    filterQueryParams = defaultFilterParams,
    matches: MatchesByFilters[] = mockMatches
  ) {
    return render(
      <FilteredMatchesList
        filterQueryParams={filterQueryParams}
        matches={matches}
      />
    );
  }

  it("groups matches by date with headings and counts", () => {
    renderList();

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent("JAN 15 · 2024");
    expect(headings[1]).toHaveTextContent("JAN 14 · 2024");
    expect(screen.getByText("2 matches")).toBeInTheDocument();
    expect(screen.getByText("1 match")).toBeInTheDocument();
  });

  it("renders team names from match data", () => {
    renderList();

    expect(screen.getAllByText("Team Alpha").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Team Gamma").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Team Epsilon").length).toBeGreaterThan(0);
  });

  it("links to game route when match_game_id is set", () => {
    renderList();

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/matches/1/games/101");
  });

  it("links to match route when match_game_id is null", () => {
    renderList(defaultFilterParams, [
      mockMatch(4, {
        match_game_id: null,
        home_team: { name: "Team Eta", logo: "eta-logo.png", score: 1 },
        away_team: { name: "Team Theta", logo: "theta-logo.png", score: 0 },
        maps_json: []
      })
    ]);

    expect(screen.getAllByRole("link")[0]).toHaveAttribute(
      "href",
      "/matches/4"
    );
  });

  it("orders date groups oldest first when sort=oldest", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("sort=oldest"));
    renderList();

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings[0]).toHaveTextContent("JAN 14 · 2024");
    expect(headings[1]).toHaveTextContent("JAN 15 · 2024");
  });

  it("orders date groups newest first by default", () => {
    renderList();

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings[0]).toHaveTextContent("JAN 15 · 2024");
    expect(headings[1]).toHaveTextContent("JAN 14 · 2024");
  });

  it("orders matches by league tier when sort=tier", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("sort=tier"));
    mockSwr.mockImplementation((key: string) => {
      if (key === "/api/v1/seasons") {
        return {
          data: [{ id: 5, full_name: "Season 12" }],
          isLoading: false,
          isValidating: false
        };
      }
      if (key === "/api/v1/leagues") {
        return {
          data: [
            { name: "CS2 Masters", sort_priority: 1 },
            { name: "CS2 Open", sort_priority: 2 }
          ],
          isLoading: false,
          isValidating: false
        };
      }
      return { data: undefined, isLoading: false, isValidating: false };
    });

    renderList(defaultFilterParams, [
      mockMatch(1, {
        league_name: "CS2 Open",
        start_timestamp: "2024-01-15T21:00:00Z"
      }),
      mockMatch(2, {
        league_name: "CS2 Masters",
        start_timestamp: "2024-01-15T19:00:00Z"
      })
    ]);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/matches/2/games/102");
    expect(links[1]).toHaveAttribute("href", "/matches/1/games/101");
  });

  it("shows season chip when more than one season is selected", () => {
    renderList({
      ...defaultFilterParams,
      seasons: [1, 2]
    });

    expect(screen.getAllByText("S12").length).toBeGreaterThan(0);
  });

  it("hides season chip when exactly one season is selected", () => {
    renderList({
      ...defaultFilterParams,
      seasons: [1]
    });

    expect(screen.queryByText("S12")).toBeNull();
  });
});
