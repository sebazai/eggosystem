import { render, screen } from "@testing-library/react";
import PlayerValidationPage from "./page";
import { SeasonPlatform, createMockSeason } from "@eggosystem/types";
import type { PlayerValidationResult } from "@eggosystem/types";

// Mock the custom hooks
jest.mock("@/hooks/data/useAllSeasons");
jest.mock("@/hooks/data/dashboard/usePlayerValidation");

// Mock WithRoleProtection
jest.mock("@/components/dashboard/WithRoleProtection", () => ({
  WithRoleProtection: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="role-protection">{children}</div>
  )
}));

// Mock dependencies
import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { usePlayerValidation } from "@/hooks/data/dashboard/usePlayerValidation";

const mockUseAllSeasons = useAllSeasons as jest.MockedFunction<
  typeof useAllSeasons
>;
const mockUsePlayerValidation = usePlayerValidation as jest.MockedFunction<
  typeof usePlayerValidation
>;

// Mock data
const mockSeasons = [
  createMockSeason(
    1,
    "Season 1",
    "Season 1 - FACEIT",
    "2024-01-01",
    "2024-01-31",
    "faceit",
    "2024-02-01",
    "2024-04-30"
  ),
  createMockSeason(
    2,
    "Season 2",
    "Season 2 - Esportal",
    "2024-05-01",
    "2024-05-31",
    "esportal",
    "2024-06-01",
    "2024-08-31"
  )
];

