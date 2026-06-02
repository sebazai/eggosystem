import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { KANA_TIERS } from "@eggosystem/types";
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

// Mock the Select component so the dropdown options render as plain DOM
// (Radix Select uses a portal + pointer-capture APIs jsdom does not implement).
// `onValueChange` is wired to a button per item so a test can "select" a tier.
jest.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange
  }: {
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
  }) => (
    <div
      data-testid="kana-tier-select"
      data-on-value-change-attached={onValueChange ? "true" : "false"}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{
                onValueChange?: (value: string) => void;
              }>,
              { onValueChange }
            )
          : child
      )}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <div>{placeholder}</div>
  ),
  SelectContent: ({
    children,
    onValueChange
  }: {
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
  }) => (
    <div>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{
                onValueChange?: (value: string) => void;
              }>,
              { onValueChange }
            )
          : child
      )}
    </div>
  ),
  SelectGroup: ({
    children,
    onValueChange
  }: {
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
  }) => (
    <div>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{
                onValueChange?: (value: string) => void;
              }>,
              { onValueChange }
            )
          : child
      )}
    </div>
  ),
  SelectLabel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    children,
    value,
    onValueChange
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange?: (value: string) => void;
  }) => (
    <button
      type="button"
      role="option"
      aria-selected={false}
      data-value={value}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  )
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

  it("renders every kana tier option in the dropdown", () => {
    mockUseKanaLeaderboard.mockReturnValue({
      entries: [buildEntry()],
      isLoading: false,
      isValidating: false,
      isError: undefined,
      retry: jest.fn()
    });

    render(<KanaLeaderboardPage />);

    const optionValues = screen
      .getAllByRole("option")
      .map((option) => option.getAttribute("data-value"));

    // All 17 tier values (sub-ranks COCK_1..EGG_3 and the broad groupings
    // EGG, CHICK, CHICKEN, COCK, TOP_COCK) must be selectable.
    expect(optionValues).toHaveLength(KANA_TIERS.length);
    for (const tier of KANA_TIERS) {
      expect(optionValues).toContain(tier);
    }
  });

  it("re-fetches with the chosen tier when a different option is selected", () => {
    mockUseKanaLeaderboard.mockReturnValue({
      entries: [buildEntry()],
      isLoading: false,
      isValidating: false,
      isError: undefined,
      retry: jest.fn()
    });

    render(<KanaLeaderboardPage />);

    // Default tier on first render.
    expect(mockUseKanaLeaderboard).toHaveBeenLastCalledWith("TOP_COCK");

    const cock1Option = screen
      .getAllByRole("option")
      .find((option) => option.getAttribute("data-value") === "COCK_1");
    expect(cock1Option).toBeDefined();

    fireEvent.click(cock1Option as HTMLElement);

    expect(mockUseKanaLeaderboard).toHaveBeenLastCalledWith("COCK_1");
  });

  it("keeps onValueChange wired to the tier Select", () => {
    mockUseKanaLeaderboard.mockReturnValue({
      entries: [buildEntry()],
      isLoading: false,
      isValidating: false,
      isError: undefined,
      retry: jest.fn()
    });

    render(<KanaLeaderboardPage />);

    expect(screen.getByTestId("kana-tier-select")).toHaveAttribute(
      "data-on-value-change-attached",
      "true"
    );
  });
});
