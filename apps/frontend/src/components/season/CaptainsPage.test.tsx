import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useAuth } from "@/context/AuthContext";
import { CaptainsPage } from "./CaptainsPage";
import type { UserFullPayload } from "@eggosystem/types";

// Mock the auth context
jest.mock("@/context/AuthContext");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the useSeasonCaptains hook
jest.mock("@/hooks/data/useSeasonCaptains", () => ({
  useSeasonCaptains: jest.fn()
}));

// Mock the role utilities
jest.mock("@/lib/roleUtils", () => ({
  hasCaptainsAccess: jest.fn(),
  getUserHighestRole: jest.fn()
}));

// Import the mocked modules and type them as Jest mocks
import { hasCaptainsAccess, getUserHighestRole } from "@/lib/roleUtils";
import { useSeasonCaptains } from "@/hooks/data/useSeasonCaptains";

// Type the imported modules as Jest mocks
const mockHasCaptainsAccess = hasCaptainsAccess as jest.MockedFunction<
  typeof hasCaptainsAccess
>;
const mockGetUserHighestRole = getUserHighestRole as jest.MockedFunction<
  typeof getUserHighestRole
>;
const mockUseSeasonCaptains = useSeasonCaptains as jest.MockedFunction<
  typeof useSeasonCaptains
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
  const defaultProps = {
    seasonId: "14",
    seasonName: "Season 14"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show access denied for users without required roles", () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, roles: ["player"] },
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });

    mockHasCaptainsAccess.mockReturnValue(false);

    mockUseSeasonCaptains.mockReturnValue({
      captains: undefined,
      isLoading: false,
      isValidating: false,
      isError: undefined
    });

    render(<CaptainsPage {...defaultProps} />);

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

    mockUseSeasonCaptains.mockReturnValue({
      captains: mockCaptains,
      isLoading: false,
      isValidating: false,
      isError: undefined
    });

    render(<CaptainsPage {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Team Captains - Season 14")).toBeInTheDocument();
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

    mockUseSeasonCaptains.mockReturnValue({
      captains: undefined,
      isLoading: false,
      isValidating: false,
      isError: new Error("Failed to load team captains")
    });

    render(<CaptainsPage {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load team captains")
      ).toBeInTheDocument();
    });
  });

  it("should show loading state when data is loading", () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });

    mockHasCaptainsAccess.mockReturnValue(true);

    mockUseSeasonCaptains.mockReturnValue({
      captains: undefined,
      isLoading: true,
      isValidating: false,
      isError: undefined
    });

    render(<CaptainsPage {...defaultProps} />);

    expect(screen.getByText("Loading team captains...")).toBeInTheDocument();
  });

  it("should show empty state when no captains found", async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });

    mockHasCaptainsAccess.mockReturnValue(true);

    mockUseSeasonCaptains.mockReturnValue({
      captains: [],
      isLoading: false,
      isValidating: false,
      isError: undefined
    });

    render(<CaptainsPage {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Team Captains - Season 14")).toBeInTheDocument();
      // The table should be empty but still render
      expect(screen.getByText("Team")).toBeInTheDocument();
      expect(screen.getByText("Captain")).toBeInTheDocument();
      expect(screen.getByText("Co-Captain")).toBeInTheDocument();
    });
  });
});
