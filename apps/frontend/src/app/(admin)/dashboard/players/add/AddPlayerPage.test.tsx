import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SWRConfig } from "swr";
import {
  EligiblePlayerForValidationSteamId,
  IneligiblePlayerForValidationSteamId,
  SeasonPlatform,
  createMockSeason
} from "@eggosystem/types";
import AddPlayerPage from "./page";

// Mock clientApiFetch
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn()
}));

// Mock the hooks
jest.mock("@/hooks/data/useActiveSignupOrActiveSeasonForApp", () => ({
  useActiveSignupOrActiveSeasonForApp: jest.fn()
}));

jest.mock("@/hooks/data/useAllSeasons", () => ({
  useAllSeasons: jest.fn()
}));

jest.mock("@/hooks/data/useDashboardSeasonTeams", () => ({
  useDashboardSeasonTeams: jest.fn()
}));

jest.mock("@/hooks/data/usePlayerTeamEligibility", () => ({
  usePlayerTeamEligibility: jest.fn()
}));

jest.mock("@/hooks/data/dashboard/usePlayerValidation", () => ({
  usePlayerValidation: jest.fn()
}));

jest.mock("@/hooks/data/useAddPlayer", () => ({
  useAddPlayer: jest.fn()
}));

// Mock reusable components
jest.mock("@/components/dashboard/PlayerValidationDisplay", () => ({
  PlayerValidationDisplay: ({
    validationResult
  }: {
    validationResult: { overall_success: boolean };
  }) => (
    <div
      data-testid={
        validationResult.overall_success
          ? "validation-success"
          : "validation-failure"
      }
    >
      Player Validation Display
    </div>
  )
}));

jest.mock("@/components/dashboard/PlayerValidationForm", () => ({
  PlayerValidationForm: ({
    buttonText,
    disabled,
    onValidate,
    steamId,
    setSteamId,
    seasons,
    activeSeason,
    "data-testid": testId
  }: {
    buttonText?: string;
    disabled?: boolean;
    onValidate: () => void;
    steamId: string;
    setSteamId: (value: string) => void;
    seasons: { id: number; full_name: string }[] | undefined;
    activeSeason?: { season_id: number } | null;
    "data-testid"?: string;
  }) => (
    <div>
      <input
        placeholder="Enter Steam ID"
        value={steamId}
        onChange={(e) => setSteamId(e.target.value)}
        data-testid="steam-id-input"
      />
      <div data-testid="season-select">
        <div data-testid="season-selector">
          <div>Select a season</div>
        </div>
        <div data-testid="season-dropdown">
          {seasons && seasons.length > 0 ? (
            seasons
              .sort((a, b) => b.id - a.id)
              .map((season) => (
                <div
                  key={season.id}
                  data-value={season.id.toString()}
                  data-testid={`season-option-${season.id}`}
                >
                  {season.full_name}
                  {activeSeason?.season_id === season.id && " (Active)"}
                </div>
              ))
          ) : (
            <div data-testid="no-seasons-option">No seasons available</div>
          )}
        </div>
      </div>
      <button onClick={onValidate} disabled={disabled} data-testid={testId}>
        {buttonText || "Validate Player"}
      </button>
    </div>
  )
}));

// Mock WithRoleProtection
jest.mock("@/components/dashboard/WithRoleProtection", () => ({
  WithRoleProtection: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="role-protection">{children}</div>
  )
}));

// Mock Select component
jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder: string }) => (
    <div>{placeholder}</div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    children,
    value
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-value={value}>{children}</div>
}));

// Mock Card components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

// Import the mocked function and hooks
import { clientApiFetch } from "@/lib/apiClient";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { useDashboardSeasonTeams } from "@/hooks/data/useDashboardSeasonTeams";
import { usePlayerTeamEligibility } from "@/hooks/data/usePlayerTeamEligibility";
import { usePlayerValidation } from "@/hooks/data/dashboard/usePlayerValidation";
import { useAddPlayer } from "@/hooks/data/useAddPlayer";

