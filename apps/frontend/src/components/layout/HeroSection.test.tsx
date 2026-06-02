import { render, screen, waitFor } from "@testing-library/react";
import HeroSection from "./HeroSection";
import { useLandingSeasonContext } from "@/hooks/data/useLandingSeasonContext";
import { useSeasonCalendarMatches } from "@/hooks/data/useSeasonCalendarMatches";
import { useSeasonResultsSeasons } from "@/hooks/data/useSeasonResults";
import { useRouter } from "next/navigation";

jest.mock("@/hooks/data/useLandingSeasonContext");
jest.mock("@/hooks/data/useSeasonCalendarMatches");
jest.mock("@/hooks/data/useSeasonResults", () => ({
  useSeasonResults: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    error: undefined,
    isValidating: false
  })),
  useSeasonResultsSeasons: jest.fn(() => ({
    seasons: [],
    isLoading: false,
    isValidating: false,
    error: undefined
  }))
}));
jest.mock("@/components/landing/SeasonHighlightsPanel", () => ({
  SeasonHighlightsPanel: () => <div>Season Highlights Panel</div>
}));

jest.mock("@/lib/calendar-utils", () => ({
  getUpcomingMatchesSorted: jest.fn((matches) => matches || []),
  getUpcomingStreamedMatchesSorted: jest.fn((matches) => matches || []),
  DIVISIONS: {}
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: jest.fn()
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, asChild }: any) =>
    asChild ? (
      children
    ) : (
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

const mockUseLandingSeasonContext =
  useLandingSeasonContext as jest.MockedFunction<typeof useLandingSeasonContext>;
const mockUseSeasonCalendarMatches =
  useSeasonCalendarMatches as jest.MockedFunction<
    typeof useSeasonCalendarMatches
  >;
const mockUseSeasonResultsSeasons =
  useSeasonResultsSeasons as jest.MockedFunction<typeof useSeasonResultsSeasons>;
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

    mockUseLandingSeasonContext.mockReturnValue({
      signupOrActiveSeason: {
        season_id: 17,
        full_name: "CS2 Season 5",
        platform: "faceit" as const,
        start_date: "2026-01-16",
        end_date: "2026-05-26",
        signup_start_date: "2025-12-21T16:00:00.000Z",
        signup_end_date: "2026-01-13T18:40:00.000Z"
      },
      seasonPhase: {
        phase: "live",
        seasonNumber: "5",
        seasonName: "CS2 Season 5"
      },
      referenceSeasonId: 17,
      isLoading: false,
      isError: false,
      isValidating: false
    });

    mockUseSeasonResultsSeasons.mockReturnValue({
      seasons: [
        {
          season_id: 17,
          season_name: "CS2 Season 5"
        }
      ],
      isLoading: false,
      isValidating: false,
      error: undefined
    });

    mockUseSeasonCalendarMatches.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      isValidating: false,
      mutate: jest.fn()
    } as any);
  });

  it("renders the live season hero", async () => {
    render(<HeroSection />);

    await waitFor(() => {
      expect(screen.getByText("Finland's Premier")).toBeInTheDocument();
      expect(screen.getByText("Upcoming Matches")).toBeInTheDocument();
      expect(screen.getByText("View Match Calendar")).toBeInTheDocument();
    });
  });

  it("renders the concluded season hero", async () => {
    mockUseLandingSeasonContext.mockReturnValue({
      signupOrActiveSeason: undefined,
      seasonPhase: {
        phase: "concluded",
        seasonNumber: null,
        seasonName: null
      },
      referenceSeasonId: 17,
      isLoading: false,
      isError: false,
      isValidating: false
    });

    render(<HeroSection />);

    await waitFor(() => {
      expect(screen.getByText("CS2 Season 5 Concluded")).toBeInTheDocument();
      expect(screen.getByText("View Season Results")).toBeInTheDocument();
      expect(screen.getByText("Season Highlights Panel")).toBeInTheDocument();
      expect(screen.queryByText("View Match Calendar")).not.toBeInTheDocument();
    });
  });

  it("handles loading state for matches data", () => {
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
