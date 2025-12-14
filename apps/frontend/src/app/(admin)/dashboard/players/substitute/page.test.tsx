import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AddSubstitutePlayerPage from "./page";
import { SeasonPlatform, createMockSeason } from "@eggosystem/types";

// Mock the hooks
jest.mock("@/hooks/data/useAllSeasons", () => ({
  useAllSeasons: jest.fn()
}));

jest.mock("@/hooks/data/useActiveSignupOrActiveSeasonForApp", () => ({
  useActiveSignupOrActiveSeasonForApp: jest.fn()
}));

jest.mock("@/hooks/data/useDashboardSeasonTeams", () => ({
  useDashboardSeasonTeams: jest.fn()
}));

jest.mock("@/hooks/data/dashboard/usePlayerValidation", () => ({
  usePlayerValidation: jest.fn()
}));

jest.mock("@/hooks/data/useAddSubstitutePlayer", () => ({
  useAddSubstitutePlayer: jest.fn()
}));

// Mock the components
jest.mock("@/components/dashboard/WithRoleProtection", () => ({
  WithRoleProtection: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

jest.mock("@/components/dashboard/PlayerValidationDisplay", () => ({
  PlayerValidationDisplay: ({
    validationResult
  }: {
    validationResult: { overall_success: boolean } | null;
  }) => (
    <div data-testid="player-validation-display">
      Validation Result:{" "}
      {validationResult?.overall_success ? "Success" : "Failed"}
    </div>
  )
}));

jest.mock("@/components/dashboard/PlayerValidationForm", () => ({
  PlayerValidationForm: ({
    steamId,
    setSteamId,
    seasonId,
    setSeasonId,
    onValidate,
    buttonText
  }: {
    steamId: string;
    setSteamId: (value: string) => void;
    seasonId: string;
    setSeasonId: (value: string) => void;
    onValidate: () => void;
    buttonText: string;
  }) => (
    <div data-testid="player-validation-form">
      <input
        data-testid="steam-id-input"
        value={steamId}
        onChange={(e) => setSteamId(e.target.value)}
      />
      <select
        data-testid="season-select"
        value={seasonId}
        onChange={(e) => setSeasonId(e.target.value)}
      >
        <option value="">Select Season</option>
        <option value="1">Season 1</option>
      </select>
      <button onClick={onValidate} data-testid="validate-button">
        {buttonText}
      </button>
    </div>
  )
}));

// Import hooks after mocking
import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import { useDashboardSeasonTeams } from "@/hooks/data/useDashboardSeasonTeams";
import { usePlayerValidation } from "@/hooks/data/dashboard/usePlayerValidation";
import { useAddSubstitutePlayer } from "@/hooks/data/useAddSubstitutePlayer";

const mockUseAllSeasons = useAllSeasons as jest.MockedFunction<
  typeof useAllSeasons
>;
const mockUseActiveSignupOrActiveSeasonForApp =
  useActiveSignupOrActiveSeasonForApp as jest.MockedFunction<
    typeof useActiveSignupOrActiveSeasonForApp
  >;
const mockUseDashboardSeasonTeams =
  useDashboardSeasonTeams as jest.MockedFunction<
    typeof useDashboardSeasonTeams
  >;
const mockUsePlayerValidation = usePlayerValidation as jest.MockedFunction<
  typeof usePlayerValidation
>;
const mockUseAddSubstitutePlayer =
  useAddSubstitutePlayer as jest.MockedFunction<typeof useAddSubstitutePlayer>;

describe("AddSubstitutePlayerPage", () => {
  const mockAddSubstitutePlayer = jest.fn();
  const mockValidatePlayer = jest.fn();
  const mockClearResults = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseAllSeasons.mockReturnValue({
      seasons: [
        createMockSeason(
          1,
          "Season 1",
          "Season 1",
          "2024-01-01",
          "2024-01-31",
          SeasonPlatform.FACEIT,
          "2024-02-01",
          "2024-03-31"
        ),
        createMockSeason(
          2,
          "Season 2",
          "Season 2",
          "2024-04-01",
          "2024-04-30",
          SeasonPlatform.FACEIT,
          "2024-05-01",
          "2024-06-30"
        )
      ],
      isLoading: false,
      isError: null,
      isValidating: false
    });

    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: {
        season_id: 1,
        platform: SeasonPlatform.FACEIT,
        signup_end_date: "2024-01-31",
        full_name: "Season 1",
        signup_start_date: "2024-01-01",
        start_date: "2024-01-31",
        end_date: "2024-03-31"
      },
      isLoading: false,
      isError: null,
      isValidating: false
    });

    mockUseDashboardSeasonTeams.mockReturnValue({
      teams: [
        {
          team_id: 1,
          team_name: "Team Alpha",
          league_name: "League 1",
          tier: 1
        },
        { team_id: 2, team_name: "Team Beta", league_name: "League 2", tier: 2 }
      ],
      isLoading: false,
      isError: null,
      isValidating: false
    });

    mockUsePlayerValidation.mockReturnValue({
      validationResult: null,
      isValidating: false,
      error: null,
      validatePlayer: mockValidatePlayer,
      clearResults: mockClearResults
    });

    mockUseAddSubstitutePlayer.mockReturnValue({
      addSubstitutePlayer: mockAddSubstitutePlayer
    });
  });

  it("should render the page title and description", () => {
    render(<AddSubstitutePlayerPage />);

    expect(screen.getByText("Add Substitute Player")).toBeInTheDocument();
    expect(
      screen.getByText(/Add a substitute player to a team/)
    ).toBeInTheDocument();
  });

  it("should render the player validation form", () => {
    render(<AddSubstitutePlayerPage />);

    expect(screen.getByTestId("player-validation-form")).toBeInTheDocument();
    expect(screen.getByTestId("validate-button")).toBeInTheDocument();
  });

  it("should render team selector and match ID input", () => {
    render(<AddSubstitutePlayerPage />);

    expect(screen.getByTestId("team-selector")).toBeInTheDocument();
    expect(screen.getByTestId("match-id-input")).toBeInTheDocument();
  });

  it("should show teams in the dropdown when loaded", async () => {
    render(<AddSubstitutePlayerPage />);

    const teamSelect = screen.getByTestId("team-selector");
    fireEvent.click(teamSelect);

    await waitFor(() => {
      expect(screen.getByTestId("team-option-1")).toBeInTheDocument();
      expect(screen.getByTestId("team-option-2")).toBeInTheDocument();
    });
  });

  it("should disable add button when validation not complete", () => {
    render(<AddSubstitutePlayerPage />);

    const addButton = screen.getByTestId("add-substitute-player-button");
    expect(addButton).toBeDisabled();
  });

  it("should enable add button when all requirements are met", async () => {
    // Mock successful validation
    mockUsePlayerValidation.mockReturnValue({
      validationResult: {
        steam_id: "76561198000000001",
        season_id: 1,
        app_id: 730,
        platform: SeasonPlatform.FACEIT,
        hours: { value: 1000, success: true, error: null },
        rank: { value: 10, success: true, error: null },
        platform_rank: { value: 5, success: true, error: null },
        profile: { success: true, data: null, error: null },
        overall_success: true
      },
      isValidating: false,
      error: null,
      validatePlayer: mockValidatePlayer,
      clearResults: mockClearResults
    });

    render(<AddSubstitutePlayerPage />);

    // Fill in required fields
    const steamIdInput = screen.getByTestId("steam-id-input");
    const seasonSelect = screen.getByTestId("season-select");
    const teamSelect = screen.getByTestId("team-selector");
    const matchIdInput = screen.getByTestId("match-id-input");
    const ticketNumberInput = screen.getByTestId("ticket-number-input");

    fireEvent.change(steamIdInput, { target: { value: "76561198000000001" } });
    fireEvent.change(seasonSelect, { target: { value: "1" } });
    fireEvent.change(matchIdInput, { target: { value: "123" } });
    fireEvent.change(ticketNumberInput, { target: { value: "TICKET-123" } });
    fireEvent.click(teamSelect);

    await waitFor(() => {
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);
    });

    await waitFor(() => {
      const addButton = screen.getByTestId("add-substitute-player-button");
      expect(addButton).not.toBeDisabled();
    });
  });

  it("should keep add button disabled when match ID is missing", async () => {
    // Mock successful validation
    mockUsePlayerValidation.mockReturnValue({
      validationResult: {
        steam_id: "76561198000000001",
        season_id: 1,
        app_id: 730,
        platform: SeasonPlatform.FACEIT,
        hours: { value: 1000, success: true, error: null },
        rank: { value: 10, success: true, error: null },
        platform_rank: { value: 5, success: true, error: null },
        profile: { success: true, data: null, error: null },
        overall_success: true
      },
      isValidating: false,
      error: null,
      validatePlayer: mockValidatePlayer,
      clearResults: mockClearResults
    });

    render(<AddSubstitutePlayerPage />);

    // Fill in required fields (but not match ID)
    const steamIdInput = screen.getByTestId("steam-id-input");
    const seasonSelect = screen.getByTestId("season-select");

    fireEvent.change(steamIdInput, { target: { value: "76561198000000001" } });
    fireEvent.change(seasonSelect, { target: { value: "1" } });

    // Select team
    const teamSelect = screen.getByTestId("team-selector");
    fireEvent.click(teamSelect);

    await waitFor(() => {
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);
    });

    // Verify button is still disabled because match ID is missing
    await waitFor(() => {
      const addButton = screen.getByTestId("add-substitute-player-button");
      expect(addButton).toBeDisabled();
    });

    // Verify addSubstitutePlayer was not called
    expect(mockAddSubstitutePlayer).not.toHaveBeenCalled();
  });

  it("should call addSubstitutePlayer with match ID when provided", async () => {
    // Mock successful validation
    mockUsePlayerValidation.mockReturnValue({
      validationResult: {
        steam_id: "76561198000000001",
        season_id: 1,
        app_id: 730,
        platform: SeasonPlatform.FACEIT,
        hours: { value: 1000, success: true, error: null },
        rank: { value: 10, success: true, error: null },
        platform_rank: { value: 5, success: true, error: null },
        profile: { success: true, data: null, error: null },
        overall_success: true
      },
      isValidating: false,
      error: null,
      validatePlayer: mockValidatePlayer,
      clearResults: mockClearResults
    });

    mockAddSubstitutePlayer.mockResolvedValue({
      message: "Substitute player successfully added to the team",
      steam_id: "76561198000000001",
      team_id: 1,
      season_id: 1,
      role: "substitute",
      match_id: 123
    });

    render(<AddSubstitutePlayerPage />);

    // Fill in required fields
    const steamIdInput = screen.getByTestId("steam-id-input");
    const seasonSelect = screen.getByTestId("season-select");
    const matchIdInput = screen.getByTestId("match-id-input");
    const ticketNumberInput = screen.getByTestId("ticket-number-input");

    fireEvent.change(steamIdInput, { target: { value: "76561198000000001" } });
    fireEvent.change(seasonSelect, { target: { value: "1" } });
    fireEvent.change(matchIdInput, { target: { value: "123" } });
    fireEvent.change(ticketNumberInput, { target: { value: "TICKET-123" } });

    // Select team
    const teamSelect = screen.getByTestId("team-selector");
    fireEvent.click(teamSelect);

    await waitFor(() => {
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);
    });

    // Click add button
    const addButton = screen.getByTestId("add-substitute-player-button");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockAddSubstitutePlayer).toHaveBeenCalledWith({
        seasonId: "1",
        teamId: "1",
        steamId: "76561198000000001",
        matchId: "123",
        ticketNumber: "TICKET-123"
      });
    });
  });

  it("should display success message after successful addition", async () => {
    // Mock successful validation
    mockUsePlayerValidation.mockReturnValue({
      validationResult: {
        steam_id: "76561198000000001",
        season_id: 1,
        app_id: 730,
        platform: SeasonPlatform.FACEIT,
        hours: { value: 1000, success: true, error: null },
        rank: { value: 10, success: true, error: null },
        platform_rank: { value: 5, success: true, error: null },
        profile: { success: true, data: null, error: null },
        overall_success: true
      },
      isValidating: false,
      error: null,
      validatePlayer: mockValidatePlayer,
      clearResults: mockClearResults
    });

    mockAddSubstitutePlayer.mockResolvedValue({
      message: "Substitute player successfully added to the team"
    });

    render(<AddSubstitutePlayerPage />);

    // Fill in required fields and submit
    const steamIdInput = screen.getByTestId("steam-id-input");
    const seasonSelect = screen.getByTestId("season-select");
    const matchIdInput = screen.getByTestId("match-id-input");
    const ticketNumberInput = screen.getByTestId("ticket-number-input");

    fireEvent.change(steamIdInput, { target: { value: "76561198000000001" } });
    fireEvent.change(seasonSelect, { target: { value: "1" } });
    fireEvent.change(matchIdInput, { target: { value: "123" } });
    fireEvent.change(ticketNumberInput, { target: { value: "TICKET-123" } });

    // Select team
    const teamSelect = screen.getByTestId("team-selector");
    fireEvent.click(teamSelect);

    await waitFor(() => {
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);
    });

    // Click add button
    const addButton = screen.getByTestId("add-substitute-player-button");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId("success-message")).toBeInTheDocument();
      expect(
        screen.getByText(
          /Substitute player successfully added to Team Alpha for match 123/
        )
      ).toBeInTheDocument();
    });
  });

  it("should display validation results when available", () => {
    // Mock validation result
    mockUsePlayerValidation.mockReturnValue({
      validationResult: {
        steam_id: "76561198000000001",
        season_id: 1,
        app_id: 730,
        platform: SeasonPlatform.FACEIT,
        hours: { value: 1000, success: true, error: null },
        rank: { value: 10, success: true, error: null },
        platform_rank: { value: 5, success: true, error: null },
        profile: { success: true, data: null, error: null },
        overall_success: true
      },
      isValidating: false,
      error: null,
      validatePlayer: mockValidatePlayer,
      clearResults: mockClearResults
    });

    render(<AddSubstitutePlayerPage />);

    expect(screen.getByTestId("player-validation-display")).toBeInTheDocument();
    expect(screen.getByText("Validation Result: Success")).toBeInTheDocument();
  });

  it("should display API error message when substitute player addition fails", async () => {
    // Mock successful validation
    mockUsePlayerValidation.mockReturnValue({
      validationResult: {
        steam_id: "76561198000000001",
        season_id: 1,
        app_id: 730,
        platform: SeasonPlatform.FACEIT,
        hours: { value: 1000, success: true, error: null },
        rank: { value: 10, success: true, error: null },
        platform_rank: { value: 5, success: true, error: null },
        profile: { success: true, data: null, error: null },
        overall_success: true
      },
      isValidating: false,
      error: null,
      validatePlayer: jest.fn(),
      clearResults: jest.fn()
    });

    // Mock API error with RFC 7807 format
    const apiError = {
      detail:
        "Match with Faceit room ID '1-invalid-room' not found in season 1",
      status: 400,
      title: "Bad Request"
    };
    mockAddSubstitutePlayer.mockRejectedValue(apiError);

    render(<AddSubstitutePlayerPage />);

    // Fill in required fields
    const steamIdInput = screen.getByTestId("steam-id-input");
    const seasonSelect = screen.getByTestId("season-select");
    const matchIdInput = screen.getByTestId("match-id-input");
    const ticketNumberInput = screen.getByTestId("ticket-number-input");

    fireEvent.change(steamIdInput, { target: { value: "76561198000000001" } });
    fireEvent.change(seasonSelect, { target: { value: "1" } });
    fireEvent.change(matchIdInput, { target: { value: "1-invalid-room" } });
    fireEvent.change(ticketNumberInput, { target: { value: "TICKET-123" } });

    // Select team
    const teamSelect = screen.getByTestId("team-selector");
    fireEvent.click(teamSelect);

    await waitFor(() => {
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);
    });

    // Click add button
    const addButton = screen.getByTestId("add-substitute-player-button");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Match with Faceit room ID '1-invalid-room' not found in season 1"
        )
      ).toBeInTheDocument();
    });
  });

  it("should display backend validation errors for invalid match ID", async () => {
    // Mock successful validation
    mockUsePlayerValidation.mockReturnValue({
      validationResult: {
        steam_id: "76561198000000001",
        season_id: 1,
        app_id: 730,
        platform: SeasonPlatform.FACEIT,
        hours: { value: 1000, success: true, error: null },
        rank: { value: 10, success: true, error: null },
        platform_rank: { value: 5, success: true, error: null },
        profile: { success: true, data: null, error: null },
        overall_success: true
      },
      isValidating: false,
      error: null,
      validatePlayer: mockValidatePlayer,
      clearResults: mockClearResults
    });

    // Mock backend validation error with RFC 7807 format
    const apiError = {
      detail: "Invalid match ID format: invalid-id",
      status: 400,
      title: "Bad Request"
    };
    mockAddSubstitutePlayer.mockRejectedValue(apiError);

    render(<AddSubstitutePlayerPage />);

    // Fill in required fields with invalid match ID
    const steamIdInput = screen.getByTestId("steam-id-input");
    const seasonSelect = screen.getByTestId("season-select");
    const matchIdInput = screen.getByTestId("match-id-input");
    const ticketNumberInput = screen.getByTestId("ticket-number-input");

    fireEvent.change(steamIdInput, { target: { value: "76561198000000001" } });
    fireEvent.change(seasonSelect, { target: { value: "1" } });
    fireEvent.change(matchIdInput, { target: { value: "invalid-id" } });
    fireEvent.change(ticketNumberInput, { target: { value: "TICKET-123" } });

    // Select team
    const teamSelect = screen.getByTestId("team-selector");
    fireEvent.click(teamSelect);

    await waitFor(() => {
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);
    });

    // Click add button
    const addButton = screen.getByTestId("add-substitute-player-button");
    fireEvent.click(addButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
      expect(
        screen.getByText("Invalid match ID format: invalid-id")
      ).toBeInTheDocument();
    });
  });
});
