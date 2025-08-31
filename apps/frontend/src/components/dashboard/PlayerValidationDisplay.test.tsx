import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PlayerValidationDisplay } from "./PlayerValidationDisplay";
import { SeasonPlatform, type PlayerValidationResult } from "@eggosystem/types";

// Mock the icon components
jest.mock("lucide-react", () => ({
  CheckCircle: ({ className }: { className: string }) => (
    <div data-testid="check-circle" className={className}>
      ✓
    </div>
  ),
  XCircle: ({ className }: { className: string }) => (
    <div data-testid="x-circle" className={className}>
      ✗
    </div>
  ),
  AlertTriangle: ({ className }: { className: string }) => (
    <div data-testid="alert-triangle" className={className}>
      ⚠
    </div>
  )
}));

// Mock the profile components
jest.mock("@/components/profile/FaceITLevelIcon", () => ({
  FaceITLevelIcon: ({ level }: { level: number }) => (
    <div data-testid="faceit-level-icon">Level {level}</div>
  )
}));

jest.mock("@/components/profile/CS2PremierRankBadge", () => ({
  CS2PremierRankBadge: ({ rankScore }: { rankScore: number }) => (
    <div data-testid="cs2-rank-badge">Rank {rankScore}</div>
  )
}));

describe("PlayerValidationDisplay", () => {
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

  const mockFailedValidation: PlayerValidationResult = {
    steam_id: "76561198054765387",
    season_id: 14,
    app_id: 730,
    platform: SeasonPlatform.FACEIT,
    hours: {
      value: -1,
      success: false,
      error: "Insufficient hours detected"
    },
    rank: {
      value: -1,
      success: false,
      error: "CS2 rank could not be determined"
    },
    platform_rank: {
      value: -1,
      success: false,
      error: "No FaceIT rank found"
    },
    profile: {
      success: false,
      data: null,
      error: "Player not found in Kanahub"
    },
    overall_success: false
  };

  describe("Compact Variant", () => {
    it("should render successful validation in compact mode", () => {
      render(
        <PlayerValidationDisplay
          validationResult={mockSuccessfulValidation}
          variant="compact"
        />
      );

      // Check that it shows success status
      expect(screen.getByTestId("validation-success")).toBeInTheDocument();
      expect(screen.getByText("Player Validated")).toBeInTheDocument();

      // Check that profile information is displayed
      expect(screen.getByText("Name: TestPlayer")).toBeInTheDocument();
      expect(screen.getByText("Discord: player#1234")).toBeInTheDocument();
      expect(screen.getByText("Email Verified: Yes")).toBeInTheDocument();

      // Check that hours are displayed
      expect(screen.getByText("Hours: 1500")).toBeInTheDocument();

      // Check that rank is displayed
      expect(screen.getByText("Rank: 15000")).toBeInTheDocument();

      // Check that platform rank is displayed
      expect(screen.getByText("Level: 5")).toBeInTheDocument();

      // Check success message
      expect(
        screen.getByText(/Player meets all season requirements/)
      ).toBeInTheDocument();
    });

    it("should render failed validation in compact mode", () => {
      render(
        <PlayerValidationDisplay
          validationResult={mockFailedValidation}
          variant="compact"
        />
      );

      // Check that it shows failure status
      expect(screen.getByTestId("validation-failure")).toBeInTheDocument();
      expect(screen.getByText("Validation Failed")).toBeInTheDocument();

      // Check that error messages are displayed
      expect(
        screen.getByText("Player not found in Kanahub")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Insufficient hours detected")
      ).toBeInTheDocument();
      expect(
        screen.getByText("CS2 rank could not be determined")
      ).toBeInTheDocument();
      expect(screen.getByText("No FaceIT rank found")).toBeInTheDocument();

      // Check failure message
      expect(
        screen.getByText(/Player does not meet all season requirements/)
      ).toBeInTheDocument();
    });

    it("should display correct icons for success and failure states", () => {
      const { rerender } = render(
        <PlayerValidationDisplay
          validationResult={mockSuccessfulValidation}
          variant="compact"
        />
      );

      // Check success icons
      const successIcons = screen.getAllByTestId("check-circle");
      expect(successIcons.length).toBeGreaterThan(0);

      // Rerender with failed validation
      rerender(
        <PlayerValidationDisplay
          validationResult={mockFailedValidation}
          variant="compact"
        />
      );

      // Check failure icons
      const failureIcons = screen.getAllByTestId("x-circle");
      expect(failureIcons.length).toBeGreaterThan(0);
    });
  });

  describe("Detailed Variant", () => {
    it("should render successful validation in detailed mode", () => {
      render(
        <PlayerValidationDisplay
          validationResult={mockSuccessfulValidation}
          platform={SeasonPlatform.FACEIT}
          variant="detailed"
        />
      );

      // Check that it shows success status
      expect(screen.getByTestId("validation-success")).toBeInTheDocument();
      expect(screen.getByText("Player Validated")).toBeInTheDocument();

      // Check detailed description with platform info
      expect(
        screen.getByText(/Steam ID: 76561198054765387/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Season: 14/)).toBeInTheDocument();
      expect(screen.getByText(/Platform: faceit/)).toBeInTheDocument();

      // Check that badges are displayed for detailed view
      expect(screen.getAllByText("Valid").length).toBeGreaterThan(0);

      // Check that overall result section is displayed
      expect(
        screen.getByText("Player is ready to be added to team")
      ).toBeInTheDocument();

      // Check that validation summary is displayed
      expect(
        screen.getByText(/Player validation successful!/)
      ).toBeInTheDocument();
    });

    it("should render failed validation in detailed mode", () => {
      render(
        <PlayerValidationDisplay
          validationResult={mockFailedValidation}
          platform={SeasonPlatform.FACEIT}
          variant="detailed"
        />
      );

      // Check that it shows failure status
      expect(screen.getByTestId("validation-failure")).toBeInTheDocument();
      expect(screen.getByText("Validation Failed")).toBeInTheDocument();

      // Check that error badges are displayed (there are multiple "Invalid" badges)
      expect(screen.getAllByText("Invalid").length).toBeGreaterThan(0);

      // Check that overall result section shows failure
      expect(
        screen.getByText("Player has validation issues")
      ).toBeInTheDocument();

      // Check that validation summary shows failure
      expect(
        screen.getByText(
          /Player has validation issues that need to be resolved/
        )
      ).toBeInTheDocument();

      // Check that alert triangle is displayed
      expect(screen.getAllByTestId("alert-triangle").length).toBeGreaterThan(0);
    });

    it("should display FACEIT level icon for FACEIT platform", () => {
      render(
        <PlayerValidationDisplay
          validationResult={mockSuccessfulValidation}
          platform={SeasonPlatform.FACEIT}
          variant="detailed"
        />
      );

      expect(screen.getByTestId("faceit-level-icon")).toBeInTheDocument();
      expect(screen.getByText("Level 5")).toBeInTheDocument();
    });

    it("should display CS2 rank badge for successful rank validation", () => {
      render(
        <PlayerValidationDisplay
          validationResult={mockSuccessfulValidation}
          platform={SeasonPlatform.FACEIT}
          variant="detailed"
        />
      );

      expect(screen.getByTestId("cs2-rank-badge")).toBeInTheDocument();
      expect(screen.getByText("Rank 15000")).toBeInTheDocument();
    });

    it("should display detailed profile information", () => {
      render(
        <PlayerValidationDisplay
          validationResult={mockSuccessfulValidation}
          platform={SeasonPlatform.FACEIT}
          variant="detailed"
        />
      );

      // Check detailed profile fields
      expect(screen.getByText("Nickname: TestPlayer")).toBeInTheDocument();
      expect(
        screen.getByText("Discord (captains only): player#1234")
      ).toBeInTheDocument();
      expect(screen.getByText("Email Verified: Yes")).toBeInTheDocument();
      expect(screen.getByText("Valid Name: Yes")).toBeInTheDocument();
      expect(screen.getByText("Valid Email: Yes")).toBeInTheDocument();
    });
  });

  describe("Platform Handling", () => {
    it("should show correct platform name in detailed mode", () => {
      const { rerender } = render(
        <PlayerValidationDisplay
          validationResult={mockSuccessfulValidation}
          platform={SeasonPlatform.FACEIT}
          variant="detailed"
        />
      );

      expect(screen.getByText(/faceit.*Rank/)).toBeInTheDocument();

      // Test with Kanaliiga platform
      rerender(
        <PlayerValidationDisplay
          validationResult={mockSuccessfulValidation}
          platform={SeasonPlatform.Kanaliiga}
          variant="detailed"
        />
      );

      expect(screen.getByText(/kanaliiga.*Rank/)).toBeInTheDocument();
    });

    it("should only show FACEIT level icon for FACEIT platform", () => {
      const { rerender } = render(
        <PlayerValidationDisplay
          validationResult={mockSuccessfulValidation}
          platform={SeasonPlatform.FACEIT}
          variant="detailed"
        />
      );

      expect(screen.getByTestId("faceit-level-icon")).toBeInTheDocument();

      // Test with Kanaliiga platform (should not show FACEIT icon)
      rerender(
        <PlayerValidationDisplay
          validationResult={mockSuccessfulValidation}
          platform={SeasonPlatform.Kanaliiga}
          variant="detailed"
        />
      );

      expect(screen.queryByTestId("faceit-level-icon")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing profile data", () => {
      const validationWithoutProfile: PlayerValidationResult = {
        ...mockFailedValidation,
        profile: {
          success: false,
          data: null,
          error: "Profile not found"
        }
      };

      render(
        <PlayerValidationDisplay
          validationResult={validationWithoutProfile}
          variant="compact"
        />
      );

      expect(screen.getByText("Profile not found")).toBeInTheDocument();
    });

    it("should handle partial profile data", () => {
      const validationWithPartialProfile: PlayerValidationResult = {
        ...mockSuccessfulValidation,
        profile: {
          success: true,
          data: {
            account_id: 123,
            steam_id: "76561197960287930",
            nickname: "TestPlayer",
            discord: "",
            work_email_verified: false,
            is_work_email_personal_email: false,
            is_valid_full_name: true,
            is_valid_work_email: false,
            work_email: ""
          },
          error: null
        }
      };

      render(
        <PlayerValidationDisplay
          validationResult={validationWithPartialProfile}
          variant="compact"
        />
      );

      expect(screen.getByText("Discord: Not set")).toBeInTheDocument();
      expect(screen.getByText("Email Verified: No")).toBeInTheDocument();
    });

    it("should default to compact variant when variant is not specified", () => {
      render(
        <PlayerValidationDisplay validationResult={mockSuccessfulValidation} />
      );

      // Should show detailed description style (when no variant specified, defaults to detailed)
      expect(
        screen.getByText(/Steam ID: 76561198054765387/)
      ).toBeInTheDocument();
    });

    it("should show personal email warning when is_work_email_personal_email is true", () => {
      const validationResultWithPersonalEmail = {
        ...mockSuccessfulValidation,
        profile: {
          ...mockSuccessfulValidation.profile,
          data: {
            ...mockSuccessfulValidation.profile.data!,
            is_work_email_personal_email: true
          }
        }
      };

      render(
        <PlayerValidationDisplay
          validationResult={validationResultWithPersonalEmail}
          variant="compact"
        />
      );

      expect(
        screen.getByText(/Personal Email Detected - Requires Admin Validation/)
      ).toBeInTheDocument();
    });

    it("should show detailed personal email warning in detailed view", () => {
      const validationResultWithPersonalEmail = {
        ...mockSuccessfulValidation,
        profile: {
          ...mockSuccessfulValidation.profile,
          data: {
            ...mockSuccessfulValidation.profile.data!,
            is_work_email_personal_email: true
          }
        }
      };

      render(
        <PlayerValidationDisplay
          validationResult={validationResultWithPersonalEmail}
          variant="detailed"
        />
      );

      expect(screen.getByText(/Personal Email Detected/)).toBeInTheDocument();
      expect(
        screen.getByText(/Admin must validate employment status/)
      ).toBeInTheDocument();
    });
  });
});
