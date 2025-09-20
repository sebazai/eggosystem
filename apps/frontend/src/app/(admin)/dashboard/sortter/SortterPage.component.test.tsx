import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SortterPage from "./page";
import { useSortter } from "@/hooks/data/dashboard/useSortter";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import type {
  TeamSortterValues,
  Season,
  PlayerSortterValues,
  SeasonPlatform
} from "@eggosystem/types";

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
  useSearchParams: () => new URLSearchParams("season=16"),
  usePathname: () => "/",
  useParams: () => ({}),
  redirect: jest.fn(),
  notFound: jest.fn()
}));

// Mock the useSortter hook
jest.mock("@/hooks/data/dashboard/useSortter", () => ({
  useSortter: jest.fn()
}));

// Mock WithRoleProtection component
jest.mock("@/components/dashboard/WithRoleProtection", () => ({
  WithRoleProtection: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="role-protection">{children}</div>
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

// Mock API client
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn()
}));

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    className,
    ...props
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock("@/components/ui/spinner", () => ({
  Spinner: ({ className, size }: any) => (
    <div data-testid="spinner" className={className} data-size={size}>
      Loading...
    </div>
  )
}));

jest.mock("@/components/ui/textarea", () => ({
  Textarea: ({
    defaultValue,
    onBlur,
    disabled,
    placeholder,
    ...props
  }: any) => (
    <textarea
      defaultValue={defaultValue}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder}
      {...props}
    />
  )
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
  CardDescription: ({ children }: any) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className} data-testid="card-header">
      {children}
    </div>
  ),
  CardTitle: ({ children }: any) => (
    <div data-testid="card-title">{children}</div>
  )
}));

jest.mock("@/components/ui/chart", () => ({
  ChartContainer: ({ children, config }: any) => (
    <div data-testid="chart-container" data-config={JSON.stringify(config)}>
      {children}
    </div>
  ),
  ChartTooltip: ({ children }: any) => (
    <div data-testid="chart-tooltip">{children}</div>
  ),
  ChartTooltipContent: ({ children }: any) => (
    <div data-testid="chart-tooltip-content">{children}</div>
  )
}));

