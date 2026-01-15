/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import SortterPage from "@/app/(admin)/dashboard/sortter/page";
import { useSortter } from "@/hooks/data/dashboard/useSortter";
import { clientApiFetch } from "@/lib/apiClient";

// Mock Next.js App Router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/"
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
  useParams: () => ({}),
  redirect: jest.fn(),
  notFound: jest.fn()
}));

// Mock the useSortter hook
jest.mock("@/hooks/data/dashboard/useSortter", () => ({
  useSortter: jest.fn()
}));

// Mock the useTeamHistory hook
jest.mock("@/hooks/data/dashboard/useTeamHistory", () => ({
  useTeamHistory: jest.fn(() => ({
    history: [],
    isLoading: false,
    isValidating: false,
    error: null
  }))
}));

// Mock useAllSeasons hook (used by SelectedSeasonBadge)
jest.mock("@/hooks/data/dashboard/useAllSeasons", () => ({
  useAllSeasons: jest.fn(() => ({
    seasons: [],
    isLoading: false,
    isError: false,
    isValidating: false
  }))
}));

// Mock useDashboardSeason hook (used by SelectedSeasonBadge)
jest.mock("@/hooks/data/dashboard/useDashboardSeason", () => ({
  useDashboardSeason: jest.fn(() => ({
    selectedSeasonId: null,
    setSelectedSeasonId: jest.fn()
  }))
}));

// Mock WithRoleProtection component
jest.mock("@/components/dashboard/WithRoleProtection", () => ({
  WithRoleProtection: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

// Mock toast notifications
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

// Mock SWR
jest.mock("swr", () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock API client
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn()
}));

// Mock UI components

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}));

jest.mock("@/components/ui/spinner", () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>
}));

jest.mock("@/components/ui/textarea", () => ({
  Textarea: ({ value, onChange, ...props }: any) => (
    <textarea value={value} onChange={onChange} {...props} />
  )
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange, ...props }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      {...props}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>
}));

jest.mock("@/components/ui/chart", () => ({
  ChartContainer: ({ children }: any) => <div>{children}</div>,
  ChartTooltip: ({ children }: any) => <div>{children}</div>,
  ChartTooltipContent: ({ children }: any) => <div>{children}</div>
}));

jest.mock("recharts", () => ({
  XAxis: () => null,
  YAxis: () => null,
  Area: () => null,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  CartesianGrid: () => null
}));

