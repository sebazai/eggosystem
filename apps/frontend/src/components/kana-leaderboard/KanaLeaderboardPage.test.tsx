import { render, screen, fireEvent } from "@testing-library/react";
import type { KanaLeaderboardEntry } from "@eggosystem/types";
import { KanaLeaderboardPage } from "@/components/kana-leaderboard/KanaLeaderboardPage";
import { useKanaLeaderboard } from "@/hooks/data/useKanaLeaderboard";
import { useAuth } from "@/context/AuthContext";

jest.mock("@/hooks/data/useKanaLeaderboard", () => ({
  useKanaLeaderboard: jest.fn()
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn()
}));

const mockUseKanaLeaderboard = useKanaLeaderboard as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

const buildEntry = (
  overrides: Partial<KanaLeaderboardEntry> = {}
): KanaLeaderboardEntry => ({
  position: 1,
  steam_id: "76561198000000001",
  nickname: "RoosterOne",
  kana_elo: 2400,
  rank: "TOP_COCK",
  subrank: 1,
  profile_url: "https://steamcommunity.com/profiles/76561198000000001",
  ...overrides
});

describe("KanaLeaderboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
  });

  it("renders the heading", () => {
    mockUseKanaLeaderboard.mockReturnValue({
      entries: [buildEntry()],
      isLoading: false,
      isValidating: false,
      isError: undefined,
      retry: jest.fn()
    });

    render(<KanaLeaderboardPage />);
    expect(
      screen.getByRole("heading", { name: "Kana Elo Leaderboard" })
    ).toBeInTheDocument();
  });

  it("shows a loading skeleton while fetching", () => {
    mockUseKanaLeaderboard.mockReturnValue({
      entries: undefined,
      isLoading: true,
      isValidating: false,
      isError: undefined,
      retry: jest.fn()
    });

    render(<KanaLeaderboardPage />);
    expect(
      document.querySelector('[class*="animate-pulse"]')
    ).toBeInTheDocument();
  });

  it("shows a retry button on error and calls retry when clicked", () => {
    const retry = jest.fn();
    mockUseKanaLeaderboard.mockReturnValue({
      entries: undefined,
      isLoading: false,
      isValidating: false,
      isError: new Error("boom"),
      retry
    });

    render(<KanaLeaderboardPage />);
    expect(
      screen.getByText("Failed to load the kana leaderboard.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("renders an empty-state message when no player matches the tier", () => {
    mockUseKanaLeaderboard.mockReturnValue({
      entries: [],
      isLoading: false,
      isValidating: false,
      isError: undefined,
      retry: jest.fn()
    });

    render(<KanaLeaderboardPage />);
    expect(
      screen.getByText("No top-50 player is currently in this tier.")
    ).toBeInTheDocument();
  });

  it("renders rows with global position, nickname, elo and a profile link", () => {
    mockUseKanaLeaderboard.mockReturnValue({
      entries: [
        buildEntry({ position: 7, nickname: "RoosterOne", kana_elo: 2400 })
      ],
      isLoading: false,
      isValidating: false,
      isError: undefined,
      retry: jest.fn()
    });

    render(<KanaLeaderboardPage />);
    expect(screen.getByText("#7")).toBeInTheDocument();
    expect(screen.getByText("2,400")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "RoosterOne" });
    expect(link).toHaveAttribute("href", "/players/76561198000000001");
  });

  it("highlights the logged-in user's row with a You badge", () => {
    mockUseAuth.mockReturnValue({
      user: { provider_id: "76561198000000002" }
    });
    mockUseKanaLeaderboard.mockReturnValue({
      entries: [
        buildEntry({ steam_id: "76561198000000001", nickname: "RoosterOne" }),
        buildEntry({
          position: 2,
          steam_id: "76561198000000002",
          nickname: "MyselfChicken"
        })
      ],
      isLoading: false,
      isValidating: false,
      isError: undefined,
      retry: jest.fn()
    });

    render(<KanaLeaderboardPage />);
    expect(screen.getByText("You")).toBeInTheDocument();
  });
});
