/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  VerifyEmailSuccessButton,
  VerifyEmailErrorButton
} from "../../app/(main)/(content-container)/verify-email/verify-email-buton";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn()
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn()
  }
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe("VerifyEmailSuccessButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    });
  });

  it("should render button with correct text", () => {
    render(<VerifyEmailSuccessButton />);

    const button = screen.getByRole("button", { name: "Go to Home" });
    expect(button).toBeInTheDocument();
  });

  it("should call router.push when clicked", () => {
    render(<VerifyEmailSuccessButton />);

    const button = screen.getByRole("button", { name: "Go to Home" });
    button.click();

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("should show success toast when showSuccessToast is true", () => {
    render(<VerifyEmailSuccessButton showSuccessToast={true} />);

    expect(mockToast.success).toHaveBeenCalledWith(
      "Email verified successfully!"
    );
  });

  it("should not show success toast when showSuccessToast is false", () => {
    render(<VerifyEmailSuccessButton showSuccessToast={false} />);

    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it("should not show success toast when showSuccessToast is undefined", () => {
    render(<VerifyEmailSuccessButton />);

    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it("should have correct CSS classes", () => {
    render(<VerifyEmailSuccessButton />);

    const button = screen.getByRole("button", { name: "Go to Home" });
    expect(button).toHaveClass(
      "px-4",
      "py-2",
      "bg-kanaliiga-orange",
      "rounded-md",
      "cursor-pointer"
    );
  });
});

describe("VerifyEmailErrorButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    });
  });

  it("should render button with correct text", () => {
    render(<VerifyEmailErrorButton />);

    const button = screen.getByRole("button", { name: "Edit your Email" });
    expect(button).toBeInTheDocument();
  });

  it("should call router.push to profile when clicked", () => {
    render(<VerifyEmailErrorButton />);

    const button = screen.getByRole("button", { name: "Edit your Email" });
    button.click();

    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it("should have correct CSS classes", () => {
    render(<VerifyEmailErrorButton />);

    const button = screen.getByRole("button", { name: "Edit your Email" });
    expect(button).toHaveClass(
      "px-4",
      "py-2",
      "bg-kanaliiga-orange",
      "rounded-md",
      "cursor-pointer"
    );
  });
});
