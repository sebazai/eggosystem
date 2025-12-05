import { render } from "@testing-library/react";
import { FilteredMatchesList } from "./FilteredMatchesList";
import { useRecentMatches } from "@/hooks/data/filtered/useRecentMatches";

// Mock the useRecentMatches hook
jest.mock("@/hooks/data/filtered/useRecentMatches", () => ({
  useRecentMatches: jest.fn()
}));

// Mock NextImageFallback
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

const mockMatches = [
  {
    match_id: 1,
    match_game_id: 101,
    match_date: "2024-01-15",
    team1_name: "Team Alpha",
    team1_logo: "alpha-logo.png",
    team1_score: 16,
    team2_name: "Team Beta",
    team2_logo: "beta-logo.png",
    team2_score: 12
  },
  {
    match_id: 2,
    match_game_id: 102,
    match_date: "2024-01-15",
    team1_name: "Team Gamma",
    team1_logo: "gamma-logo.png",
    team1_score: 13,
    team2_name: "Team Delta",
    team2_logo: "delta-logo.png",
    team2_score: 16
  },
  {
    match_id: 3,
    match_game_id: 103,
    match_date: "2024-01-14",
    team1_name: "Team Epsilon",
    team1_logo: "epsilon-logo.png",
    team1_score: 16,
    team2_name: "Team Zeta",
    team2_logo: "zeta-logo.png",
    team2_score: 14
  }
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
          {
            match_id: 4,
            match_game_id: null,
            match_date: "2024-01-13",
            team1_name: "Team Eta",
            team1_logo: "eta-logo.png",
            team1_score: 0,
            team2_name: "Team Theta",
            team2_logo: "theta-logo.png",
            team2_score: 0
          }
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
