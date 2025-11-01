import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PreparePlayerForSignupPage from "./page";

// Mock the hooks
jest.mock("@/hooks/data/dashboard/usePreparePlayerForSignup", () => ({
  usePreparePlayerForSignup: jest.fn()
}));

// Mock WithRoleProtection
jest.mock("@/components/dashboard/WithRoleProtection", () => ({
  WithRoleProtection: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="role-protection">{children}</div>
  )
}));

// Mock UI components
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

jest.mock("@/components/ui/alert", () => ({
  Alert: ({
    children,
    className,
    "data-testid": testId
  }: {
    children: React.ReactNode;
    className?: string;
    "data-testid"?: string;
  }) => (
    <div className={className} data-testid={testId}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

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

jest.mock("@/components/ui/input", () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    "data-testid": testId
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    "data-testid"?: string;
  }) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid={testId}
    />
  )
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({
    children,
    htmlFor
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>
}));

import { usePreparePlayerForSignup } from "@/hooks/data/dashboard/usePreparePlayerForSignup";

const mockUsePreparePlayerForSignup =
  usePreparePlayerForSignup as jest.MockedFunction<
    typeof usePreparePlayerForSignup
  >;

describe("PreparePlayerForSignupPage", () => {
  const mockPreparePlayer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePreparePlayerForSignup.mockReturnValue({
      isPreparing: false,
      error: null,
      preparePlayer: mockPreparePlayer,
      clearError: jest.fn()
    });
  });

  it("should show green success alert when changes were made", async () => {
    mockPreparePlayer.mockResolvedValueOnce({
      message: "Player prepared for signup successfully",
      account_id: 2925,
      steam_id: "76561198049745649",
      changes_made: true
    });

    render(<PreparePlayerForSignupPage />);

    const input = screen.getByTestId("steam-id-input");
    const button = screen.getByTestId("prepare-button");

    fireEvent.change(input, { target: { value: "76561198049745649" } });
    fireEvent.click(button);

    await waitFor(() => {
      const alert = screen.getByTestId("success-message");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass("border-green-500");
      expect(alert).toHaveTextContent("Player prepared successfully!");
    });
  });

  it("should show blue info alert when no changes were made", async () => {
    mockPreparePlayer.mockResolvedValueOnce({
      message: "Profile was already valid, no changes were made",
      account_id: 2925,
      steam_id: "76561198049745649",
      changes_made: false
    });

    render(<PreparePlayerForSignupPage />);

    const input = screen.getByTestId("steam-id-input");
    const button = screen.getByTestId("prepare-button");

    fireEvent.change(input, { target: { value: "76561198049745649" } });
    fireEvent.click(button);

    await waitFor(() => {
      const alert = screen.getByTestId("info-message");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass("border-blue-500");
      expect(alert.textContent || "").toContain(
        "Profile was already valid - no changes were made"
      );
      expect(alert.textContent || "").toContain("2925");
      expect(alert.textContent || "").toContain("76561198049745649");
    });
  });

  it("should use changes_made from API response to determine alert style", async () => {
    mockPreparePlayer.mockResolvedValueOnce({
      message: "Player prepared for signup successfully", // API returns this message
      account_id: 2925,
      steam_id: "76561198049745649",
      changes_made: false // But changes_made is false
    });

    render(<PreparePlayerForSignupPage />);

    const input = screen.getByTestId("steam-id-input");
    const button = screen.getByTestId("prepare-button");

    fireEvent.change(input, { target: { value: "76561198049745649" } });
    fireEvent.click(button);

    await waitFor(() => {
      // Should show blue info alert because changes_made is false
      const alert = screen.getByTestId("info-message");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass("border-blue-500");
      expect(alert.textContent || "").toContain(
        "Profile was already valid - no changes were made"
      );
      expect(alert.textContent || "").toContain("2925");
      expect(alert.textContent || "").toContain("76561198049745649");
    });
  });
});
