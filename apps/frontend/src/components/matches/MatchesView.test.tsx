import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchesView } from "./MatchesView";
import { useFilters } from "@/context/FilterContext";
import { useRecentMatches } from "@/hooks/data/filtered/useRecentMatches";

jest.mock("@/context/FilterContext");
jest.mock("@/hooks/data/filtered/useRecentMatches");

jest.mock("./MatchPageHeader", () => ({
  MatchPageHeader: () => <div data-testid="match-page-header" />
}));

jest.mock("./FilterBarDesktop", () => ({
  FilterBarDesktop: () => <div data-testid="filter-bar-desktop" />
}));

jest.mock("./FilterBarMobile", () => ({
  FilterBarMobile: () => <div data-testid="filter-bar-mobile" />
}));

jest.mock("./SummaryStrip", () => ({
  SummaryStrip: () => <div data-testid="summary-strip" />
}));

jest.mock("./FilteredMatchesList", () => ({
  FilteredMatchesList: ({ matches }: { matches: unknown[] }) => (
    <div data-testid="filtered-matches-list">matches:{matches.length}</div>
  )
}));

jest.mock("@/components/loading", () => ({
  MatchListSkeleton: () => <div data-testid="match-list-skeleton" />
}));

jest.mock("@/components/layout/ContentContainer", () => ({
  ContentContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

const mockUseFilters = useFilters as jest.MockedFunction<typeof useFilters>;
const mockUseRecentMatches = useRecentMatches as jest.MockedFunction<
  typeof useRecentMatches
>;

const makeFiltersValue = (
  overrides: Partial<ReturnType<typeof useFilters>>
): ReturnType<typeof useFilters> => ({
  activeSeason: null,
  filterParams: {
    seasons: null,
    leagues: null,
    stages: null,
    teams: null,
    maps: null,
    player_name: null
  },
  filterQueryString: "",
  getFilteredQueryString: jest.fn().mockReturnValue(""),
  isLoading: false,
  isValidating: false,
  error: undefined,
  areFiltersEmpty: true,
  ...overrides
});

const defaultFilterParams = {
  seasons: [1],
  leagues: [],
  stages: null,
  teams: null,
  maps: null,
  player_name: null
};

const emptyFilterParams = {
  seasons: null,
  leagues: null,
  stages: null,
  teams: null,
  maps: null,
  player_name: null
};

describe("MatchesView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders match page header always", () => {
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: emptyFilterParams, isLoading: true })
    );
    mockUseRecentMatches.mockReturnValue({
      matches: undefined,
      isLoading: true,
      isError: undefined,
      isValidating: false
    });

    render(<MatchesView />);
    expect(screen.getByTestId("match-page-header")).toBeInTheDocument();
  });

  it("shows skeleton when filters are loading", () => {
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: emptyFilterParams, isLoading: true })
    );
    mockUseRecentMatches.mockReturnValue({
      matches: undefined,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<MatchesView />);
    expect(screen.getByTestId("match-list-skeleton")).toBeInTheDocument();
  });

  it("shows filter bars when filterParams are loaded", () => {
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: defaultFilterParams })
    );
    mockUseRecentMatches.mockReturnValue({
      matches: [],
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<MatchesView />);
    expect(screen.getByTestId("filter-bar-desktop")).toBeInTheDocument();
    expect(screen.getByTestId("filter-bar-mobile")).toBeInTheDocument();
  });

  it("shows filter error message when filters fail", () => {
    mockUseFilters.mockReturnValue(
      makeFiltersValue({
        filterParams: emptyFilterParams,
        error: new Error("filter error")
      })
    );
    mockUseRecentMatches.mockReturnValue({
      matches: undefined,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<MatchesView />);
    expect(screen.getByText("Failed to load filters")).toBeInTheDocument();
  });

  it("shows matches error message when matches request fails", () => {
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: defaultFilterParams })
    );
    mockUseRecentMatches.mockReturnValue({
      matches: undefined,
      isLoading: false,
      isError: new Error("matches error"),
      isValidating: false
    });

    render(<MatchesView />);
    expect(screen.getByText("Error loading Matches")).toBeInTheDocument();
  });

  it("shows no matches message when matches list is empty", () => {
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: defaultFilterParams })
    );
    mockUseRecentMatches.mockReturnValue({
      matches: [],
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<MatchesView />);
    expect(screen.getByText("No matches found")).toBeInTheDocument();
  });

  it("renders match list when matches are available", () => {
    const mockMatches = [{ match_id: 1 }, { match_id: 2 }] as ReturnType<
      typeof useRecentMatches
    >["matches"];
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: defaultFilterParams })
    );
    mockUseRecentMatches.mockReturnValue({
      matches: mockMatches,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<MatchesView />);
    expect(screen.getByTestId("filtered-matches-list")).toBeInTheDocument();
    expect(screen.getByText("matches:2")).toBeInTheDocument();
  });

  it("shows summary strip when matches are available", () => {
    const mockMatches = [{ match_id: 1 }] as ReturnType<
      typeof useRecentMatches
    >["matches"];
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: defaultFilterParams })
    );
    mockUseRecentMatches.mockReturnValue({
      matches: mockMatches,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<MatchesView />);
    expect(screen.getByTestId("summary-strip")).toBeInTheDocument();
  });

  it("shows skeleton when matches are fetching", () => {
    mockUseFilters.mockReturnValue(
      makeFiltersValue({ filterParams: defaultFilterParams })
    );
    mockUseRecentMatches.mockReturnValue({
      matches: undefined,
      isLoading: true,
      isError: undefined,
      isValidating: false
    });

    render(<MatchesView />);
    expect(screen.getByTestId("match-list-skeleton")).toBeInTheDocument();
  });
});
