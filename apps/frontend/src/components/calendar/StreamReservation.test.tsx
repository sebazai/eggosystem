import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/context/AuthContext";
import { StreamReservation } from "./StreamReservation";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";

// Mock dependencies
jest.mock("@/context/AuthContext");
jest.mock("@/lib/apiClient");
jest.mock("sonner");
jest.mock("@/lib/roleUtils", () => ({
  hasCasterAccess: jest.fn()
}));

// Import the mocked modules
import { hasCasterAccess } from "@/lib/roleUtils";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
  typeof clientApiFetch
>;
const mockToast = toast as jest.Mocked<typeof toast>;
const mockHasCasterAccess = hasCasterAccess as jest.MockedFunction<
  typeof hasCasterAccess
>;

// Mock user with caster role
const mockCasterUser = {
  account_id: 1,
  provider_id: "12345",
  roles: ["caster"],
  nickname: "testcaster",
  provider: "steam" as const,
  acceptedPrivacyPolicy: true,
  acceptedMarketing: false,
  acceptedNewsletter: true,
  isPersonalEmail: false,
  discordLinked: false
};

describe("StreamReservation", () => {
  const mockOnReservationSuccess = jest.fn();
  const defaultProps = {
    matchId: "123",
    onReservationChange: mockOnReservationSuccess
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockCasterUser,
      loading: false,
      checkAuth: jest.fn(),
      refreshAuth: jest.fn(),
      logout: jest.fn()
    });
    mockHasCasterAccess.mockReturnValue(true);
  });

  it("should render reserve button for caster users", () => {
    render(<StreamReservation {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /reserve for streaming/i })
    ).toBeInTheDocument();
  });

  it("should not render button for non-caster users", () => {
    mockHasCasterAccess.mockReturnValue(false);

    render(<StreamReservation {...defaultProps} />);

    expect(
      screen.queryByRole("button", { name: /reserve for streaming/i })
    ).not.toBeInTheDocument();
  });

  it("should open dialog when button is clicked", async () => {
    const user = userEvent.setup();
    mockClientApiFetch.mockResolvedValue({ stream_url: null });

    render(<StreamReservation {...defaultProps} />);

    const reserveButton = screen.getByRole("button", {
      name: /reserve for streaming/i
    });
    await user.click(reserveButton);

    expect(screen.getByText("Reserve Match for Streaming")).toBeInTheDocument();
    expect(screen.getByLabelText("Stream URL")).toBeInTheDocument();
  });

  it("should load and populate default stream URL", async () => {
    const user = userEvent.setup();
    const defaultUrl = "https://twitch.tv/defaultcaster";
    mockClientApiFetch.mockResolvedValue({ stream_url: defaultUrl });

    render(<StreamReservation {...defaultProps} />);

    const reserveButton = screen.getByRole("button", {
      name: /reserve for streaming/i
    });
    await user.click(reserveButton);

    await waitFor(() => {
      const input = screen.getByLabelText("Stream URL") as HTMLInputElement;
      expect(input.value).toBe(defaultUrl);
    });
  });

  it("should successfully reserve a stream", async () => {
    const user = userEvent.setup();
    mockClientApiFetch
      .mockResolvedValueOnce({ stream_url: null }) // Load default URL
      .mockResolvedValueOnce({}); // Reserve stream

    render(<StreamReservation {...defaultProps} />);

    // Open dialog
    const reserveButton = screen.getByRole("button", {
      name: /reserve for streaming/i
    });
    await user.click(reserveButton);

    // Enter stream URL
    const urlInput = screen.getByLabelText("Stream URL");
    await user.type(urlInput, "https://twitch.tv/teststream");

    // Click reserve button
    const reserveStreamButton = screen.getByRole("button", {
      name: /^reserve stream$/i
    });
    await user.click(reserveStreamButton);

    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/matches/123/reserve-cast",
        {
          method: "POST",
          body: JSON.stringify({ stream_url: "https://twitch.tv/teststream" })
        }
      );
    });

    expect(mockToast.success).toHaveBeenCalledWith(
      "Stream reserved successfully!"
    );
    expect(mockOnReservationSuccess).toHaveBeenCalled();
  });

  it("should disable reserve button when URL is empty", async () => {
    const user = userEvent.setup();
    mockClientApiFetch.mockResolvedValue({ stream_url: null });

    render(<StreamReservation {...defaultProps} />);

    // Open dialog
    const reserveButton = screen.getByRole("button", {
      name: /reserve for streaming/i
    });
    await user.click(reserveButton);

    // Wait for dialog to open and default URL to load
    await waitFor(() => {
      expect(screen.getByLabelText("Stream URL")).toBeInTheDocument();
    });

    // Clear URL input to ensure it's empty
    const urlInput = screen.getByLabelText("Stream URL");
    await user.clear(urlInput);

    // Check that reserve button is disabled when URL is empty
    const reserveStreamButton = screen.getByRole("button", {
      name: /^reserve stream$/i
    });

    expect(reserveStreamButton).toBeDisabled();
  });

  it("should handle API errors", async () => {
    const user = userEvent.setup();
    const errorMessage = "Already reserved";
    mockClientApiFetch
      .mockResolvedValueOnce({ stream_url: null })
      .mockRejectedValueOnce(new Error(errorMessage));

    render(<StreamReservation {...defaultProps} />);

    // Open dialog and enter URL
    const reserveButton = screen.getByRole("button", {
      name: /reserve for streaming/i
    });
    await user.click(reserveButton);

    const urlInput = screen.getByLabelText("Stream URL");
    await user.type(urlInput, "https://twitch.tv/teststream");

    const reserveStreamButton = screen.getByRole("button", {
      name: /^reserve stream$/i
    });
    await user.click(reserveStreamButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it("should disable submit button when URL is empty", async () => {
    const user = userEvent.setup();
    mockClientApiFetch.mockResolvedValue({ stream_url: null });

    render(<StreamReservation {...defaultProps} />);

    // Open dialog
    const reserveButton = screen.getByRole("button", {
      name: /reserve for streaming/i
    });
    await user.click(reserveButton);

    const reserveStreamButton = screen.getByRole("button", {
      name: /^reserve stream$/i
    });
    expect(reserveStreamButton).toBeDisabled();

    // Enter URL
    const urlInput = screen.getByLabelText("Stream URL");
    await user.type(urlInput, "https://twitch.tv/teststream");

    expect(reserveStreamButton).not.toBeDisabled();
  });
});
