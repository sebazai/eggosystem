import { screen } from "@testing-library/react";
import { Navigation } from "./Navigation";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import {
  createMockActiveSignupOrSeasonForAppId,
  SeasonPlatform
} from "@eggosystem/types";
import {
  renderWithAuthAndSWR,
  resetMockAuthState
} from "@/test-utils/test-utils";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(() => {
    const { getMockAuthState } = jest.requireActual("@/test-utils/test-utils");
    return getMockAuthState();
  })
}));

jest.mock("@/hooks/data/useActiveSignupOrActiveSeasonForApp");
const mockUseActiveSignupOrActiveSeasonForApp =
  useActiveSignupOrActiveSeasonForApp as jest.MockedFunction<
    typeof useActiveSignupOrActiveSeasonForApp
  >;

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false
}));

jest.mock("./UserMenuDropdown", () => ({
  __esModule: true,
  default: () => <div data-testid="user-menu-dropdown">User Menu</div>
}));

jest.mock("./mobile/MobileUserMenu", () => ({
  MobileUserMenu: ({
    setIsSheetOpen: _setIsSheetOpen
  }: {
    setIsSheetOpen: (open: boolean) => void;
  }) => <div data-testid="mobile-user-menu">Mobile User Menu</div>
}));

function createLiveSeason() {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 30);

  const toDateString = (date: Date) => date.toISOString().split("T")[0]!;

  return createMockActiveSignupOrSeasonForAppId({
    season_id: 17,
    platform: SeasonPlatform.Kanaliiga,
    full_name: "CS2 Season 5",
    signup_end_date: toDateString(futureDate),
    signup_start_date: toDateString(pastDate),
    start_date: toDateString(pastDate),
    end_date: toDateString(futureDate)
  });
}

describe("Navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMockAuthState();
  });

  it("should render the three top-level navigation items", () => {
    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: undefined,
      isLoading: false,
      isError: false,
      isValidating: false
    });

    renderWithAuthAndSWR(<Navigation />);

    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("Season")).toBeInTheDocument();
    expect(screen.getByText("Stats")).toBeInTheDocument();
  });

  it("should label the active season as CS2 Season X", () => {
    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: createLiveSeason(),
      isLoading: false,
      isError: false,
      isValidating: false
    });

    renderWithAuthAndSWR(<Navigation />);

    expect(screen.getByText("CS2 Season 5")).toBeInTheDocument();
    expect(
      screen.getByText("CS2 Season 5").closest("button")
    ).toBeInTheDocument();
  });

  it("should keep Season in the nav when no active season is available", () => {
    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: undefined,
      isLoading: false,
      isError: false,
      isValidating: false
    });

    renderWithAuthAndSWR(<Navigation />);

    expect(screen.getByText("Season")).toBeInTheDocument();
  });

  it("should render register CTA when signup is open during a live season", () => {
    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: createLiveSeason(),
      isLoading: false,
      isError: false,
      isValidating: false
    });

    renderWithAuthAndSWR(<Navigation />);

    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      expect.stringContaining("/seasons/17/signup")
    );
  });

  it("should not render old top-level navigation items", () => {
    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: undefined,
      isLoading: false,
      isError: false,
      isValidating: false
    });

    renderWithAuthAndSWR(<Navigation />);

    expect(screen.queryByText("Organizations")).not.toBeInTheDocument();
    expect(screen.queryByText("Teams")).not.toBeInTheDocument();
    expect(screen.queryByText("Players")).not.toBeInTheDocument();
    expect(screen.queryByText("Matches")).not.toBeInTheDocument();
    expect(screen.queryByText("Leaderboards")).not.toBeInTheDocument();
    expect(screen.queryByText("Kanahautomo")).not.toBeInTheDocument();
  });
});
