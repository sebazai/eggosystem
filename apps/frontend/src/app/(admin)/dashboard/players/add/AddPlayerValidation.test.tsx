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
import {
  EligiblePlayerForValidationSteamId,
  SeasonPlatform,
  type PlayerValidationResult
} from "@eggosystem/types";

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
        league_name: "Division 1",
        tier: 2 // Non-tier 1 team
      },
      {
        team_id: 2,
        team_name: "Tier 1 Team",
        league_name: "Division 1",
        tier: 1 // Tier 1 team
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

// Mock Checkbox component
jest.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    "data-testid": testId
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    "data-testid"?: string;
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      data-testid={testId}
    />
  )
}));

// Mock Alert component
jest.mock("@/components/ui/alert", () => ({
  Alert: ({
    children,
    "data-testid": testId
  }: {
    children: React.ReactNode;
    "data-testid"?: string;
  }) => <div data-testid={testId}>{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

// Mock Select component
jest.mock("@/components/ui/select", () => {
  let selectedValue = "";
  let onValueChangeCallback: ((value: string) => void) | undefined;

  return {
    Select: ({
      children,
      value,
      onValueChange
    }: {
      children: React.ReactNode;
      value?: string;
      onValueChange?: (value: string) => void;
    }) => {
      selectedValue = value || "";
      onValueChangeCallback = onValueChange;
      return <div data-testid="team-select">{children}</div>;
    },
    SelectTrigger: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="team-selector" onClick={() => {}}>
        {children}
      </div>
    ),
    SelectValue: ({ placeholder }: { placeholder: string }) => (
      <div>{selectedValue || placeholder}</div>
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="team-dropdown">{children}</div>
    ),
    SelectItem: ({
      children,
      value,
      "data-testid": testId
    }: {
      children: React.ReactNode;
      value: string;
      "data-testid"?: string;
    }) => (
      <div
        data-testid={testId || `team-option-${value}`}
        onClick={() => {
          if (onValueChangeCallback) {
            onValueChangeCallback(value);
          }
        }}
      >
        {children}
      </div>
    )
  };
});

// Mock Button component
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    "data-testid": testId
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    "data-testid"?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} data-testid={testId}>
      {children}
    </button>
  )
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
  )
}));