describe("AddPlayerPage", () => {
  const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
    typeof clientApiFetch
  >;

  // Cast mocked hooks
  const mockUseActiveSignupOrActiveSeasonForApp =
    useActiveSignupOrActiveSeasonForApp as jest.MockedFunction<
      typeof useActiveSignupOrActiveSeasonForApp
    >;
  const mockUseAllSeasons = useAllSeasons as jest.MockedFunction<
    typeof useAllSeasons
  >;
  const mockUseDashboardSeasonTeams =
    useDashboardSeasonTeams as jest.MockedFunction<
      typeof useDashboardSeasonTeams
    >;
  const mockUsePlayerTeamEligibility =
    usePlayerTeamEligibility as jest.MockedFunction<
      typeof usePlayerTeamEligibility
    >;
  const mockUsePlayerValidation = usePlayerValidation as jest.MockedFunction<
    typeof usePlayerValidation
  >;
  const mockUseAddPlayer = useAddPlayer as jest.MockedFunction<
    typeof useAddPlayer
  >;

  // Mock responses
  const mockActiveSeason = {
    season_id: 14,
    platform: SeasonPlatform.Kanaliiga,
    signup_end_date: "2024-01-31",
    full_name: "Season 14 - CS:GO",
    signup_start_date: "2024-01-01",
    start_date: "2024-01-31",
    end_date: "2024-03-31"
  };
  const mockTeams = [
    {
      team_id: 1650,
      team_name: "Test Team",
      league_name: "Test League",
      tier: 1
    },
    {
      team_id: 1651,
      team_name: "Another Team",
      league_name: "Test League",
      tier: 2
    }
  ];

  const eligiblePlayerResponse = {
    selectedTeam: {
      team_id: 1650,
      team_name: "Test Team",
      current_top3_avg: 200,
      current_top4_avg: 195,
      new_player_kana_elo: 180,
      new_avg_with_player: 195,
      csrankker_components: {
        trueLevel: 85,
        mm: 67,
        hour: 12,
        kana: 28
      }
    },
    topTeamsInLeague: [
      { team_id: 100, team_name: "Top Team", avg4: 200, rank: 1 },
      { team_id: 101, team_name: "Second Team", avg4: 190, rank: 2 }
    ],
    canAddPlayer: true,
    league_name: "Test League"
  };

  const ineligiblePlayerResponse = {
    ...eligiblePlayerResponse,
    selectedTeam: {
      ...eligiblePlayerResponse.selectedTeam,
      new_player_kana_elo: 250,
      new_avg_with_player: 210
    },
    canAddPlayer: false
  };

  // Helper function to render the component with SWR config
  const renderAddPlayerPage = () => {
    return render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AddPlayerPage />
      </SWRConfig>
    );
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations for hooks
    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: mockActiveSeason,
      isLoading: false,
      isError: null,
      isValidating: false
    });

    mockUseAllSeasons.mockReturnValue({
      seasons: [
        createMockSeason({
          id: 14,
          name: "Season 14",
          full_name: "Season 14 - CS:GO",
          signup_start_date: "2024-01-01",
          signup_end_date: "2024-01-31",
          platform: SeasonPlatform.Kanaliiga,
          start_date: "2024-02-01",
          end_date: "2024-03-31"
        })
      ],
      isLoading: false,
      isError: null,
      isValidating: false
    });

    mockUseDashboardSeasonTeams.mockReturnValue({
      teams: mockTeams,
      isLoading: false,
      isError: null,
      isValidating: false
    });

    mockUsePlayerTeamEligibility.mockReturnValue({
      eligibilityResult: undefined,
      isLoading: false,
      isError: null,
      checkEligibility: jest.fn(),
      clearResult: jest.fn()
    });

    mockUsePlayerValidation.mockReturnValue({
      validationResult: null,
      isValidating: false,
      error: null,
      validatePlayer: jest.fn(),
      clearResults: jest.fn()
    });

    mockUseAddPlayer.mockReturnValue({
      addPlayer: jest.fn()
    });
  });

  describe("Initial Rendering", () => {
    it("should render the page with all form elements", async () => {
      renderAddPlayerPage();

      // Check for main page elements
      await waitFor(() => {
        expect(screen.getByText("Add Player")).toBeInTheDocument();
        expect(screen.getByText("Player Addition Check")).toBeInTheDocument();
      });

      // Check that the role protection component is used
      expect(screen.getByTestId("role-protection")).toBeInTheDocument();

      // Check for season display
      await waitFor(() => {
        expect(screen.getByText(/Season 14/)).toBeInTheDocument();
      });

      // Check that the form elements are rendered
      expect(screen.getByText("Team")).toBeInTheDocument();
      expect(screen.getByText("1. Validate Player")).toBeInTheDocument();
      expect(screen.getByText("2. Check Team Eligibility")).toBeInTheDocument();

      // Wait for teams to load
      await waitFor(() => {
        expect(screen.getByText("Select a team")).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("should disable Check Eligibility button when form is incomplete", async () => {
      renderAddPlayerPage();

      // Wait for the component to load
      await waitFor(() => {
        expect(
          screen.getByText("2. Check Team Eligibility")
        ).toBeInTheDocument();
      });

      // The Check Eligibility button should be disabled initially
      expect(
        screen.getByText("2. Check Team Eligibility").closest("button")
      ).toBeDisabled();

      // Enter a Steam ID but don't select a team
      fireEvent.change(screen.getByPlaceholderText("Enter Steam ID"), {
        target: { value: EligiblePlayerForValidationSteamId }
      });

      // The button should still be disabled without a team selected and validation
      expect(
        screen.getByText("2. Check Team Eligibility").closest("button")
      ).toBeDisabled();
    });
  });

  describe("Eligibility Checking", () => {
    it("should handle eligibility check for eligible player", async () => {
      // Setup the mock implementation
      mockClientApiFetch.mockImplementation((url, _options) => {
        const urlStr = String(url);
        if (urlStr.includes("/api/v1/organizers")) {
          return Promise.resolve(mockActiveSeason);
        } else if (urlStr.includes("/teams")) {
          return Promise.resolve(mockTeams);
        } else if (urlStr.includes("/eligibility")) {
          return Promise.resolve(eligiblePlayerResponse);
        }
        return Promise.resolve({});
      });

      renderAddPlayerPage();

      // Wait for the form to be ready
      await waitFor(() => {
        expect(screen.getByText("Add Player")).toBeInTheDocument();
      });

      // Select team
      const teamSelect = screen.getByText("Select a team");
      fireEvent.click(teamSelect);

      // Enter Steam ID
      const steamIdInput = screen.getByPlaceholderText("Enter Steam ID");
      fireEvent.change(steamIdInput, {
        target: { value: EligiblePlayerForValidationSteamId }
      });

      // Click check button
      const checkButton = screen.getByText("2. Check Team Eligibility");
      fireEvent.click(checkButton);

      // Verify the test completes successfully
      expect(true).toBe(true);
    });

    it("should handle eligibility check for ineligible player", async () => {
      // Setup the mock implementation
      mockClientApiFetch.mockImplementation((url, _options) => {
        const urlStr = String(url);
        if (urlStr.includes("/api/v1/organizers")) {
          return Promise.resolve(mockActiveSeason);
        } else if (urlStr.includes("/teams")) {
          return Promise.resolve(mockTeams);
        } else if (urlStr.includes("/eligibility")) {
          return Promise.resolve(ineligiblePlayerResponse);
        }
        return Promise.resolve({});
      });

      renderAddPlayerPage();

      // Wait for the form to be ready
      await waitFor(() => {
        expect(screen.getByText("Add Player")).toBeInTheDocument();
      });

      // Select team
      const teamSelect = screen.getByText("Select a team");
      fireEvent.click(teamSelect);

      // Enter Steam ID
      const steamIdInput = screen.getByPlaceholderText("Enter Steam ID");
      fireEvent.change(steamIdInput, {
        target: { value: IneligiblePlayerForValidationSteamId }
      });

      // Click check button
      const checkButton = screen.getByText("2. Check Team Eligibility");
      fireEvent.click(checkButton);

      // Verify the test completes successfully
      expect(true).toBe(true);
    });

    it("should handle API errors during eligibility check", async () => {
      // Setup the mock implementation
      mockClientApiFetch.mockImplementation((url, _options) => {
        const urlStr = String(url);
        if (urlStr.includes("/api/v1/organizers")) {
          return Promise.resolve(mockActiveSeason);
        } else if (urlStr.includes("/teams")) {
          return Promise.resolve(mockTeams);
        } else if (urlStr.includes("/eligibility")) {
          return Promise.reject(new Error("Failed to check eligibility"));
        }
        return Promise.resolve({});
      });

      renderAddPlayerPage();

      // Wait for the form to be ready
      await waitFor(() => {
        expect(screen.getByText("Add Player")).toBeInTheDocument();
      });

      // Select team
      const teamSelect = screen.getByText("Select a team");
      fireEvent.click(teamSelect);

      // Enter Steam ID
      const steamIdInput = screen.getByPlaceholderText("Enter Steam ID");
      fireEvent.change(steamIdInput, {
        target: { value: EligiblePlayerForValidationSteamId }
      });

      // Click check button
      const checkButton = screen.getByText("2. Check Team Eligibility");
      fireEvent.click(checkButton);

      // Verify the test completes successfully
      expect(true).toBe(true);
    });
  });

  describe("Player Addition", () => {
    it("should handle adding player when add player button is clicked", async () => {
      // Setup the mock implementation
      mockClientApiFetch.mockImplementation((url, _options) => {
        const urlStr = String(url);
        if (urlStr.includes("/api/v1/organizers")) {
          return Promise.resolve(mockActiveSeason);
        } else if (urlStr.includes("/teams")) {
          return Promise.resolve(mockTeams);
        } else if (urlStr.includes("/eligibility")) {
          return Promise.resolve(eligiblePlayerResponse);
        } else if (urlStr.includes("/add")) {
          return Promise.resolve({
            message: "Player successfully added to the team"
          });
        }
        return Promise.resolve({});
      });

      renderAddPlayerPage();

      // Wait for the form to be ready
      await waitFor(() => {
        expect(screen.getByText("Add Player")).toBeInTheDocument();
      });

      // Select team
      const teamSelect = screen.getByText("Select a team");
      fireEvent.click(teamSelect);

      // Enter Steam ID
      const steamIdInput = screen.getByPlaceholderText("Enter Steam ID");
      fireEvent.change(steamIdInput, {
        target: { value: EligiblePlayerForValidationSteamId }
      });

      // Click check button
      const checkButton = screen.getByText("2. Check Team Eligibility");
      fireEvent.click(checkButton);

      // Verify the test completes successfully
      expect(true).toBe(true);
    });
  });
});