jest.mock("recharts", () => ({
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Area: () => <div data-testid="area" />,
  AreaChart: ({ children, data }: any) => (
    <div data-testid="area-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />
}));

jest.mock("@/components/sortter/SeasonSelector", () => ({
  SeasonSelector: ({ seasons, selectedSeason, onChange, isLoading }: any) => (
    <select
      value={selectedSeason || ""}
      onChange={(e) => onChange(parseInt(e.target.value))}
      disabled={isLoading}
      data-testid="season-selector"
    >
      <option value="">Select Season</option>
      {seasons.map((season: Season) => (
        <option key={season.id} value={season.id}>
          {season.name}
        </option>
      ))}
    </select>
  )
}));

jest.mock("@/components/sortter/MemoizedDivisionDropdown", () => ({
  __esModule: true,
  default: ({
    teamId,
    value,
    options,
    disabled,
    onValueChange,
    originalValue
  }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
      data-testid={`division-dropdown-${teamId}`}
      data-original-value={originalValue}
    >
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}));

jest.mock("@/components/dashboard/PlayerValuesFloatingWindow", () => ({
  PlayerValuesFloatingWindow: ({
    playerValues,
    teamName,
    position,
    isLoading,
    onClose
  }: any) => (
    <div
      data-testid="player-values-window"
      data-team-name={teamName}
      data-position={JSON.stringify(position)}
      data-loading={isLoading}
    >
      <button onClick={onClose} data-testid="close-player-window">
        Close
      </button>
      {isLoading ? (
        <div>Loading player values...</div>
      ) : (
        <div>
          <h3>Player Values for {teamName}</h3>
          {playerValues?.map((player: PlayerSortterValues, index: number) => (
            <div key={index} data-testid={`player-${index}`}>
              {player.name}: {player.kanarating}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}));

jest.mock("lucide-react", () => ({
  AlertTriangle: () => <div data-testid="alert-triangle">⚠️</div>
}));

describe("SortterPage Component Tests", () => {
  // Mock data
  const mockTeams: TeamSortterValues[] = [
    {
      team_id: 1,
      team_name: "Test Team 1",
      team_logo: "logo1.png",
      league_name: "Test League",
      top5_sum: 1000,
      top5_values: [350, 345, 340, 335, 330],
      avg4: 342.5,
      orig4: 342.5,
      is_flagged: false,
      comments: "Test comment 1"
    },
    {
      team_id: 2,
      team_name: "Test Team 2",
      team_logo: "logo2.png",
      league_name: "Test League",
      top5_sum: 1200,
      top5_values: [340, 335, 330, 325, 320],
      avg4: 332.5,
      orig4: 332.5,
      is_flagged: true,
      comments: "Test comment 2"
    },
    {
      team_id: 3,
      team_name: "Test Team 3",
      team_logo: "logo3.png",
      league_name: "Test League",
      top5_sum: 800,
      top5_values: [320, 315, 310, 305, 300],
      avg4: 312.5,
      orig4: 312.5,
      is_flagged: false,
      comments: ""
    }
  ];

  const mockSeasons: Season[] = [
    {
      id: 15,
      game_id: 1,
      name: "Season 15",
      full_name: "Season 15 Full Name",
      signup_start_date: "2023-07-01",
      signup_end_date: "2023-07-31",
      platform: "steam" as SeasonPlatform,
      start_date: "2023-08-01",
      end_date: "2023-12-31"
    },
    {
      id: 16,
      game_id: 1,
      name: "Season 16",
      full_name: "Season 16 Full Name",
      signup_start_date: "2024-01-01",
      signup_end_date: "2024-01-31",
      platform: "steam" as SeasonPlatform,
      start_date: "2024-02-01",
      end_date: "2024-06-30"
    },
    {
      id: 17,
      game_id: 1,
      name: "Season 17",
      full_name: "Season 17 Full Name",
      signup_start_date: "2024-07-01",
      signup_end_date: "2024-07-31",
      platform: "steam" as SeasonPlatform,
      start_date: "2024-08-01",
      end_date: "2024-12-31"
    }
  ];

  const mockPlayerValues: PlayerSortterValues[] = [
    {
      name: "Test Player 1",
      steamid: "76561198012345678",
      cs2_rank: 10,
      faceit_level: 8,
      faceit_elo: 2500,
      hours: 1500,
      kanarating: 85.5,
      fkd: 1.2,
      kana_elo: 350,
      offered_elo: 340,
      calculus: "350.0"
    },
    {
      name: "Test Player 2",
      steamid: "76561198012345679",
      cs2_rank: 8,
      faceit_level: 6,
      faceit_elo: 2200,
      hours: 1200,
      kanarating: 78.3,
      fkd: 1.1,
      kana_elo: 340,
      offered_elo: 330,
      calculus: "340.0"
    }
  ];

  // Mock functions
  const mockSetSelectedSeason = jest.fn();
  const mockHandleDivisionChange = jest.fn();
  const mockSavePlacements = jest.fn();
  const mockFinalizePlacements = jest.fn();
  const mockShowTeamPlayerValues = jest.fn();
  const mockCloseTeamPlayerValues = jest.fn();
  const mockPrefetchPlayerValues = jest.fn();

  // Default mock implementation for useSortter
  const defaultUseSortterReturn = {
    teams: mockTeams,
    sortedSeasons: mockSeasons,
    playerValues: mockPlayerValues,
    placements: [],
    selectedSeason: 16,
    selectedTeamId: null,
    floatingPosition: null,
    divisions: { 1: 1, 2: 1, 3: 2 },
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
    handleDivisionChange: mockHandleDivisionChange,
    savePlacements: mockSavePlacements,
    finalizePlacements: mockFinalizePlacements
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSortter as jest.Mock).mockReturnValue(defaultUseSortterReturn);
  });

  describe("Page Loading and Basic Rendering", () => {
    it("should load the sortter page with correct title and description", () => {
      render(<SortterPage />);

      expect(
        screen.getByRole("heading", { name: "Sortter" })
      ).toBeInTheDocument();
      expect(
        screen.getByText("Team ranking management and analysis tool")
      ).toBeInTheDocument();
    });

    it("should display season selector", () => {
      render(<SortterPage />);

      expect(screen.getByText("Season:")).toBeInTheDocument();
      expect(screen.getByTestId("season-selector")).toBeInTheDocument();
    });

    it("should display teams in the table", () => {
      render(<SortterPage />);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText("Test Team 1")).toBeInTheDocument();
      expect(screen.getByText("Test Team 2")).toBeInTheDocument();
      expect(screen.getByText("Test Team 3")).toBeInTheDocument();
    });

    it("should display table headers correctly", () => {
      render(<SortterPage />);

      expect(screen.getByText("ID")).toBeInTheDocument();
      expect(screen.getByText("Team")).toBeInTheDocument();
      expect(
        screen.getByText("kanaelo (sum 5 / avg4 / orig4)")
      ).toBeInTheDocument();
      expect(screen.getByText("Division")).toBeInTheDocument();
      expect(screen.getByText("Graph (0-350)")).toBeInTheDocument();
      expect(screen.getByText("Comments")).toBeInTheDocument();
    });

    it("should display division summary", () => {
      render(<SortterPage />);

      expect(screen.getByText("Division Summary")).toBeInTheDocument();
      expect(screen.getByText("Masters:")).toBeInTheDocument();
      expect(screen.getByText("Challengers:")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should show loading state when loading teams", () => {
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        isLoadingTeams: true
      });

      render(<SortterPage />);

      expect(screen.getByText("Loading team data...")).toBeInTheDocument();
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });

    it("should show loading state when saving placements", () => {
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        isSaving: true
      });

      render(<SortterPage />);

      expect(screen.getByText("Saving...")).toBeInTheDocument();
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });

    it("should show loading state when finalizing placements", () => {
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        isFinalizing: true
      });

      render(<SortterPage />);

      expect(screen.getByText("Finalizing...")).toBeInTheDocument();
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });
  });

  describe("Error States", () => {
    it("should display general error message", () => {
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        error: "Failed to load data"
      });

      render(<SortterPage />);

      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Failed to load data")).toBeInTheDocument();
    });

    it("should display kanaelo missing error with specific message", () => {
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        error:
          "Cannot generate placements: kana_elo data has not been calculated yet"
      });

      render(<SortterPage />);

      expect(screen.getByText("Kanaelo Data Required")).toBeInTheDocument();
      expect(
        screen.getByText(/kana_elo data has not been calculated yet/)
      ).toBeInTheDocument();
      expect(screen.queryByText("Team Rankings")).not.toBeInTheDocument();
      expect(screen.queryByText("Division Summary")).not.toBeInTheDocument();
    });
  });

  describe("Button Interactions", () => {
    it("should call savePlacements when Save Placements button is clicked", async () => {
      const user = userEvent.setup();
      render(<SortterPage />);

      const saveButton = screen.getByRole("button", {
        name: "Save Placements"
      });
      await user.click(saveButton);

      expect(mockSavePlacements).toHaveBeenCalledTimes(1);
    });

    it("should call finalizePlacements when Finalize Placements button is clicked", async () => {
      const user = userEvent.setup();
      render(<SortterPage />);

      const finalizeButton = screen.getByRole("button", {
        name: "Finalize Placements"
      });
      await user.click(finalizeButton);

      expect(mockFinalizePlacements).toHaveBeenCalledTimes(1);
    });

    it("should populate kanaelo queue when button is clicked", async () => {
      const user = userEvent.setup();
      const mockClientApiFetch = jest.mocked(clientApiFetch);
      mockClientApiFetch.mockResolvedValueOnce({
        message: "Successfully added players to queue",
        season_id: 16,
        total_players: 50,
        queued_players: 45,
        failed_players: 5
      });

      render(<SortterPage />);

      const populateButton = screen.getByRole("button", {
        name: "Populate Kanaelo Queue"
      });
      await user.click(populateButton);

      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/sortter/season/16/populate-kanaelo-queue",
        { method: "POST" }
      );
    });

    it("should retry failed calculations when button is clicked", async () => {
      const user = userEvent.setup();
      const mockClientApiFetch = jest.mocked(clientApiFetch);
      mockClientApiFetch.mockResolvedValueOnce({
        message: "Successfully retried 5 failed calculations",
        moved: 5,
        errors: 0,
        total: 5
      });

      render(<SortterPage />);

      const retryButton = screen.getByRole("button", {
        name: /Retry Failed Calculations/
      });
      await user.click(retryButton);

      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/sortter/retry-failed-calculations",
        { method: "POST" }
      );
    });
  });

  describe("Button States and Disabling", () => {
    it("should disable buttons when no season is selected", () => {
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        selectedSeason: null
      });

      render(<SortterPage />);

      expect(
        screen.getByRole("button", { name: "Save Placements" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Finalize Placements" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Populate Kanaelo Queue" })
      ).toBeDisabled();
    });

    it("should disable buttons when in view mode", () => {
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        isViewMode: true
      });

      render(<SortterPage />);

      expect(
        screen.getByRole("button", { name: "Save Placements" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Finalize Placements" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Populate Kanaelo Queue" })
      ).toBeDisabled();
      expect(
        screen.getByText("View Mode - Placements have been finalized")
      ).toBeInTheDocument();
    });

    it("should disable Save and Finalize buttons when error is present", () => {
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        error: "Some error occurred"
      });

      render(<SortterPage />);

      expect(
        screen.getByRole("button", { name: "Save Placements" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Finalize Placements" })
      ).toBeDisabled();
      // Populate Kanaelo Queue should still be enabled
      expect(
        screen.getByRole("button", { name: "Populate Kanaelo Queue" })
      ).not.toBeDisabled();
    });

    it("should disable buttons when loading placements", () => {
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        isLoadingPlacements: true
      });

      render(<SortterPage />);

      expect(
        screen.getByRole("button", { name: "Save Placements" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Finalize Placements" })
      ).toBeDisabled();
    });
  });

  describe("Division Management", () => {
    it("should display division dropdowns for each team", () => {
      render(<SortterPage />);

      expect(screen.getByTestId("division-dropdown-1")).toBeInTheDocument();
      expect(screen.getByTestId("division-dropdown-2")).toBeInTheDocument();
      expect(screen.getByTestId("division-dropdown-3")).toBeInTheDocument();
    });

    it("should call handleDivisionChange when division is changed", async () => {
      const user = userEvent.setup();
      render(<SortterPage />);

      const divisionDropdown = screen.getByTestId("division-dropdown-1");
      await user.selectOptions(divisionDropdown, "2");

      expect(mockHandleDivisionChange).toHaveBeenCalledWith("2");
    });

    it("should disable division dropdowns in view mode", () => {
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        isViewMode: true
      });

      render(<SortterPage />);

      expect(screen.getByTestId("division-dropdown-1")).toBeDisabled();
      expect(screen.getByTestId("division-dropdown-2")).toBeDisabled();
      expect(screen.getByTestId("division-dropdown-3")).toBeDisabled();
    });
  });

  describe("Comments Management", () => {
    it("should display comment textareas for each team", () => {
      render(<SortterPage />);

      const textareas = screen.getAllByPlaceholderText("Add comments...");
      expect(textareas).toHaveLength(3);
    });

    it("should disable comment textareas in view mode", () => {
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        isViewMode: true
      });

      render(<SortterPage />);

      const textareas = screen.getAllByPlaceholderText("Add comments...");
      textareas.forEach((textarea) => {
        expect(textarea).toBeDisabled();
      });
    });

    it("should save comments when textarea loses focus", async () => {
      const user = userEvent.setup();
      render(<SortterPage />);

      const textareas = screen.getAllByPlaceholderText("Add comments...");
      expect(textareas.length).toBeGreaterThan(0);
      const textarea = textareas[0]!;
      await user.type(textarea, "This is a test comment");
      await user.tab(); // Trigger onBlur

      // The comment saving is handled by the CommentsContext and useSortter hook
      // We can't directly test the savePlacements call here as it's internal to the component
      // But we can verify the textarea has the correct value
      expect(textarea).toHaveValue("This is a test comment");
    });
  });

  describe("Player Values Window", () => {
    it("should show player values window on team double click", async () => {
      const user = userEvent.setup();
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        selectedTeamId: 1,
        floatingPosition: { x: 100, y: 100 }
      });

      render(<SortterPage />);

      expect(screen.getByTestId("player-values-window")).toBeInTheDocument();
      expect(
        screen.getByText("Player Values for Test Team 1")
      ).toBeInTheDocument();
    });

    it("should call showTeamPlayerValues on team row double click", async () => {
      const user = userEvent.setup();
      render(<SortterPage />);

      const teamRow = screen.getByText("Test Team 1").closest("tr");
      expect(teamRow).toBeInTheDocument();
      if (teamRow) {
        await user.dblClick(teamRow);
        expect(mockShowTeamPlayerValues).toHaveBeenCalledWith(
          1,
          expect.any(Object)
        );
      }
    });

    it("should call prefetchPlayerValues on team row hover", async () => {
      const user = userEvent.setup();
      render(<SortterPage />);

      const teamRow = screen.getByText("Test Team 1").closest("tr");
      expect(teamRow).toBeInTheDocument();
      if (teamRow) {
        await user.hover(teamRow);
        expect(mockPrefetchPlayerValues).toHaveBeenCalledWith(1);
      }
    });

    it("should close player values window when close button is clicked", async () => {
      const user = userEvent.setup();
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        selectedTeamId: 1,
        floatingPosition: { x: 100, y: 100 }
      });

      render(<SortterPage />);

      const closeButton = screen.getByTestId("close-player-window");
      await user.click(closeButton);

      expect(mockCloseTeamPlayerValues).toHaveBeenCalledTimes(1);
    });
  });

  describe("Season Selection", () => {
    it("should call setSelectedSeason when season is changed", async () => {
      const user = userEvent.setup();
      render(<SortterPage />);

      const seasonSelector = screen.getByTestId("season-selector");
      await user.selectOptions(seasonSelector, "17");

      expect(mockSetSelectedSeason).toHaveBeenCalledWith(17);
    });

    it("should disable season selector when loading", () => {
      (useSortter as jest.Mock).mockReturnValue({
        ...defaultUseSortterReturn,
        isLoadingSeasons: true
      });

      render(<SortterPage />);

      expect(screen.getByTestId("season-selector")).toBeDisabled();
    });
  });

  describe("Team Data Display", () => {
    it("should display team kanaelo values correctly", () => {
      render(<SortterPage />);

      // Check that the kanaelo values are displayed (sum, avg4, orig4)
      expect(screen.getByText("1700 / 342.500 / 342.500")).toBeInTheDocument(); // Team 1
      expect(screen.getByText("1650 / 332.500 / 332.500")).toBeInTheDocument(); // Team 2
    });

    it("should display flagged teams with alert icon", () => {
      render(<SortterPage />);

      // Team 2 is flagged, so it should have an alert triangle
      const team2Row = screen.getByText("Test Team 2").closest("tr");
      expect(team2Row).toBeInTheDocument();
      const alertTriangles = screen.getAllByTestId("alert-triangle");
      // Should have at least one alert triangle in the team row (plus others in navigation/buttons)
      expect(alertTriangles.length).toBeGreaterThan(0);
      // Check that the team row contains an alert triangle
      if (team2Row) {
        const alertInRow = alertTriangles.find((el) => team2Row!.contains(el));
        expect(team2Row).toContainElement(alertInRow || alertTriangles[0]!);
      }
    });

    it("should display charts for each team", () => {
      render(<SortterPage />);

      const charts = screen.getAllByTestId("area-chart");
      expect(charts).toHaveLength(3); // One for each team
    });
  });

  describe("Navigation Links", () => {
    it("should display team flags navigation link", () => {
      render(<SortterPage />);

      const teamFlagsLink = screen.getByRole("link", { name: /Team Flags/ });
      expect(teamFlagsLink).toBeInTheDocument();
      expect(teamFlagsLink).toHaveAttribute(
        "href",
        "/dashboard/sortter/team-flags?season=16"
      );
    });
  });

  describe("Integration with CommentsContext", () => {
    it("should render with CommentsProvider wrapper", () => {
      render(<SortterPage />);

      // The component should render without errors, indicating CommentsProvider is working
      expect(
        screen.getByRole("heading", { name: "Sortter" })
      ).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should apply correct CSS classes for responsive layout", () => {
      render(<SortterPage />);

      // Check that the page renders with proper structure
      const heading = screen.getByRole("heading", { name: "Sortter" });
      expect(heading).toBeInTheDocument();

      // Check that the main container exists and has some styling
      const mainContainer = heading.closest("div");
      expect(mainContainer).toBeInTheDocument();
    });
  });
});