// Mock Label component
jest.mock("@/components/ui/label", () => ({
  Label: ({
    children,
    htmlFor
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>
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
    steam_id: EligiblePlayerForValidationSteamId,
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
        target: { value: EligiblePlayerForValidationSteamId }
      });
      fireEvent.change(seasonSelect, { target: { value: "14" } });

      // Click validate button
      fireEvent.click(validateButton);

      // Verify validatePlayer was called
      expect(mockValidatePlayer).toHaveBeenCalledWith(
        EligiblePlayerForValidationSteamId,
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
        EligiblePlayerForValidationSteamId
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
        target: { value: EligiblePlayerForValidationSteamId }
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
        target: { value: EligiblePlayerForValidationSteamId }
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

  describe("Skip Profile Validation", () => {
    const mockValidationWithProfileFailure: PlayerValidationResult = {
      steam_id: EligiblePlayerForValidationSteamId,
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
        success: false,
        data: null,
        error: "Player not found in Kanahub"
      },
      overall_success: false
    };

    it("should show skip profile validation checkbox when profile fails but ranks/hours succeed", async () => {
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockValidationWithProfileFailure,
        isValidating: false,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearValidationResults
      });

      renderWithAuthAndSWR(<AddPlayerPage />, {
        user: mockAdminUser,
        swrConfig: createSWRConfig({})
      });

      // Fill in form including team (non-tier 1)
      const steamIdInput = screen.getByTestId("steam-id-input");
      const seasonSelect = screen.getByTestId("season-select");
      const teamSelect = screen.getByTestId("team-selector");

      fireEvent.change(steamIdInput, {
        target: { value: EligiblePlayerForValidationSteamId }
      });
      fireEvent.change(seasonSelect, { target: { value: "14" } });

      // Select non-tier 1 team
      fireEvent.click(teamSelect);
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);

      // Checkbox should appear
      await waitFor(() => {
        expect(
          screen.getByTestId("skip-profile-validation-checkbox")
        ).toBeInTheDocument();
      });
    });

    it("should not show checkbox for tier 1 teams", async () => {
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockValidationWithProfileFailure,
        isValidating: false,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearValidationResults
      });

      renderWithAuthAndSWR(<AddPlayerPage />, {
        user: mockAdminUser,
        swrConfig: createSWRConfig({})
      });

      // Fill in form including tier 1 team
      const steamIdInput = screen.getByTestId("steam-id-input");
      const seasonSelect = screen.getByTestId("season-select");
      const teamSelect = screen.getByTestId("team-selector");

      fireEvent.change(steamIdInput, {
        target: { value: EligiblePlayerForValidationSteamId }
      });
      fireEvent.change(seasonSelect, { target: { value: "14" } });

      // Select tier 1 team
      fireEvent.click(teamSelect);
      const teamOption = screen.getByTestId("team-option-2");
      fireEvent.click(teamOption);

      // Checkbox should NOT appear for tier 1 teams
      expect(
        screen.queryByTestId("skip-profile-validation-checkbox")
      ).not.toBeInTheDocument();
    });

    it("should not show checkbox when hours validation fails", async () => {
      const validationWithHoursFailure: PlayerValidationResult = {
        ...mockValidationWithProfileFailure,
        hours: {
          value: -1,
          success: false,
          error: "Failed to fetch hours"
        }
      };

      mockUsePlayerValidation.mockReturnValue({
        validationResult: validationWithHoursFailure,
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
        target: { value: EligiblePlayerForValidationSteamId }
      });
      fireEvent.change(seasonSelect, { target: { value: "14" } });

      // Select non-tier 1 team
      fireEvent.click(teamSelect);
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);

      // Checkbox should NOT appear when hours fail
      expect(
        screen.queryByTestId("skip-profile-validation-checkbox")
      ).not.toBeInTheDocument();
    });

    it("should enable eligibility button when skip checkbox is checked", async () => {
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockValidationWithProfileFailure,
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
        target: { value: EligiblePlayerForValidationSteamId }
      });
      fireEvent.change(seasonSelect, { target: { value: "14" } });

      // Select non-tier 1 team
      fireEvent.click(teamSelect);
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);

      // Wait for checkbox to appear
      const checkbox = await screen.findByTestId(
        "skip-profile-validation-checkbox"
      );

      // Initially disabled
      const eligibilityButton = screen.getByTestId("check-eligibility-button");
      expect(eligibilityButton).toBeDisabled();

      // Check the checkbox
      fireEvent.click(checkbox);

      // Eligibility button should now be enabled
      await waitFor(() => {
        expect(eligibilityButton).not.toBeDisabled();
      });
    });

    it("should show alert when profile validation is skipped", async () => {
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockValidationWithProfileFailure,
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
        target: { value: EligiblePlayerForValidationSteamId }
      });
      fireEvent.change(seasonSelect, { target: { value: "14" } });

      // Select non-tier 1 team
      fireEvent.click(teamSelect);
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);

      // Wait for checkbox to appear and check it
      const checkbox = await screen.findByTestId(
        "skip-profile-validation-checkbox"
      );
      fireEvent.click(checkbox);

      // Alert should appear
      await waitFor(() => {
        expect(screen.getByTestId("skip-profile-info")).toBeInTheDocument();
      });

      expect(screen.getByTestId("skip-profile-info")).toHaveTextContent(
        /Profile validation skipped/i
      );
    });

    it("should clear checkbox state when Steam ID changes", async () => {
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockValidationWithProfileFailure,
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
        target: { value: EligiblePlayerForValidationSteamId }
      });
      fireEvent.change(seasonSelect, { target: { value: "14" } });

      // Select non-tier 1 team
      fireEvent.click(teamSelect);
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);

      // Wait for checkbox to appear and check it
      const checkbox = await screen.findByTestId(
        "skip-profile-validation-checkbox"
      );
      fireEvent.click(checkbox);
      expect((checkbox as HTMLInputElement).checked).toBe(true);

      // Change Steam ID
      fireEvent.change(steamIdInput, {
        target: { value: "different-steam-id" }
      });

      // Checkbox should be cleared (not visible anymore or unchecked)
      await waitFor(() => {
        const checkboxAfterChange = screen.queryByTestId(
          "skip-profile-validation-checkbox"
        );
        // Either checkbox is removed or unchecked
        expect(
          checkboxAfterChange === null ||
            (checkboxAfterChange as HTMLInputElement).checked === false
        ).toBe(true);
      });
    });

    it("should clear checkbox state when season changes", async () => {
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockValidationWithProfileFailure,
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
        target: { value: EligiblePlayerForValidationSteamId }
      });
      fireEvent.change(seasonSelect, { target: { value: "14" } });

      // Select non-tier 1 team
      fireEvent.click(teamSelect);
      const teamOption = screen.getByTestId("team-option-1");
      fireEvent.click(teamOption);

      // Wait for checkbox to appear and check it
      const checkbox = await screen.findByTestId(
        "skip-profile-validation-checkbox"
      );
      fireEvent.click(checkbox);
      expect((checkbox as HTMLInputElement).checked).toBe(true);

      // Change season
      fireEvent.change(seasonSelect, { target: { value: "13" } });

      // Checkbox should be cleared (not visible anymore or unchecked)
      await waitFor(() => {
        const checkboxAfterChange = screen.queryByTestId(
          "skip-profile-validation-checkbox"
        );
        // Either checkbox is removed or unchecked
        expect(
          checkboxAfterChange === null ||
            (checkboxAfterChange as HTMLInputElement).checked === false
        ).toBe(true);
      });
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
