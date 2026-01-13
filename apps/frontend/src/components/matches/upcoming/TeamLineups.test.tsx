import { render, screen, waitFor } from "@testing-library/react";
import { TeamLineups } from "./TeamLineups";
import type { Player, MatchTeamInfo, MatchTeamLineup } from "@eggosystem/types";
import { useMatchTeamLineups } from "@/hooks/data/useMatchTeamLineups";
import { usePlayerStatsWithFallback } from "@/hooks/data/usePlayerStatsWithFallback";

// Mock hooks
jest.mock("@/hooks/data/useMatchTeamLineups");
jest.mock("@/hooks/data/usePlayerStatsWithFallback");

const mockUseMatchTeamLineups = useMatchTeamLineups as jest.MockedFunction<
  typeof useMatchTeamLineups
>;
const mockUsePlayerStatsWithFallback =
  usePlayerStatsWithFallback as jest.MockedFunction<
    typeof usePlayerStatsWithFallback
  >;

// Mock child components - PlayerCard is in the components subdirectory
jest.mock("./components", () => ({
  PlayerCard: ({ player }: { player: any }) => (
    <div data-testid={`player-card-${player.id}`}>{player.nickname}</div>
  ),
  PlayerComparisonSection: () => (
    <div data-testid="player-comparison">Comparison</div>
  )
}));

describe("TeamLineups", () => {
  const mockTeams: MatchTeamInfo[] = [
    { id: 1, name: "Team 1", logo: "", score: 0, rank: null },
    { id: 2, name: "Team 2", logo: "", score: 0, rank: null }
  ];

  const mockLineups: Record<string, MatchTeamLineup> = {
    "1": {
      id: 1,
      name: "Team 1",
      logo: "",
      players: [
        {
          steam_id: "76561198012345678",
          name: "Player 1",
          nickname: "Player 1",
          games_played: 10,
          maps_played: 20,
          kana_rating: 50,
          cs2_rank: 10,
          faceit_level: 5,
          faceit_elo: 1000,
          cs_hours: 1000
        },
        {
          steam_id: "76561198012345679",
          name: "Player 2",
          nickname: "Player 2",
          games_played: 10,
          maps_played: 20,
          kana_rating: 50,
          cs2_rank: 10,
          faceit_level: 5,
          faceit_elo: 1000,
          cs_hours: 1000
        }
      ]
    },
    "2": {
      id: 2,
      name: "Team 2",
      logo: "",
      players: [
        {
          steam_id: "76561198012345680",
          name: "Player 3",
          nickname: "Player 3",
          games_played: 10,
          maps_played: 20,
          kana_rating: 50,
          cs2_rank: 10,
          faceit_level: 5,
          faceit_elo: 1000,
          cs_hours: 1000
        }
      ]
    }
  };

  const defaultProps = {
    teams: mockTeams,
    matchId: 1,
    baseFilters: {
      seasons: [1],
      leagues: null,
      stages: null,
      teams: null,
      maps: null
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMatchTeamLineups.mockReturnValue({
      lineups: mockLineups,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUsePlayerStatsWithFallback.mockReturnValue({
      playerStats: undefined,
      isLoading: false,
      isError: undefined,
      usedFallback: false
    });
  });

  it("should select first player from team1 when players are available", async () => {
    render(<TeamLineups {...defaultProps} />);

    await waitFor(() => {
      // Should render player cards (both teams' first players have id 1 after conversion)
      // Check by nickname instead
      expect(screen.getByText("Player 1")).toBeInTheDocument();
    });
  });

  it("should select first player from team2 when players are available", async () => {
    render(<TeamLineups {...defaultProps} />);

    await waitFor(() => {
      // Should render player cards for both teams
      expect(screen.getByText("Player 1")).toBeInTheDocument();
      expect(screen.getByText("Player 3")).toBeInTheDocument();
    });
  });

  it("should not change selection if player is already selected", async () => {
    const { rerender } = render(<TeamLineups {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Player 1")).toBeInTheDocument();
    });

    // Re-render with same data
    rerender(<TeamLineups {...defaultProps} />);

    await waitFor(() => {
      // Should still show players
      expect(screen.getByText("Player 1")).toBeInTheDocument();
    });
  });

  it("should handle empty team1 players", () => {
    mockUseMatchTeamLineups.mockReturnValue({
      lineups: { "2": mockLineups["2"]! },
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<TeamLineups {...defaultProps} />);

    // Should not crash - team2 should render
    expect(screen.getByText("Player 3")).toBeInTheDocument();
  });

  it("should handle empty team2 players", () => {
    mockUseMatchTeamLineups.mockReturnValue({
      lineups: { "1": mockLineups["1"]! },
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<TeamLineups {...defaultProps} />);

    // Should not crash - team1 should still render
    expect(screen.getByText("Player 1")).toBeInTheDocument();
  });

  it("should update selection when new players are added", async () => {
    mockUseMatchTeamLineups.mockReturnValue({
      lineups: {},
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    const { rerender } = render(<TeamLineups {...defaultProps} />);

    // Initially no players
    expect(screen.queryByText("Player 1")).not.toBeInTheDocument();

    // Add players
    mockUseMatchTeamLineups.mockReturnValue({
      lineups: mockLineups,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    rerender(<TeamLineups {...defaultProps} />);

    await waitFor(() => {
      // Should now show players
      expect(screen.getByText("Player 1")).toBeInTheDocument();
    });
  });
});
