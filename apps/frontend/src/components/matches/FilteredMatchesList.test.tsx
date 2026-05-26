import { render } from "@testing-library/react";
import { FilteredMatchesList } from "./FilteredMatchesList";
import { useRecentMatches } from "@/hooks/data/filtered/useRecentMatches";
import type { MatchesByFilters } from "@eggosystem/types";

jest.mock("@/hooks/data/filtered/useRecentMatches", () => ({
  useRecentMatches: jest.fn()
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
    { name: "de_nuke", score_a: 13, score_b: 9 },
    { name: "de_mirage", score_a: 13, score_b: 6 }
  ],
  team1_name: "Team Alpha",
  team2_name: "Team Beta",
  team1_logo: "alpha-logo.png",
  team2_logo: "beta-logo.png",
  team1_score: 2,
  team2_score: 0,
  team1_side: "home",
  team2_side: "away",
  ...overrides
});

const mockMatches: MatchesByFilters[] = [
  mockMatch(1, { match_date: "2024-01-15" }),
  mockMatch(2, {
    match_date: "2024-01-15",
    team1_name: "Team Gamma",
    team2_name: "Team Delta",
    team1_score: 0,
    team2_score: 2
  }),
  mockMatch(3, {
    match_date: "2024-01-14",
    team1_name: "Team Epsilon",
    team2_name: "Team Zeta",
    team1_score: 2,
    team2_score: 1,
    best_of: 5,
    maps_json: [
      { name: "de_inferno", score_a: 13, score_b: 9 },
      { name: "de_anubis", score_a: 7, score_b: 13 },
      { name: "de_mirage", score_a: 13, score_b: 11 }
    ]
  })
];

describe("FilteredMatchesList", () => {
  const mockUseRecentMatches = useRecentMatches as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Snapshot Tests", () => {
    it("renders correctly with matches grouped by date", () => {
      mockUseRecentMatches.mockReturnValue({
        matches: mockMatches,
        isLoading: false,
        isError: false,
        isValidating: false
      });

      const { container } = render(
        <FilteredMatchesList
          filterQueryParams={{
            seasons: [1],
            leagues: [1],
            stages: null,
            teams: null,
            maps: null
          }}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly in loading state", () => {
      mockUseRecentMatches.mockReturnValue({
        matches: undefined,
        isLoading: true,
        isError: false,
        isValidating: false
      });

      const { container } = render(
        <FilteredMatchesList
          filterQueryParams={{
            seasons: [1],
            leagues: [1],
            stages: null,
            teams: null,
            maps: null
          }}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly in validating state", () => {
      mockUseRecentMatches.mockReturnValue({
        matches: undefined,
        isLoading: false,
        isError: false,
        isValidating: true
      });

      const { container } = render(
        <FilteredMatchesList
          filterQueryParams={{
            seasons: [1],
            leagues: [1],
            stages: null,
            teams: null,
            maps: null
          }}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly in error state", () => {
      mockUseRecentMatches.mockReturnValue({
        matches: undefined,
        isLoading: false,
        isError: true,
        isValidating: false
      });

      const { container } = render(
        <FilteredMatchesList
          filterQueryParams={{
            seasons: [1],
            leagues: [1],
            stages: null,
            teams: null,
            maps: null
          }}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly when no matches found", () => {
      mockUseRecentMatches.mockReturnValue({
        matches: null,
        isLoading: false,
        isError: false,
        isValidating: false
      });

      const { container } = render(
        <FilteredMatchesList
          filterQueryParams={{
            seasons: [1],
            leagues: [1],
            stages: null,
            teams: null,
            maps: null
          }}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly with match that has no game id", () => {
      mockUseRecentMatches.mockReturnValue({
        matches: [
          mockMatch(4, {
            match_game_id: null,
            team1_name: "Team Eta",
            team2_name: "Team Theta",
            team1_score: 0,
            team2_score: 0,
            maps_json: []
          })
        ],
        isLoading: false,
        isError: false,
        isValidating: false
      });

      const { container } = render(
        <FilteredMatchesList
          filterQueryParams={{
            seasons: [1],
            leagues: [1],
            stages: null,
            teams: null,
            maps: null
          }}
        />
      );
      expect(container).toMatchSnapshot();
    });
  });
});
