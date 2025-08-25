import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useAuth } from "@/context/AuthContext";
import CaptainsPage from "./page";
import type { UserFullPayload } from "@eggosystem/types";

// Mock the auth context
jest.mock("@/context/AuthContext");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the API client
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn()
}));

// Mock the role utilities
jest.mock("@/lib/roleUtils", () => ({
  hasCaptainsAccess: jest.fn(),
  getUserHighestRole: jest.fn()
}));

// Import the mocked modules and type them as Jest mocks
import { hasCaptainsAccess, getUserHighestRole } from "@/lib/roleUtils";
import { clientApiFetch } from "@/lib/apiClient";

// Type the imported modules as Jest mocks
const mockHasCaptainsAccess = hasCaptainsAccess as jest.MockedFunction<
  typeof hasCaptainsAccess
>;
const mockGetUserHighestRole = getUserHighestRole as jest.MockedFunction<
  typeof getUserHighestRole
>;
const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
  typeof clientApiFetch
>;

// Mock the layout components
jest.mock("@/components/layout/ContentContainer", () => ({
  ContentContainer: ({
    children,
    classNames
  }: {
    children: React.ReactNode;
    classNames?: string;
  }) => <div className={classNames}>{children}</div>
}));

jest.mock("@/components/layout/CardContainer", () => ({
  CardContainer: ({
    children,
    classNames
  }: {
    children: React.ReactNode;
    classNames?: string;
  }) => <div className={classNames}>{children}</div>
}));

const mockUser: UserFullPayload = {
  account_id: 1,
  provider_id: "123",
  roles: ["admin"],
  nickname: "testuser",
  provider: "steam",
  acceptedPrivacyPolicy: true,
  acceptedMarketing: false,
  isPersonalEmail: false,
  discordLinked: false
};

const mockCaptains = [
  {
    team_id: 1,
    team_name: "Team Alpha",
    captain_discord: "captain1#1234",
    co_captain_discord: "co1#5678"
  },
  {
    team_id: 2,
    team_name: "Team Beta",
    captain_discord: "captain2#1234",
    co_captain_discord: null
  }
];

describe("CaptainsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show loading state initially", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });

    render(<CaptainsPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should show access denied for users without required roles", () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, roles: ["player"] },
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });

    mockHasCaptainsAccess.mockReturnValue(false);

    render(<CaptainsPage />);

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(
      screen.getByText("You don't have permission to view this page.")
    ).toBeInTheDocument();
    expect(screen.getByText("Your current roles: player")).toBeInTheDocument();
  });

  it("should show captains table for users with required roles", async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });

    mockHasCaptainsAccess.mockReturnValue(true);
    mockGetUserHighestRole.mockReturnValue("admin");

    mockClientApiFetch.mockResolvedValue(mockCaptains);

    render(<CaptainsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Team Captains - Active Season")
      ).toBeInTheDocument();
      expect(screen.getByText("Access granted as:")).toBeInTheDocument();
      expect(screen.getByText("admin")).toBeInTheDocument();
      expect(screen.getByText("Team Alpha")).toBeInTheDocument();
      expect(screen.getByText("Team Beta")).toBeInTheDocument();
      expect(screen.getByText("captain1#1234")).toBeInTheDocument();
      expect(screen.getByText("co1#5678")).toBeInTheDocument();
      expect(screen.getByText("captain2#1234")).toBeInTheDocument();
      expect(screen.getByText("Not set")).toBeInTheDocument();
    });
  });

  it("should show error state when API call fails", async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });

    mockHasCaptainsAccess.mockReturnValue(true);

    mockClientApiFetch.mockRejectedValue(new Error("API Error"));

    render(<CaptainsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load team captains")
      ).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });
  });

  it("should show empty state when no captains found", async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });

    mockHasCaptainsAccess.mockReturnValue(true);

    mockClientApiFetch.mockResolvedValue([]);

    render(<CaptainsPage />);

    await waitFor(() => {
      expect(screen.getByText("No team captains found.")).toBeInTheDocument();
    });
  });
});
