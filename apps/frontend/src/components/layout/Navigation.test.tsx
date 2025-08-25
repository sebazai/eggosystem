import { render, screen } from "@testing-library/react";
import { Navigation } from "./Navigation";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import { SeasonPlatform } from "@eggosystem/types";

// Mock the hook
jest.mock("@/hooks/data/useActiveSignupOrActiveSeasonForApp");
const mockUseActiveSignupOrActiveSeasonForApp =
  useActiveSignupOrActiveSeasonForApp as jest.MockedFunction<
    typeof useActiveSignupOrActiveSeasonForApp
  >;

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams()
}));

// Mock the mobile hook
jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false
}));

// Mock the scroll hook
jest.mock("@/hooks/useScrolled", () => ({
  useScrolled: () => false
}));

// Mock UserMenuDropdown to avoid useAuth dependency
jest.mock("./UserMenuDropdown", () => ({
  __esModule: true,
  default: () => <div data-testid="user-menu-dropdown">User Menu</div>
}));

// Mock MobileUserMenu to avoid useAuth dependency
jest.mock("./mobile/MobileUserMenu", () => ({
  MobileUserMenu: ({
    setIsSheetOpen: _setIsSheetOpen
  }: {
    setIsSheetOpen: (open: boolean) => void;
  }) => <div data-testid="mobile-user-menu">Mobile User Menu</div>
}));

describe("Navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render season dropdown menu when season is active", () => {
    // Mock active season data
    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: {
        season_id: 14,
        platform: SeasonPlatform.Kanaliiga,
        full_name: "Season 14",
        signup_end_date: "2024-12-31"
      },
      isLoading: false,
      isError: false,
      isValidating: false
    });

    render(<Navigation />);

    // Check that the season dropdown trigger is rendered (S14)
    expect(screen.getByText("S14")).toBeInTheDocument();

    // Check that the season dropdown is a button (dropdown trigger)
    const seasonDropdown = screen.getByText("S14").closest("button");
    expect(seasonDropdown).toBeInTheDocument();
  });

  it("should render season dropdown with correct structure", () => {
    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: {
        season_id: 14,
        platform: SeasonPlatform.Kanaliiga,
        full_name: "Season 14",
        signup_end_date: "2024-12-31"
      },
      isLoading: false,
      isError: false,
      isValidating: false
    });

    render(<Navigation />);

    // Check that the season dropdown trigger is rendered
    expect(screen.getByText("S14")).toBeInTheDocument();

    // Check that it's a dropdown trigger button
    const seasonDropdown = screen.getByText("S14").closest("button");
    expect(seasonDropdown).toHaveAttribute("aria-expanded", "false");
  });

  it("should not render season menu when no active season", () => {
    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: undefined,
      isLoading: false,
      isError: false,
      isValidating: false
    });

    render(<Navigation />);

    // Season menu should not be rendered
    expect(screen.queryByText("S14")).not.toBeInTheDocument();
  });

  it("should render basic navigation structure", () => {
    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: undefined,
      isLoading: false,
      isError: false,
      isValidating: false
    });

    render(<Navigation />);

    // Check that basic navigation items are rendered
    expect(screen.getByText("Organizations")).toBeInTheDocument();
    expect(screen.getByText("Teams")).toBeInTheDocument();
    expect(screen.getByText("Players")).toBeInTheDocument();
    expect(screen.getByText("Matches")).toBeInTheDocument();
    expect(screen.getByText("Leaderboards")).toBeInTheDocument();
    expect(screen.getByText("Kanahautomo")).toBeInTheDocument();
  });

  it("should render season menu when season is active and signup is open", () => {
    // Mock active season with future signup end date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

    mockUseActiveSignupOrActiveSeasonForApp.mockReturnValue({
      signupOrActiveSeason: {
        season_id: 14,
        platform: SeasonPlatform.Kanaliiga,
        full_name: "Season 14",
        signup_end_date: futureDate.toISOString().split("T")[0] || null
      },
      isLoading: false,
      isError: false,
      isValidating: false
    });

    render(<Navigation />);

    // Check that the season dropdown is rendered
    expect(screen.getByText("S14")).toBeInTheDocument();

    // Check that it's a dropdown trigger
    const seasonDropdown = screen.getByText("S14").closest("button");
    expect(seasonDropdown).toBeInTheDocument();
  });
});