describe("SortterPage", () => {
  // Helper function to suppress console errors during tests
  function renderWithErrorSuppression(component: React.ReactElement) {
    let consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      return render(component);
    } catch (error) {
      consoleSpy.mockRestore();
      // Handle AggregateError by returning a fallback render
      if (error instanceof AggregateError) {
        consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        return render(
          <div data-testid="error-fallback">Component failed to render</div>
        );
      }
      throw error;
    }
  }

  // Mock data for tests
  const mockTeams = [
    {
      team_id: 1,
      team_name: "Team 1",
      top5_values: [350, 345, 340, 335, 330],
      avg5: 342.5
    },
    {
      team_id: 2,
      team_name: "Team 2",
      top5_values: [340, 335, 330, 325, 320],
      avg5: 332.5
    }
  ];

  const mockSeasons = [
    { id: 1, name: "Season 1" },
    { id: 2, name: "Season 2" }
  ];

  const mockPlacements = [
    {
      team_id: 1,
      team_name: "Team 1",
      division: 1,
      comments: "Good team",
      original_avg: 342.5,
      original_position: 0
    },
    {
      team_id: 2,
      team_name: "Team 2",
      division: 1,
      comments: "",
      original_avg: 332.5,
      original_position: 1
    }
  ];

  // Mock functions
  const mockSetSelectedSeason = jest.fn();
  const mockHandleCommentChange = jest.fn();
  const mockHandleDivisionChange = jest.fn();
  const mockSavePlacements = jest.fn();
  const mockFinalizePlacements = jest.fn();
  const mockShowTeamPlayerValues = jest.fn();
  const mockCloseTeamPlayerValues = jest.fn();
  const mockPrefetchPlayerValues = jest.fn();

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation for useSortter
    (useSortter as jest.Mock).mockReturnValue({
      teams: mockTeams,
      seasons: mockSeasons,
      playerValues: [],
      placements: mockPlacements,
      selectedSeason: 2,
      selectedTeamId: null,
      floatingPosition: null,
      comments: { 1: "Good team" },
      divisions: { 1: 1, 2: 1 },
      isLoadingTeams: false,
      isLoadingSeasons: false,
      isLoadingPlayerValues: false,
      isLoadingPlacements: false,
      isSaving: false,
      isFinalizing: false,
      isViewMode: false,
      error: null,
      setSelectedSeason: mockSetSelectedSeason,
      showTeamPlayerValues: mockShowTeamPlayerValues,
      closeTeamPlayerValues: mockCloseTeamPlayerValues,
      prefetchPlayerValues: mockPrefetchPlayerValues,
      handleCommentChange: mockHandleCommentChange,
      handleDivisionChange: mockHandleDivisionChange,
      savePlacements: mockSavePlacements,
      finalizePlacements: mockFinalizePlacements
    });
  });

  it("renders the sortter page with team data", () => {
    renderWithErrorSuppression(<SortterPage />);

    // Check if the page title is rendered
    expect(screen.getByText("Sortter")).toBeInTheDocument();

    // Check if teams are rendered
    expect(screen.getByText("Team 1")).toBeInTheDocument();
    expect(screen.getByText("Team 2")).toBeInTheDocument();

    // Check if division summary is rendered
    expect(screen.getByText("Division Summary")).toBeInTheDocument();

    // Check if action buttons are rendered
    expect(screen.getByText("Save Placements")).toBeInTheDocument();
    expect(screen.getByText("Finalize Placements")).toBeInTheDocument();
    expect(screen.getByText("Populate Kanaelo Queue")).toBeInTheDocument();
  });

  it("renders loading state when loading teams", () => {
    (useSortter as jest.Mock).mockReturnValue({
      teams: mockTeams,
      seasons: mockSeasons,
      playerValues: [],
      placements: mockPlacements,
      selectedSeason: 2,
      selectedTeamId: null,
      floatingPosition: null,
      comments: { 1: "Good team" },
      divisions: { 1: 1, 2: 1 },
      isLoadingTeams: true,
      isLoadingSeasons: false,
      isLoadingPlayerValues: false,
      isLoadingPlacements: false,
      isSaving: false,
      isFinalizing: false,
      isViewMode: false,
      error: null,
      setSelectedSeason: mockSetSelectedSeason,
      showTeamPlayerValues: mockShowTeamPlayerValues,
      closeTeamPlayerValues: mockCloseTeamPlayerValues,
      prefetchPlayerValues: mockPrefetchPlayerValues,
      handleCommentChange: mockHandleCommentChange,
      handleDivisionChange: mockHandleDivisionChange,
      savePlacements: mockSavePlacements,
      finalizePlacements: mockFinalizePlacements
    });

    render(<SortterPage />);

    expect(screen.getByText("Loading team data...")).toBeInTheDocument();
  });

  it("renders error state when there is an error", () => {
    (useSortter as jest.Mock).mockReturnValue({
      teams: mockTeams,
      seasons: mockSeasons,
      playerValues: [],
      placements: mockPlacements,
      selectedSeason: 2,
      selectedTeamId: null,
      floatingPosition: null,
      comments: { 1: "Good team" },
      divisions: { 1: 1, 2: 1 },
      isLoadingTeams: false,
      isLoadingSeasons: false,
      isLoadingPlayerValues: false,
      isLoadingPlacements: false,
      isSaving: false,
      isFinalizing: false,
      isViewMode: false,
      error: "Failed to load data",
      setSelectedSeason: mockSetSelectedSeason,
      showTeamPlayerValues: mockShowTeamPlayerValues,
      closeTeamPlayerValues: mockCloseTeamPlayerValues,
      prefetchPlayerValues: mockPrefetchPlayerValues,
      handleCommentChange: mockHandleCommentChange,
      handleDivisionChange: mockHandleDivisionChange,
      savePlacements: mockSavePlacements,
      finalizePlacements: mockFinalizePlacements
    });

    renderWithErrorSuppression(<SortterPage />);

    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
  });

  it("calls savePlacements when Save Placements button is clicked", async () => {
    renderWithErrorSuppression(<SortterPage />);

    const saveButton = screen.getByText("Save Placements");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(mockSavePlacements).toHaveBeenCalledTimes(1);
  });

  it("calls finalizePlacements when Finalize Placements button is clicked", async () => {
    renderWithErrorSuppression(<SortterPage />);

    const finalizeButton = screen.getByText("Finalize Placements");
    await act(async () => {
      fireEvent.click(finalizeButton);
    });

    expect(mockFinalizePlacements).toHaveBeenCalledTimes(1);
  });

  it("disables action buttons in view mode", () => {
    (useSortter as jest.Mock).mockReturnValue({
      teams: mockTeams,
      seasons: mockSeasons,
      playerValues: [],
      placements: mockPlacements,
      selectedSeason: 2,
      selectedTeamId: null,
      floatingPosition: null,
      comments: { 1: "Good team" },
      divisions: { 1: 1, 2: 1 },
      isLoadingTeams: false,
      isLoadingSeasons: false,
      isLoadingPlayerValues: false,
      isLoadingPlacements: false,
      isSaving: false,
      isFinalizing: false,
      isViewMode: true,
      error: null,
      setSelectedSeason: mockSetSelectedSeason,
      showTeamPlayerValues: mockShowTeamPlayerValues,
      closeTeamPlayerValues: mockCloseTeamPlayerValues,
      prefetchPlayerValues: mockPrefetchPlayerValues,
      handleCommentChange: mockHandleCommentChange,
      handleDivisionChange: mockHandleDivisionChange,
      savePlacements: mockSavePlacements,
      finalizePlacements: mockFinalizePlacements
    });

    renderWithErrorSuppression(<SortterPage />);

    expect(
      screen.getByText("Save Placements").closest("button")
    ).toBeDisabled();
    expect(
      screen.getByText("Finalize Placements").closest("button")
    ).toBeDisabled();
    expect(
      screen.getByText("Populate Kanaelo Queue").closest("button")
    ).toBeDisabled();
    expect(
      screen.getByText("View Mode - Placements have been finalized")
    ).toBeInTheDocument();
  });

  it("disables action buttons when no season is selected", () => {
    (useSortter as jest.Mock).mockReturnValue({
      teams: mockTeams,
      seasons: mockSeasons,
      playerValues: [],
      placements: mockPlacements,
      selectedSeason: null,
      selectedTeamId: null,
      floatingPosition: null,
      comments: { 1: "Good team" },
      divisions: { 1: 1, 2: 1 },
      isLoadingTeams: false,
      isLoadingSeasons: false,
      isLoadingPlayerValues: false,
      isLoadingPlacements: false,
      isSaving: false,
      isFinalizing: false,
      isViewMode: false,
      error: null,
      setSelectedSeason: mockSetSelectedSeason,
      showTeamPlayerValues: mockShowTeamPlayerValues,
      closeTeamPlayerValues: mockCloseTeamPlayerValues,
      prefetchPlayerValues: mockPrefetchPlayerValues,
      handleCommentChange: mockHandleCommentChange,
      handleDivisionChange: mockHandleDivisionChange,
      savePlacements: mockSavePlacements,
      finalizePlacements: mockFinalizePlacements
    });

    renderWithErrorSuppression(<SortterPage />);

    expect(
      screen.getByText("Save Placements").closest("button")
    ).toBeDisabled();
    expect(
      screen.getByText("Finalize Placements").closest("button")
    ).toBeDisabled();
    expect(
      screen.getByText("Populate Kanaelo Queue").closest("button")
    ).toBeDisabled();
  });

  it("shows loading state when saving placements", () => {
    (useSortter as jest.Mock).mockReturnValue({
      teams: mockTeams,
      seasons: mockSeasons,
      playerValues: [],
      placements: mockPlacements,
      selectedSeason: 2,
      selectedTeamId: null,
      floatingPosition: null,
      comments: { 1: "Good team" },
      divisions: { 1: 1, 2: 1 },
      isLoadingTeams: false,
      isLoadingSeasons: false,
      isLoadingPlayerValues: false,
      isLoadingPlacements: false,
      isSaving: true,
      isFinalizing: false,
      isViewMode: false,
      error: null,
      setSelectedSeason: mockSetSelectedSeason,
      showTeamPlayerValues: mockShowTeamPlayerValues,
      closeTeamPlayerValues: mockCloseTeamPlayerValues,
      prefetchPlayerValues: mockPrefetchPlayerValues,
      handleCommentChange: mockHandleCommentChange,
      handleDivisionChange: mockHandleDivisionChange,
      savePlacements: mockSavePlacements,
      finalizePlacements: mockFinalizePlacements
    });

    renderWithErrorSuppression(<SortterPage />);

    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("shows loading state when finalizing placements", () => {
    (useSortter as jest.Mock).mockReturnValue({
      teams: mockTeams,
      seasons: mockSeasons,
      playerValues: [],
      placements: mockPlacements,
      selectedSeason: 2,
      selectedTeamId: null,
      floatingPosition: null,
      comments: { 1: "Good team" },
      divisions: { 1: 1, 2: 1 },
      isLoadingTeams: false,
      isLoadingSeasons: false,
      isLoadingPlayerValues: false,
      isLoadingPlacements: false,
      isSaving: false,
      isFinalizing: true,
      isViewMode: false,
      error: null,
      setSelectedSeason: mockSetSelectedSeason,
      showTeamPlayerValues: mockShowTeamPlayerValues,
      closeTeamPlayerValues: mockCloseTeamPlayerValues,
      prefetchPlayerValues: mockPrefetchPlayerValues,
      handleCommentChange: mockHandleCommentChange,
      handleDivisionChange: mockHandleDivisionChange,
      savePlacements: mockSavePlacements,
      finalizePlacements: mockFinalizePlacements
    });

    renderWithErrorSuppression(<SortterPage />);

    expect(screen.getByText("Finalizing...")).toBeInTheDocument();
  });

  it("calls populate kanaelo queue when button is clicked", async () => {
    // Mock the clientApiFetch for the populate queue API call
    const mockClientApiFetch = jest.mocked(clientApiFetch);
    mockClientApiFetch.mockResolvedValueOnce({
      message: "Successfully added players to queue",
      season_id: 2,
      total_players: 50,
      queued_players: 45,
      failed_players: 5
    });

    renderWithErrorSuppression(<SortterPage />);

    const populateButton = screen.getByText("Populate Kanaelo Queue");
    await act(async () => {
      fireEvent.click(populateButton);
    });

    // Verify the API was called
    expect(mockClientApiFetch).toHaveBeenCalledWith(
      "/api/v1/dashboard/sortter/season/2/populate-kanaelo-queue",
      {
        method: "POST"
      }
    );
  });

  it("disables populate kanaelo queue button in view mode", () => {
    (useSortter as jest.Mock).mockReturnValue({
      teams: mockTeams,
      seasons: mockSeasons,
      playerValues: [],
      placements: mockPlacements,
      selectedSeason: 2,
      selectedTeamId: null,
      floatingPosition: null,
      comments: { 1: "Good team" },
      divisions: { 1: 1, 2: 1 },
      isLoadingTeams: false,
      isLoadingSeasons: false,
      isLoadingPlayerValues: false,
      isLoadingPlacements: false,
      isSaving: false,
      isFinalizing: false,
      isViewMode: true,
      error: null,
      setSelectedSeason: mockSetSelectedSeason,
      showTeamPlayerValues: mockShowTeamPlayerValues,
      closeTeamPlayerValues: mockCloseTeamPlayerValues,
      prefetchPlayerValues: mockPrefetchPlayerValues,
      handleCommentChange: mockHandleCommentChange,
      handleDivisionChange: mockHandleDivisionChange,
      savePlacements: mockSavePlacements,
      finalizePlacements: mockFinalizePlacements
    });

    renderWithErrorSuppression(<SortterPage />);

    expect(
      screen.getByText("Populate Kanaelo Queue").closest("button")
    ).toBeDisabled();
  });

  it("disables populate kanaelo queue button when no season is selected", () => {
    (useSortter as jest.Mock).mockReturnValue({
      teams: mockTeams,
      seasons: mockSeasons,
      playerValues: [],
      placements: mockPlacements,
      selectedSeason: null,
      selectedTeamId: null,
      floatingPosition: null,
      comments: { 1: "Good team" },
      divisions: { 1: 1, 2: 1 },
      isLoadingTeams: false,
      isLoadingSeasons: false,
      isLoadingPlayerValues: false,
      isLoadingPlacements: false,
      isSaving: false,
      isFinalizing: false,
      isViewMode: false,
      error: null,
      setSelectedSeason: mockSetSelectedSeason,
      showTeamPlayerValues: mockShowTeamPlayerValues,
      closeTeamPlayerValues: mockCloseTeamPlayerValues,
      prefetchPlayerValues: mockPrefetchPlayerValues,
      handleCommentChange: mockHandleCommentChange,
      handleDivisionChange: mockHandleDivisionChange,
      savePlacements: mockSavePlacements,
      finalizePlacements: mockFinalizePlacements
    });

    renderWithErrorSuppression(<SortterPage />);

    expect(
      screen.getByText("Populate Kanaelo Queue").closest("button")
    ).toBeDisabled();
  });

  it("disables Save and Finalize buttons when kana_elo error is present but keeps Populate Kanaelo Queue enabled", () => {
    // This test reproduces the bug: Save/Finalize buttons should be DISABLED when kana_elo is missing
    (useSortter as jest.Mock).mockReturnValue({
      teams: mockTeams,
      seasons: mockSeasons,
      playerValues: [],
      placements: [], // No placements because of kana_elo error
      selectedSeason: 2,
      selectedTeamId: null,
      floatingPosition: null,
      comments: {},
      divisions: {},
      isLoadingTeams: false,
      isLoadingSeasons: false,
      isLoadingPlayerValues: false,
      isLoadingPlacements: false,
      isSaving: false,
      isFinalizing: false,
      isViewMode: false,
      error:
        "Cannot generate placements: kana_elo data has not been calculated yet. Please complete the kanaelo calculation process first.",
      setSelectedSeason: mockSetSelectedSeason,
      showTeamPlayerValues: mockShowTeamPlayerValues,
      closeTeamPlayerValues: mockCloseTeamPlayerValues,
      prefetchPlayerValues: mockPrefetchPlayerValues,
      handleCommentChange: mockHandleCommentChange,
      handleDivisionChange: mockHandleDivisionChange,
      savePlacements: mockSavePlacements,
      finalizePlacements: mockFinalizePlacements
    });

    renderWithErrorSuppression(<SortterPage />);

    // Should show kana_elo specific error message
    expect(screen.getByText("Kanaelo Data Required")).toBeInTheDocument();
    expect(
      screen.getByText(/kana_elo data has not been calculated yet/)
    ).toBeInTheDocument();

    // Save and Finalize buttons should be DISABLED when kana_elo error is present
    expect(
      screen.getByText("Save Placements").closest("button")
    ).toBeDisabled();
    expect(
      screen.getByText("Finalize Placements").closest("button")
    ).toBeDisabled();

    // But Populate Kanaelo Queue button should remain ENABLED to fix the issue
    expect(
      screen.getByText("Populate Kanaelo Queue").closest("button")
    ).not.toBeDisabled();

    // Teams table and division summary should be hidden
    expect(screen.queryByText("Team Rankings")).not.toBeInTheDocument();
    expect(screen.queryByText("Division Summary")).not.toBeInTheDocument();
  });
});
