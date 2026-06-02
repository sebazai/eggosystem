import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StandingsPage from "./StandingsPage";
import { useStandings } from "@/hooks/data/useStandings";
import { useStandingLeagues } from "@/hooks/data/useStandingLeagues";

jest.mock("@/hooks/data/useStandings");
jest.mock("@/hooks/data/useStandingLeagues");

const mockPush = jest.fn();
const mockUseSearchParams = jest.fn(() => new URLSearchParams());
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockUseSearchParams(),
  usePathname: () => "/seasons/14/standings",
  useParams: () => ({})
}));

jest.mock("@/components/layout/AutoBreadcrumbs", () => ({
  AutoBreadcrumbs: () => <nav data-testid="breadcrumbs" />
}));

jest.mock("@/components/standings/LeagueSelector", () => ({
  LeagueSelector: ({
    selectedLeague,
    onLeagueChange,
    allLeagues
  }: {
    selectedLeague: { external_id: string; league_name: string } | null;
    onLeagueChange: (id: string) => void;
    allLeagues: { external_id: string; league_name: string }[];
  }) => (
    <div data-testid="league-selector">
      <span data-testid="selected-league">
        {selectedLeague?.league_name ?? "none"}
      </span>
      {allLeagues.map((l) => (
        <button
          key={l.external_id}
          data-testid={`league-option-${l.external_id}`}
          onClick={() => onLeagueChange(l.external_id)}
        >
          {l.league_name}
        </button>
      ))}
    </div>
  )
}));

jest.mock("@/components/standings/StandingsTable", () => ({
  StandingsTable: ({
    data,
    isLoading
  }: {
    data: unknown[];
    isLoading: boolean;
  }) => (
    <div data-testid="standings-table">
      {isLoading ? "loading" : `rows:${data.length}`}
    </div>
  )
}));

jest.mock("@/components/loading", () => ({
  PageSkeleton: () => <div data-testid="page-skeleton" />
}));

const mockUseStandings = useStandings as jest.MockedFunction<
  typeof useStandings
>;
const mockUseStandingLeagues = useStandingLeagues as jest.MockedFunction<
  typeof useStandingLeagues
>;

const mockLeagues = [
  { external_id: "league-1", league_name: "Masters A", tier: 1 },
  { external_id: "league-2", league_name: "Masters B", tier: 2 }
] as any[];

const mockStandings = [
  {
    team_name: "Team Alpha",
    games_played: 5,
    maps_won: 4,
    maps_won_ot: 0,
    maps_lost: 1,
    maps_lost_ot: 0,
    points: 12,
    rounds_won: 80,
    rounds_lost: 50,
    rounds_diff: 30
  }
];

describe("StandingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("renders page skeleton when leagues are loading", () => {
    mockUseStandingLeagues.mockReturnValue({
      standingsLeagues: [],
      isLoading: true,
      isError: undefined,
      isValidating: false
    });
    mockUseStandings.mockReturnValue({
      standings: [],
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<StandingsPage seasonId="14" />);

    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("renders page skeleton when standings are loading", () => {
    mockUseStandingLeagues.mockReturnValue({
      standingsLeagues: mockLeagues,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseStandings.mockReturnValue({
      standings: [],
      isLoading: true,
      isError: undefined,
      isValidating: false
    });

    render(<StandingsPage seasonId="14" />);

    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("renders error message when leagues fail to load", () => {
    mockUseStandingLeagues.mockReturnValue({
      standingsLeagues: [],
      isLoading: false,
      isError: new Error("Failed"),
      isValidating: false
    });
    mockUseStandings.mockReturnValue({
      standings: [],
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<StandingsPage seasonId="14" />);

    expect(screen.getByText("Error loading leagues list")).toBeInTheDocument();
  });

  it("renders standings error state with league selector", () => {
    mockUseStandingLeagues.mockReturnValue({
      standingsLeagues: mockLeagues,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseStandings.mockReturnValue({
      standings: [],
      isLoading: false,
      isError: new Error("Standings failed"),
      isValidating: false
    });

    render(<StandingsPage seasonId="14" />);

    expect(screen.getByText("Failed to load standings")).toBeInTheDocument();
    expect(screen.getByTestId("league-selector")).toBeInTheDocument();
  });

  it("renders standings data and headers when loaded", () => {
    mockUseStandingLeagues.mockReturnValue({
      standingsLeagues: mockLeagues,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseStandings.mockReturnValue({
      standings: mockStandings,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<StandingsPage seasonId="14" />);

    expect(screen.getByText("League Standings")).toBeInTheDocument();
    expect(screen.getByTestId("standings-table")).toBeInTheDocument();
    expect(screen.getByTestId("league-selector")).toBeInTheDocument();
    expect(screen.getByText("rows:1")).toBeInTheDocument();
  });

  it("shows scoring system info when standings data is available", () => {
    mockUseStandingLeagues.mockReturnValue({
      standingsLeagues: mockLeagues,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseStandings.mockReturnValue({
      standings: mockStandings,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<StandingsPage seasonId="14" />);

    expect(screen.getByText(/Scoring System/)).toBeInTheDocument();
  });

  it("defaults to tier-1 league when no URL param is set", () => {
    mockUseStandingLeagues.mockReturnValue({
      standingsLeagues: mockLeagues,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseStandings.mockReturnValue({
      standings: mockStandings,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<StandingsPage seasonId="14" />);

    // useStandings should have been called with the tier-1 league id
    expect(mockUseStandings).toHaveBeenCalledWith("league-1");
  });

  it("uses the league from URL params when one is present", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("league=league-2"));
    mockUseStandingLeagues.mockReturnValue({
      standingsLeagues: mockLeagues,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseStandings.mockReturnValue({
      standings: mockStandings,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<StandingsPage seasonId="14" />);

    expect(mockUseStandings).toHaveBeenCalledWith("league-2");
    expect(screen.getByTestId("selected-league")).toHaveTextContent(
      "Masters B"
    );
  });

  it("calls router.push with new league param when user changes league", () => {
    mockUseStandingLeagues.mockReturnValue({
      standingsLeagues: mockLeagues,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseStandings.mockReturnValue({
      standings: mockStandings,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<StandingsPage seasonId="14" />);

    // Click the Masters B league option in the mocked LeagueSelector
    fireEvent.click(screen.getByTestId("league-option-league-2"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("league=league-2")
    );
  });

  it("does not navigate before the user changes league", () => {
    mockUseStandingLeagues.mockReturnValue({
      standingsLeagues: mockLeagues,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseStandings.mockReturnValue({
      standings: mockStandings,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<StandingsPage seasonId="14" />);

    expect(mockPush).not.toHaveBeenCalled();
  });
});
