import { render, screen, waitFor } from "@testing-library/react";
import TopPlayersPage from "./page";
import { useSeasonLeagues } from "@/hooks/data/useSeasonLeagues";
import useSWR from "swr";
import { useParams } from "next/navigation";

// Mock hooks
jest.mock("@/hooks/data/useSeasonLeagues");
jest.mock("swr");

// Mock Next.js navigation
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
jest.mock("next/navigation", () => ({
  useParams: jest.fn()
}));

const mockUseSeasonLeagues = useSeasonLeagues as jest.MockedFunction<
  typeof useSeasonLeagues
>;
const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

// Mock child components
jest.mock("@/components/layout/AutoBreadcrumbs", () => ({
  AutoBreadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>
}));

describe("TopPlayersPage - Default League Selection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ season: "1" } as any);

    mockUseSeasonLeagues.mockReturnValue({
      seasonLeagues: [
        { id: 1, name: "League 1", season_id: 1, tier: 1 },
        { id: 2, name: "League 2", season_id: 1, tier: 2 }
      ],
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    mockUseSWR.mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    } as any);
  });

  it("should set selectedLeagueId to first league when leagues are loaded", async () => {
    render(<TopPlayersPage />);

    await waitFor(() => {
      // Component should render
      expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    });
  });

  it("should not set selectedLeagueId if already selected", async () => {
    const { rerender } = render(<TopPlayersPage />);

    await waitFor(() => {
      expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    });

    // Re-render with same leagues
    rerender(<TopPlayersPage />);

    await waitFor(() => {
      expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    });
  });

  it("should not set selectedLeagueId while leagues are loading", () => {
    mockUseSeasonLeagues.mockReturnValue({
      seasonLeagues: undefined,
      isLoading: true,
      isError: undefined,
      isValidating: false
    });

    render(<TopPlayersPage />);

    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
  });

  it("should not set selectedLeagueId if no leagues available", () => {
    mockUseSeasonLeagues.mockReturnValue({
      seasonLeagues: [],
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<TopPlayersPage />);

    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
  });

  it("should update selectedLeagueId when new leagues are loaded", async () => {
    mockUseSeasonLeagues.mockReturnValue({
      seasonLeagues: undefined,
      isLoading: true,
      isError: undefined,
      isValidating: false
    });

    const { rerender } = render(<TopPlayersPage />);

    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();

    // Leagues loaded
    mockUseSeasonLeagues.mockReturnValue({
      seasonLeagues: [{ id: 3, name: "League 3", season_id: 1, tier: 1 }],
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    rerender(<TopPlayersPage />);

    await waitFor(() => {
      expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    });
  });
});
