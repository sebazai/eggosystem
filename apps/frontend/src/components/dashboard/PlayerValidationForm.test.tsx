import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PlayerValidationForm } from "./PlayerValidationForm";
import { EligiblePlayerForValidationSteamId } from "@eggosystem/types";

// Mock the UI components
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

jest.mock("@/components/ui/input", () => ({
  Input: ({
    placeholder,
    value,
    onChange,
    disabled,
    "data-testid": testId
  }: {
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    "data-testid"?: string;
  }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      data-testid={testId}
    />
  )
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children }: { children: React.ReactNode }) => (
    <label>{children}</label>
  )
}));

jest.mock("@/components/dashboard/SelectedSeasonBadge", () => ({
  SelectedSeasonBadge: () => (
    <div data-testid="selected-season-badge">Season Badge</div>
  )
}));

jest.mock("@/components/ui/alert", () => ({
  Alert: ({
    children,
    variant,
    "data-testid": testId
  }: {
    children: React.ReactNode;
    variant?: "default" | "destructive";
    "data-testid"?: string;
  }) => (
    <div data-testid={testId} data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

jest.mock("lucide-react", () => ({
  Loader2: ({ className }: { className: string }) => (
    <div data-testid="loader" className={className}>
      ⏳
    </div>
  ),
  CheckCircle: ({ className }: { className: string }) => (
    <div data-testid="check-circle" className={className}>
      ✓
    </div>
  ),
  XCircle: ({ className }: { className: string }) => (
    <div data-testid="x-circle" className={className}>
      ✗
    </div>
  )
}));

describe("PlayerValidationForm", () => {
  const defaultProps = {
    steamId: "",
    setSteamId: jest.fn(),
    seasonId: "",
    isValidating: false,
    error: null,
    onValidate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Form Rendering", () => {
    it("should render all form elements", () => {
      render(<PlayerValidationForm {...defaultProps} seasonId="14" />);

      expect(screen.getByText("Steam ID")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter Steam ID")).toBeInTheDocument();
      expect(screen.getByText("Season")).toBeInTheDocument();
      expect(screen.getByText("Validate Player")).toBeInTheDocument();
    });

    it("should render season badge when seasonId is provided", () => {
      render(<PlayerValidationForm {...defaultProps} seasonId="14" />);

      // Season badge should be rendered via SelectedSeasonBadge component
      expect(screen.getByText("Season")).toBeInTheDocument();
    });

    it("should not render season badge when seasonId is empty", () => {
      render(<PlayerValidationForm {...defaultProps} seasonId="" />);

      // Season label should not be shown when no seasonId
      expect(screen.queryByText("Season")).not.toBeInTheDocument();
    });

    it("should use custom button text when provided", () => {
      render(
        <PlayerValidationForm
          {...defaultProps}
          buttonText="Custom Validate Text"
        />
      );

      expect(screen.getByText("Custom Validate Text")).toBeInTheDocument();
    });

    it("should use custom test id when provided", () => {
      render(
        <PlayerValidationForm
          {...defaultProps}
          data-testid="custom-validate-button"
        />
      );

      expect(screen.getByTestId("custom-validate-button")).toBeInTheDocument();
    });
  });

  describe("Form Interactions", () => {
    it("should call setSteamId when Steam ID input changes", () => {
      const mockSetSteamId = jest.fn();
      render(
        <PlayerValidationForm {...defaultProps} setSteamId={mockSetSteamId} />
      );

      const steamIdInput = screen.getByPlaceholderText("Enter Steam ID");
      fireEvent.change(steamIdInput, {
        target: { value: EligiblePlayerForValidationSteamId }
      });

      expect(mockSetSteamId).toHaveBeenCalledWith(
        EligiblePlayerForValidationSteamId
      );
    });

    it("should call onValidate when validate button is clicked", () => {
      const mockOnValidate = jest.fn();
      render(
        <PlayerValidationForm
          {...defaultProps}
          steamId={EligiblePlayerForValidationSteamId}
          seasonId="14"
          onValidate={mockOnValidate}
        />
      );

      const validateButton = screen.getByText("Validate Player");
      fireEvent.click(validateButton);

      expect(mockOnValidate).toHaveBeenCalled();
    });
  });

  describe("Form Validation", () => {
    it("should disable validate button when required fields are missing", () => {
      render(<PlayerValidationForm {...defaultProps} />);

      const validateButton = screen.getByText("Validate Player");
      expect(validateButton).toBeDisabled();
    });

    it("should disable validate button when only Steam ID is provided", () => {
      render(
        <PlayerValidationForm
          {...defaultProps}
          steamId={EligiblePlayerForValidationSteamId}
        />
      );

      const validateButton = screen.getByText("Validate Player");
      expect(validateButton).toBeDisabled();
    });

    it("should disable validate button when only season is provided", () => {
      render(<PlayerValidationForm {...defaultProps} seasonId="14" />);

      const validateButton = screen.getByText("Validate Player");
      expect(validateButton).toBeDisabled();
    });

    it("should enable validate button when both fields are provided", () => {
      render(
        <PlayerValidationForm
          {...defaultProps}
          steamId={EligiblePlayerForValidationSteamId}
          seasonId="14"
        />
      );

      const validateButton = screen.getByText("Validate Player");
      expect(validateButton).not.toBeDisabled();
    });

    it("should disable validate button when isValidating is true", () => {
      render(
        <PlayerValidationForm
          {...defaultProps}
          steamId={EligiblePlayerForValidationSteamId}
          seasonId="14"
          isValidating={true}
        />
      );

      const validateButton = screen.getByText("Validating...");
      expect(validateButton).toBeDisabled();
    });

    it("should disable validate button when disabled prop is true", () => {
      render(
        <PlayerValidationForm
          {...defaultProps}
          steamId={EligiblePlayerForValidationSteamId}
          seasonId="14"
          disabled={true}
        />
      );

      const validateButton = screen.getByText("Validate Player");
      expect(validateButton).toBeDisabled();
    });
  });

  describe("Loading States", () => {
    it("should show loading text when validating", () => {
      render(<PlayerValidationForm {...defaultProps} isValidating={true} />);

      expect(screen.getByText("Validating...")).toBeInTheDocument();
      expect(screen.getByTestId("loader")).toBeInTheDocument();
    });

    it("should disable inputs when validating", () => {
      render(
        <PlayerValidationForm
          {...defaultProps}
          seasonId="14"
          isValidating={true}
        />
      );

      const steamIdInput = screen.getByPlaceholderText("Enter Steam ID");

      expect(steamIdInput).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("should display error message when error is provided", () => {
      render(
        <PlayerValidationForm
          {...defaultProps}
          error="Invalid Steam ID format"
        />
      );

      expect(screen.getByTestId("error-message")).toBeInTheDocument();
      expect(screen.getByText("Invalid Steam ID format")).toBeInTheDocument();
      expect(screen.getByTestId("x-circle")).toBeInTheDocument();
    });

    it("should not display error message when error is null", () => {
      render(<PlayerValidationForm {...defaultProps} error={null} />);

      expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
    });
  });

  describe("Success Handling", () => {
    it("should display success message when success is provided", () => {
      render(
        <PlayerValidationForm
          {...defaultProps}
          success="Player validated successfully"
        />
      );

      expect(screen.getByTestId("success-message")).toBeInTheDocument();
      expect(
        screen.getByText("Player validated successfully")
      ).toBeInTheDocument();
      expect(screen.getByTestId("check-circle")).toBeInTheDocument();
    });

    it("should not display success message when success is null", () => {
      render(<PlayerValidationForm {...defaultProps} success={null} />);

      expect(screen.queryByTestId("success-message")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for form fields", () => {
      render(<PlayerValidationForm {...defaultProps} seasonId="14" />);

      expect(screen.getByText("Steam ID")).toBeInTheDocument();
      expect(screen.getByText("Season")).toBeInTheDocument();
    });

    it("should associate labels with inputs", () => {
      render(<PlayerValidationForm {...defaultProps} seasonId="14" />);

      const steamIdInput = screen.getByPlaceholderText("Enter Steam ID");
      expect(steamIdInput).toHaveAttribute("data-testid", "steam-id-input");
    });
  });
});
