/**
 * TDD Tests for Add Player Validation Workflow
 * This test file focuses specifically on the validation step workflow
 * to ensure the validation button shows results correctly.
 */

import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  renderWithAuthAndSWR,
  createMockUser,
  createSWRConfig
} from "@/test-utils/test-utils";
import AddPlayerPage from "./page";
import { SeasonPlatform, type PlayerValidationResult } from "@eggosystem/types";

// Mock the custom hooks
const mockValidatePlayer = jest.fn();
const mockClearValidationResults = jest.fn();
const mockCheckEligibility = jest.fn();
const mockClearResult = jest.fn();
const mockAddPlayer = jest.fn();

// Create a mock hook that can be controlled in tests
const mockUsePlayerValidation = jest.fn();

jest.mock("@/hooks/data/dashboard/usePlayerValidation", () => ({
  usePlayerValidation: () => mockUsePlayerValidation()
}));

jest.mock("@/hooks/data/usePlayerTeamEligibility", () => ({
  usePlayerTeamEligibility: () => ({
    eligibilityResult: null,
    isLoading: false,
    isError: null,
    checkEligibility: mockCheckEligibility,
    clearResult: mockClearResult
  })
}));

jest.mock("@/hooks/data/useAddPlayer", () => ({
  useAddPlayer: () => ({
    addPlayer: mockAddPlayer
  })
}));

jest.mock("@/hooks/data/useActiveSignupOrActiveSeasonForApp", () => ({
  useActiveSignupOrActiveSeasonForApp: () => ({
    signupOrActiveSeason: { season_id: 14 }
  })
}));

jest.mock("@/hooks/data/useAllSeasons", () => ({
  useAllSeasons: () => ({
    seasons: [
      {
        id: 14,
        name: "Season 14",
        full_name: "Season 14 - CS:GO",
        platform: SeasonPlatform.FACEIT
      }
    ],
    isLoading: false
  })
}));

jest.mock("@/hooks/data/useDashboardSeasonTeams", () => ({
  useDashboardSeasonTeams: () => ({
    teams: [
      {
        team_id: 1,
        team_name: "Test Team",
        league_name: "Division 1"
      }
    ],
    isLoading: false
  })
}));

// Mock WithRoleProtection
jest.mock("@/components/dashboard/WithRoleProtection", () => ({
  WithRoleProtection: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-role-protection">{children}</div>
  )
}));

// Define proper types for mock components
interface MockPlayerValidationFormProps {
  steamId: string;
  setSteamId: (value: string) => void;
  seasonId: string;
  setSeasonId: (value: string) => void;
  onValidate: () => void;
  isValidating: boolean;
  error: string | null;
  buttonText?: string;
}

// Mock the validation components with real implementations to test integration
jest.mock("@/components/dashboard/PlayerValidationForm", () => ({
  PlayerValidationForm: ({
    steamId,
    setSteamId,
    seasonId,
    setSeasonId,
    onValidate,
    isValidating,
    error,
    buttonText = "Validate Player"
  }: MockPlayerValidationFormProps) => (
    <div data-testid="player-validation-form">
      <input
        data-testid="steam-id-input"
        value={steamId}
        onChange={(e) => setSteamId(e.target.value)}
        placeholder="Enter Steam ID"
      />
      <select
        data-testid="season-select"
        value={seasonId}
        onChange={(e) => setSeasonId(e.target.value)}
      >
        <option value="">Select season</option>
        <option value="14">Season 14</option>
      </select>
      <button
        data-testid="validate-button"
        onClick={onValidate}
        disabled={!steamId || !seasonId || isValidating}
      >
        {isValidating ? "Validating..." : buttonText}
      </button>
      {error && <div data-testid="validation-error">{error}</div>}
    </div>
  )
}));

interface MockPlayerValidationDisplayProps {
  validationResult: PlayerValidationResult | null;
  variant?: string;
}

