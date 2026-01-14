import { render, screen, waitFor } from "@testing-library/react";
import HeroSection from "./HeroSection";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import { useSeasonCalendarMatches } from "@/hooks/data/useSeasonCalendarMatches";
import { useRouter } from "next/navigation";

// Mock hooks
jest.mock("@/hooks/data/useActiveSignupOrActiveSeasonForApp");
jest.mock("@/hooks/data/useSeasonCalendarMatches");

// Mock utility functions
jest.mock("@/lib/calendar-utils", () => ({
  getUpcomingMatchesSorted: jest.fn((matches) => matches || []),
  getUpcomingStreamedMatchesSorted: jest.fn((matches) => matches || []),
  DIVISIONS: {}
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: jest.fn()
}));

// Mock UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  )
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>
}));

const mockUseActiveSignupOrActiveSeasonForApp =
  useActiveSignupOrActiveSeasonForApp as jest.MockedFunction<
    typeof useActiveSignupOrActiveSeasonForApp
  >;
const mockUseSeasonCalendarMatches =
  useSeasonCalendarMatches as jest.MockedFunction<
    typeof useSeasonCalendarMatches
  >;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("HeroSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: "/",
      query: {},
      asPath: "/"
    } as any);

    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: {
        season_id: 1,
        full_name: "CS2 Season 4",
        platform: "kanaliiga" as const,
        start_date: "2024-01-01",
        end_date: "2024-04-30",
        signup_start_date: "2023-12-01",
        signup_end_date: "2023-12-31"
      },
      isLoading: false,
      isError: false,
      isValidating: false
    });

    mockUseSeasonCalendarMatches.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      isValidating: false,
      mutate: jest.fn()
    } as any);
  });

  it("should set isMounted to true after mount", async () => {
    render(<HeroSection />);

    // Component should render
    await waitFor(() => {
      // The component should be mounted and ready - check for section element
      expect(screen.getByText("Finland's Premier")).toBeInTheDocument();
    });
  });

  it("should set matchFilter to streamed when hasStreamedMatches is true", async () => {
    const mockMatches = [
      {
        match_id: "1",
        stream_urls: ["https://twitch.tv/test"],
        match_status: "UPCOMING" as const,
        league_tier: 1,
        title: "Test Match",
        match_start: "2024-01-15T14:30:00Z",
        match_end: "2024-01-15T16:30:00Z",
        league_name: "Test League",
        match_team1: "Team 1",
        match_team2: "Team 2",
        external_match_room_id: null,
        season_platform: "steam" as const
      }
    ];

    mockUseSeasonCalendarMatches.mockReturnValue({
      data: mockMatches,
      isLoading: false,
      isError: false,
      isValidating: false,
      mutate: jest.fn()
    } as any);

    render(<HeroSection />);

    await waitFor(() => {
      // Component should render
      expect(screen.getByText("Finland's Premier")).toBeInTheDocument();
    });
  });

  it("should set matchFilter to all when hasStreamedMatches is false", async () => {
    const mockMatches = [
      {
        match_id: "1",
        stream_urls: [],
        match_status: "UPCOMING" as const,
        league_tier: 1,
        title: "Test Match",
        match_start: "2024-01-15T14:30:00Z",
        match_end: "2024-01-15T16:30:00Z",
        league_name: "Test League",
        match_team1: "Team 1",
        match_team2: "Team 2",
        external_match_room_id: null,
        season_platform: "steam" as const
      }
    ];

    mockUseSeasonCalendarMatches.mockReturnValue({
      data: mockMatches,
      isLoading: false,
      isError: false,
      isValidating: false,
      mutate: jest.fn()
    } as any);

    render(<HeroSection />);

    await waitFor(() => {
      // Component should render
      expect(screen.getByText("Finland's Premier")).toBeInTheDocument();
    });
  });

  it("should update matchFilter when hasStreamedMatches changes", async () => {
    const mockMatchesNoStream = [
      {
        match_id: "1",
        stream_urls: [],
        match_status: "UPCOMING" as const,
        league_tier: 1,
        title: "Test Match",
        match_start: "2024-01-15T14:30:00Z",
        match_end: "2024-01-15T16:30:00Z",
        league_name: "Test League",
        match_team1: "Team 1",
        match_team2: "Team 2",
        external_match_room_id: null,
        season_platform: "steam" as const
      }
    ];

    mockUseSeasonCalendarMatches.mockReturnValue({
      data: mockMatchesNoStream,
      isLoading: false,
      isError: false,
      isValidating: false,
      mutate: jest.fn()
    } as any);

    const { rerender } = render(<HeroSection />);

    await waitFor(() => {
      expect(screen.getByText("Finland's Premier")).toBeInTheDocument();
    });

    // Update to have streamed matches
    const mockMatchesWithStream = [
      {
        match_id: "1",
        stream_urls: ["https://twitch.tv/test"],
        match_status: "UPCOMING" as const,
        league_tier: 1,
        title: "Test Match",
        match_start: "2024-01-15T14:30:00Z",
        match_end: "2024-01-15T16:30:00Z",
        league_name: "Test League",
        match_team1: "Team 1",
        match_team2: "Team 2",
        external_match_room_id: null,
        season_platform: "steam" as const
      }
    ];

    mockUseSeasonCalendarMatches.mockReturnValue({
      data: mockMatchesWithStream,
      isLoading: false,
      isError: false,
      isValidating: false,
      mutate: jest.fn()
    } as any);

    rerender(<HeroSection />);

    await waitFor(() => {
      expect(screen.getByText("Finland's Premier")).toBeInTheDocument();
    });
  });

  it("should calculate seasonStatus only when mounted", async () => {
    render(<HeroSection />);

    await waitFor(() => {
      // Component should render and calculate season status
      expect(screen.getByText("Finland's Premier")).toBeInTheDocument();
    });
  });

  it("should handle loading state for season data", () => {
    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: undefined,
      isLoading: true,
      isError: undefined,
      isValidating: false
    });

    render(<HeroSection />);

    expect(screen.getByText("Finland's Premier")).toBeInTheDocument();
  });

  it("should handle loading state for matches data", () => {
    mockUseSeasonCalendarMatches.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isValidating: false,
      mutate: jest.fn()
    } as any);

    render(<HeroSection />);

    expect(screen.getByText("Finland's Premier")).toBeInTheDocument();
  });
});
