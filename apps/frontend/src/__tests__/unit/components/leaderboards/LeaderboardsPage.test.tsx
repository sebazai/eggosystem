import { render, screen } from "@testing-library/react";
import { LeaderboardsPage } from "@/components/leaderboards/LeaderboardsPage";
import { useFilters } from "@/context/FilterContext";
import { useLeaderboards } from "@/hooks/data/filtered/useLeaderboards";

// Mock the hooks
jest.mock("@/context/FilterContext", () => ({
  useFilters: jest.fn()
}));

jest.mock("@/hooks/data/filtered/useLeaderboards", () => ({
  useLeaderboards: jest.fn()
}));

// Mock child components
jest.mock("@/components/filters/MultiFilters", () => ({
  MultiFilters: () => <div data-testid="multi-filters">MultiFilters</div>
}));

jest.mock("@/components/leaderboards/LeaderboardsGrid", () => ({
  LeaderboardsGrid: () => (
    <div data-testid="leaderboards-grid">LeaderboardsGrid</div>
  )
}));

const mockUseFilters = jest.fn();
const mockUseLeaderboards = jest.fn();

describe("LeaderboardsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    (useFilters as jest.Mock).mockImplementation(mockUseFilters);
    (useLeaderboards as jest.Mock).mockImplementation(mockUseLeaderboards);
  });

  it("renders loading state when filters are loading", () => {
    mockUseFilters.mockReturnValue({
      filterParams: null,
      isLoading: true,
      error: null,
      isValidating: false,
      areFiltersEmpty: false
    });

    render(<LeaderboardsPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders error state when filters fail to load", () => {
    mockUseFilters.mockReturnValue({
      filterParams: null,
      isLoading: false,
      error: new Error("Failed to load filters"),
      isValidating: false,
      areFiltersEmpty: false
    });

    render(<LeaderboardsPage />);
    expect(screen.getByText("Failed to load filters")).toBeInTheDocument();
  });

  it("renders loading state when filters are validating", () => {
    mockUseFilters.mockReturnValue({
      filterParams: { seasons: [1] },
      isLoading: false,
      error: null,
      isValidating: true,
      areFiltersEmpty: false
    });

    render(<LeaderboardsPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the main heading", () => {
    mockUseFilters.mockReturnValue({
      filterParams: { seasons: [1] },
      isLoading: false,
      error: null,
      isValidating: false,
      areFiltersEmpty: false
    });

    render(<LeaderboardsPage />);
    expect(
      screen.getByRole("heading", { name: "Leaderboards" })
    ).toBeInTheDocument();
  });

  it("renders MultiFilters component", () => {
    mockUseFilters.mockReturnValue({
      filterParams: { seasons: [1] },
      isLoading: false,
      error: null,
      isValidating: false,
      areFiltersEmpty: false
    });

    render(<LeaderboardsPage />);
    expect(screen.getByTestId("multi-filters")).toBeInTheDocument();
  });

  it("shows message when filters are empty", () => {
    mockUseFilters.mockReturnValue({
      filterParams: { seasons: [1] },
      isLoading: false,
      error: null,
      isValidating: false,
      areFiltersEmpty: true
    });

    render(<LeaderboardsPage />);
    expect(screen.getByText("Please select one filter.")).toBeInTheDocument();
  });

  it("renders LeaderboardsGrid when filters are not empty", () => {
    mockUseFilters.mockReturnValue({
      filterParams: { seasons: [1] },
      isLoading: false,
      error: null,
      isValidating: false,
      areFiltersEmpty: false
    });

    render(<LeaderboardsPage />);
    expect(screen.getByTestId("leaderboards-grid")).toBeInTheDocument();
  });

  it("handles undefined filterParams gracefully", () => {
    mockUseFilters.mockReturnValue({
      filterParams: undefined,
      isLoading: false,
      error: null,
      isValidating: false,
      areFiltersEmpty: false
    });

    render(<LeaderboardsPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