jest.mock("@/components/dashboard/PlayerValidationDisplay", () => ({
  PlayerValidationDisplay: ({
    validationResult,
    variant
  }: MockPlayerValidationDisplayProps) => (
    <div data-testid="player-validation-display">
      <div data-testid="validation-variant">{variant}</div>
      <div data-testid="validation-overall-success">
        {validationResult?.overall_success ? "Success" : "Failed"}
      </div>
      <div data-testid="validation-steam-id">{validationResult?.steam_id}</div>
      {validationResult?.profile?.data && (
        <div data-testid="validation-profile-name">
          {validationResult.profile.data.nickname}
        </div>
      )}
    </div>
  )
}));

describe("Add Player Validation Workflow (TDD)", () => {
  // Create mock admin user for testing protected routes
  const mockAdminUser = createMockUser({ roles: ["admin"] });

  const mockSuccessfulValidation: PlayerValidationResult = {
    steam_id: "76561198054765387",
    season_id: 14,
    app_id: 730,
    platform: SeasonPlatform.FACEIT,
    hours: {
      value: 1500,
      success: true,
      error: null
    },
    rank: {
      value: 15000,
      success: true,
      error: null
    },
    platform_rank: {
      value: 5,
      success: true,
      error: null
    },
    profile: {
      success: true,
      data: {
        account_id: 123,
        steam_id: "76561197960287930",
        nickname: "TestPlayer",
        discord: "player#1234",
        work_email_verified: true,
        is_work_email_personal_email: false,
        is_valid_full_name: true,
        is_valid_work_email: true,
        work_email: "test@example.com"
      },
      error: null
    },
    overall_success: true
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock behavior
    mockUsePlayerValidation.mockReturnValue({
      validationResult: null,
      isValidating: false,
      error: null,
      validatePlayer: mockValidatePlayer,
      clearResults: mockClearValidationResults
    });
  });

  describe("Validation Button Workflow", () => {
    it("should show validation results after successful validation", async () => {
      // Mock successful validation
      mockUsePlayerValidation.mockReturnValue({
        validationResult: null, // Initially null
        isValidating: false,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearValidationResults
      });

      const { rerender } = renderWithAuthAndSWR(<AddPlayerPage />, {
        user: mockAdminUser,
        swrConfig: createSWRConfig({})
      });

      // Fill in form
      const steamIdInput = screen.getByTestId("steam-id-input");
      const seasonSelect = screen.getByTestId("season-select");
      const validateButton = screen.getByTestId("validate-button");

      fireEvent.change(steamIdInput, {
        target: { value: "76561198054765387" }
      });
      fireEvent.change(seasonSelect, { target: { value: "14" } });

      // Click validate button
      fireEvent.click(validateButton);

      // Verify validatePlayer was called
      expect(mockValidatePlayer).toHaveBeenCalledWith(
        "76561198054765387",
        "14"
      );

      // Mock the hook to return validation result after validation
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockSuccessfulValidation,
        isValidating: false,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearValidationResults
      });

      // Re-render with validation result
      rerender(<AddPlayerPage />);

      // Should display validation results
      await waitFor(() => {
        expect(
          screen.getByTestId("player-validation-display")
        ).toBeInTheDocument();
      });

      expect(screen.getByTestId("validation-variant")).toHaveTextContent(
        "compact"
      );
      expect(
        screen.getByTestId("validation-overall-success")
      ).toHaveTextContent("Success");
      expect(screen.getByTestId("validation-steam-id")).toHaveTextContent(
        "76561198054765387"
      );
      expect(screen.getByTestId("validation-profile-name")).toHaveTextContent(
        "TestPlayer"
      );
    });

    it("should enable eligibility button after successful validation", async () => {
      // Mock successful validation result
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockSuccessfulValidation,
        isValidating: false,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearValidationResults
      });

      renderWithAuthAndSWR(<AddPlayerPage />, {
        user: mockAdminUser,
        swrConfig: createSWRConfig({})
      });

      // Fill in form including team
      const steamIdInput = screen.getByTestId("steam-id-input");
      const seasonSelect = screen.getByTestId("season-select");
      const teamSelect = screen.getByTestId("team-selector");

      fireEvent.change(steamIdInput, {
        target: { value: "76561198054765387" }
      });
      fireEvent.change(seasonSelect, { target: { value: "14" } });

      // Select team
      fireEvent.click(teamSelect);
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);

      // Eligibility button should be enabled
      const eligibilityButton = screen.getByTestId("check-eligibility-button");
      expect(eligibilityButton).not.toBeDisabled();
    });

    it("should keep eligibility button disabled without successful validation", async () => {
      // Mock failed validation result
      const failedValidation = {
        ...mockSuccessfulValidation,
        overall_success: false
      };
      mockUsePlayerValidation.mockReturnValue({
        validationResult: failedValidation,
        isValidating: false,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearValidationResults
      });

      renderWithAuthAndSWR(<AddPlayerPage />, {
        user: mockAdminUser,
        swrConfig: createSWRConfig({})
      });

      // Fill in form including team
      const steamIdInput = screen.getByTestId("steam-id-input");
      const seasonSelect = screen.getByTestId("season-select");
      const teamSelect = screen.getByTestId("team-selector");

      fireEvent.change(steamIdInput, {
        target: { value: "76561198054765387" }
      });
      fireEvent.change(seasonSelect, { target: { value: "14" } });

      // Select team
      fireEvent.click(teamSelect);
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);

      // Eligibility button should remain disabled
      const eligibilityButton = screen.getByTestId("check-eligibility-button");
      expect(eligibilityButton).toBeDisabled();
    });

    it("should show validation error when validation fails", async () => {
      // Mock validation error
      mockUsePlayerValidation.mockReturnValue({
        validationResult: null,
        isValidating: false,
        error: "Invalid Steam ID format",
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearValidationResults
      });

      renderWithAuthAndSWR(<AddPlayerPage />, {
        user: mockAdminUser,
        swrConfig: createSWRConfig({})
      });

      // Should display validation error
      expect(screen.getByTestId("validation-error")).toHaveTextContent(
        "Invalid Steam ID format"
      );
    });

    it("should clear validation results when Steam ID changes", async () => {
      // Mock initial validation result
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockSuccessfulValidation,
        isValidating: false,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearValidationResults
      });

      renderWithAuthAndSWR(<AddPlayerPage />, {
        user: mockAdminUser,
        swrConfig: createSWRConfig({})
      });

      // Change Steam ID
      const steamIdInput = screen.getByTestId("steam-id-input");
      fireEvent.change(steamIdInput, {
        target: { value: "different-steam-id" }
      });

      // Should call clearResults
      expect(mockClearValidationResults).toHaveBeenCalled();
    });

    it("should clear validation results when season changes", async () => {
      // Mock initial validation result
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockSuccessfulValidation,
        isValidating: false,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearValidationResults
      });

      renderWithAuthAndSWR(<AddPlayerPage />, {
        user: mockAdminUser,
        swrConfig: createSWRConfig({})
      });

      // Change season
      const seasonSelect = screen.getByTestId("season-select");
      fireEvent.change(seasonSelect, { target: { value: "13" } });

      // Should call clearResults
      expect(mockClearValidationResults).toHaveBeenCalled();
    });
  });

  describe("Loading States", () => {
    it("should show loading state during validation", async () => {
      // Mock loading state
      mockUsePlayerValidation.mockReturnValue({
        validationResult: null,
        isValidating: true,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearValidationResults
      });

      renderWithAuthAndSWR(<AddPlayerPage />, {
        user: mockAdminUser,
        swrConfig: createSWRConfig({})
      });

      const validateButton = screen.getByTestId("validate-button");
      expect(validateButton).toHaveTextContent("Validating...");
      expect(validateButton).toBeDisabled();
    });
  });
});
