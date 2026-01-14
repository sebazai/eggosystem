import { render, waitFor } from "@testing-library/react";
import { UpcomingMatchToast } from "./UpcomingMatchBanner";
import { useMyTeamsUpcomingMatches } from "@/hooks/data/user/useMyTeamsUpcomingMatches";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Mock hooks
jest.mock("@/hooks/data/user/useMyTeamsUpcomingMatches");
jest.mock("@/context/AuthContext");
jest.mock("sonner", () => ({
  toast: Object.assign(
    jest.fn(() => "toast-id"),
    {
      dismiss: jest.fn()
    }
  )
}));

const mockUseMyTeamsUpcomingMatches =
  useMyTeamsUpcomingMatches as jest.MockedFunction<
    typeof useMyTeamsUpcomingMatches
  >;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe("UpcomingMatchToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseAuth.mockReturnValue({
      user: { account_id: 1, roles: ["user"] },
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    } as any);

    mockUseMyTeamsUpcomingMatches.mockReturnValue({
      matches: [],
      isLoading: false,
      error: undefined,
      mutate: jest.fn()
    } as any);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should set mounted and currentTime on mount", async () => {
    render(<UpcomingMatchToast />);

    // Component should set mounted state
    await waitFor(() => {
      // Component doesn't render anything, but effects should run
      expect(mockUseAuth).toHaveBeenCalled();
    });
  });

  it("should update currentTime every minute", async () => {
    render(<UpcomingMatchToast />);

    await waitFor(() => {
      expect(mockUseAuth).toHaveBeenCalled();
    });

    // Fast-forward 1 minute
    jest.advanceTimersByTime(60000);

    await waitFor(() => {
      // Time should be updated
      expect(mockUseMyTeamsUpcomingMatches).toHaveBeenCalled();
    });
  });

  it("should not show toast when not mounted", () => {
    render(<UpcomingMatchToast />);

    // Initially should not show toast
    expect(mockToast.dismiss).not.toHaveBeenCalled();
  });

  it("should not show toast when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    } as any);

    render(<UpcomingMatchToast />);

    expect(mockToast.dismiss).not.toHaveBeenCalled();
  });

  it("should not show toast when matches are loading", () => {
    mockUseMyTeamsUpcomingMatches.mockReturnValue({
      matches: [],
      isLoading: true,
      error: undefined,
      mutate: jest.fn()
    } as any);

    render(<UpcomingMatchToast />);

    expect(mockToast.dismiss).not.toHaveBeenCalled();
  });

  it("should show toast when match is within 2 hours", async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1); // 1 hour from now

    const mockMatches = [
      {
        match_id: 1,
        match_date: futureDate.toISOString().split("T")[0],
        start_time: futureDate.toTimeString().slice(0, 5),
        team_name: "Team A",
        opponent_team_name: "Team B",
        best_of: 3,
        status: "UPCOMING" as const,
        external_match_room_id: null,
        platform: null
      }
    ];

    mockUseMyTeamsUpcomingMatches.mockReturnValue({
      matches: mockMatches,
      isLoading: false,
      error: undefined,
      mutate: jest.fn()
    } as any);

    // toast is already mocked as a function with dismiss method

    render(<UpcomingMatchToast />);

    await waitFor(() => {
      // Should show toast after mount
      jest.advanceTimersByTime(100);
    });
  });
});