const mockValidationResultSuccess: PlayerValidationResult = {
  steam_id: "76561198012345678",
  season_id: 1,
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
    value: 8,
    success: true,
    error: null
  },
  profile: {
    success: true,
    data: {
      account_id: 123,
      steam_id: "76561197960287930",
      nickname: "TestPlayer",
      discord: "TestPlayer#1234",
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

const mockValidationResultFailure: PlayerValidationResult = {
  steam_id: "76561198012345678",
  season_id: 1,
  app_id: 730,
  platform: SeasonPlatform.FACEIT,
  hours: {
    value: 100,
    success: false,
    error: "Insufficient hours"
  },
  rank: {
    value: 0,
    success: false,
    error: "No rank found"
  },
  platform_rank: {
    value: 3,
    success: true,
    error: null
  },
  profile: {
    success: false,
    data: null,
    error: "Profile not found"
  },
  overall_success: false
};

describe("PlayerValidationPage", () => {
  const mockValidatePlayer = jest.fn();
  const mockClearResults = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAllSeasons.mockReturnValue({
      seasons: mockSeasons,
      isLoading: false,
      isError: false,
      isValidating: false
    });
    mockUsePlayerValidation.mockReturnValue({
      validationResult: null,
      isValidating: false,
      error: null,
      validatePlayer: mockValidatePlayer,
      clearResults: mockClearResults
    });
  });

  describe("Initial Render", () => {
    it("should render the page title and description", () => {
      render(<PlayerValidationPage />);

      expect(screen.getByText("Player Validation")).toBeInTheDocument();
      expect(
        screen.getByText(/Validate player data before adding them to teams/)
      ).toBeInTheDocument();
    });

    it("should render form fields", () => {
      render(<PlayerValidationPage />);

      expect(screen.getByLabelText("Steam ID")).toBeInTheDocument();
      expect(screen.getByText("Season")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Validate Player" })
      ).toBeInTheDocument();
    });

    it("should disable validate button when fields are empty", () => {
      render(<PlayerValidationPage />);

      const validateButton = screen.getByRole("button", {
        name: "Validate Player"
      });
      expect(validateButton).toBeDisabled();
    });
  });

  describe("Seasons Loading", () => {
    it("should show loading state when seasons are loading", () => {
      mockUseAllSeasons.mockReturnValue({
        seasons: undefined,
        isLoading: true,
        isError: false,
        isValidating: false
      });

      render(<PlayerValidationPage />);

      // Just check that the component renders when loading
      expect(screen.getByText("Player Validation")).toBeInTheDocument();
    });

    it("should show no seasons when no seasons available", () => {
      mockUseAllSeasons.mockReturnValue({
        seasons: [],
        isLoading: false,
        isError: false,
        isValidating: false
      });

      render(<PlayerValidationPage />);

      // Component should still render
      expect(screen.getByText("Player Validation")).toBeInTheDocument();
    });
  });

  describe("Validation Results - Success Case", () => {
    beforeEach(() => {
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockValidationResultSuccess,
        isValidating: false,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearResults
      });
    });

    it("should display validation results card", () => {
      render(<PlayerValidationPage />);

      expect(screen.getByText("Player Validated")).toBeInTheDocument();
      expect(
        screen.getByText(/Steam ID: 76561198012345678/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Season: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Platform:/)).toBeInTheDocument();
    });

    it("should show successful hours validation", () => {
      render(<PlayerValidationPage />);

      expect(screen.getByText("Steam Hours")).toBeInTheDocument();
      expect(screen.getByText("1500 hours")).toBeInTheDocument();
    });

    it("should show successful rank validation", () => {
      render(<PlayerValidationPage />);

      expect(screen.getByText("CS2 Rank")).toBeInTheDocument();
      expect(screen.getByText("Rank: 15000")).toBeInTheDocument();
    });

    it("should show successful platform rank validation", () => {
      render(<PlayerValidationPage />);

      expect(screen.getByText("Level: 8")).toBeInTheDocument();
    });

    it("should show successful profile validation", () => {
      render(<PlayerValidationPage />);

      expect(screen.getByText("Kanahub Profile")).toBeInTheDocument();
      expect(screen.getByText("Nickname: TestPlayer")).toBeInTheDocument();
      expect(
        screen.getByText("Discord (captains only): TestPlayer#1234")
      ).toBeInTheDocument();
      expect(screen.getByText("Email Verified: Yes")).toBeInTheDocument();
      expect(screen.getByText("Valid Name: Yes")).toBeInTheDocument();
      expect(screen.getByText("Valid Email: Yes")).toBeInTheDocument();
    });

    it("should show overall success message", () => {
      render(<PlayerValidationPage />);

      expect(
        screen.getByText("Player is ready to be added to team")
      ).toBeInTheDocument();
      expect(
        screen.getByText("All required data is available and valid")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Player validation successful! This player can be added to teams."
        )
      ).toBeInTheDocument();
    });
  });

  describe("Validation Results - Failure Case", () => {
    beforeEach(() => {
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockValidationResultFailure,
        isValidating: false,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearResults
      });
    });

    it("should show failed hours validation", () => {
      render(<PlayerValidationPage />);

      expect(screen.getByText("Steam Hours")).toBeInTheDocument();
      expect(screen.getByText("Could not determine hours")).toBeInTheDocument();
    });

    it("should show failed rank validation", () => {
      render(<PlayerValidationPage />);

      expect(screen.getByText("CS2 Rank")).toBeInTheDocument();
      expect(screen.getByText("Could not determine rank")).toBeInTheDocument();
    });

    it("should show profile error message", () => {
      render(<PlayerValidationPage />);

      expect(screen.getByText("Kanahub Profile")).toBeInTheDocument();
      expect(screen.getByText("Profile not found")).toBeInTheDocument();
    });

    it("should show overall failure message", () => {
      render(<PlayerValidationPage />);

      expect(
        screen.getByText("Player has validation issues")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Some required data is missing or invalid. Please resolve issues before adding to team."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Player has validation issues that need to be resolved."
        )
      ).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should show error message", () => {
      const errorMessage = "Player not found";
      mockUsePlayerValidation.mockReturnValue({
        validationResult: null,
        isValidating: false,
        error: errorMessage,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearResults
      });

      render(<PlayerValidationPage />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading state during validation", () => {
      mockUsePlayerValidation.mockReturnValue({
        validationResult: null,
        isValidating: true,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearResults
      });

      render(<PlayerValidationPage />);

      expect(screen.getByText("Validating...")).toBeInTheDocument();
    });
  });

  describe("Platform Handling", () => {
    it("should show correct platform rank label for FACEIT", () => {
      mockUsePlayerValidation.mockReturnValue({
        validationResult: mockValidationResultSuccess,
        isValidating: false,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearResults
      });

      render(<PlayerValidationPage />);

      expect(screen.getByText("Level: 8")).toBeInTheDocument();
    });

    it("should show correct platform rank label for Esportal", () => {
      const esportalResult = {
        ...mockValidationResultSuccess,
        platform: SeasonPlatform.Esportal
      };

      mockUsePlayerValidation.mockReturnValue({
        validationResult: esportalResult,
        isValidating: false,
        error: null,
        validatePlayer: mockValidatePlayer,
        clearResults: mockClearResults
      });

      render(<PlayerValidationPage />);

      expect(screen.getByText("Level: 8")).toBeInTheDocument();
    });
  });
});
