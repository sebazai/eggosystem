import { render, screen, waitFor } from "@testing-library/react";
import { MatchStats } from "./MatchStats";
import type { MatchInfo } from "@eggosystem/types";
import { MatchStatus, SeasonPlatform } from "@eggosystem/types";
import { useMatchPlayerStats } from "@/hooks/data/useMatchPlayerStats";
import { useMatchTopPlayers } from "@/hooks/data/useMatchTopPlayers";

// Mock the hooks
jest.mock("@/hooks/data/useMatchPlayerStats");
jest.mock("@/hooks/data/useMatchTopPlayers");

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams()
}));

// Mock child components
jest.mock("./stats/MapPicks", () => ({
  MatchMapPicks: () => <div data-testid="match-map-picks">MapPicks</div>
}));

jest.mock("./stats/MatchMapsHeader", () => ({
  MatchMapsHeader: () => <div data-testid="match-maps-header">MapsHeader</div>
}));

jest.mock("./stats/TeamStatistics", () => ({
  TeamStatistics: () => <div data-testid="team-statistics">TeamStatistics</div>
}));

jest.mock("./stats/PlayerStatisticsForTeam", () => ({
  PlayerStatisticsForTeam: ({ playerStats }: { playerStats: unknown[] }) => (
    <div data-testid="player-statistics">
      PlayerStats ({playerStats.length} players)
    </div>
  )
}));

jest.mock("./stats/TopPlayers", () => ({
  TopPlayers: () => <div data-testid="top-players">TopPlayers</div>
}));

jest.mock("@/components/loading", () => ({
  PlayerStatisticsSkeleton: () => (
    <div data-testid="player-stats-skeleton">Loading player stats...</div>
  ),
  TopPlayersSkeleton: () => (
    <div data-testid="top-players-skeleton">Loading top players...</div>
  )
}));

const mockMatchInfo: MatchInfo = {
  match_id: 12345,
  start_timestamp: "2024-01-01T00:00:00Z",
  end_timestamp: "2024-01-01T02:00:00Z",
  external_match_room_id: "test-room-123",
  league_id: 1,
  league_name: "Test League",
  season_id: 1,
  season_name: "Test Season",
  season_platform: SeasonPlatform.FACEIT,
  best_of: 3,
  stage: 1,
  match_game_ids: [1, 2, 3],
  status: MatchStatus.FINISHED,
  teams: {
    1: {
      id: 1,
      name: "Team A",
      logo: "logo-a.png",
      score: 2,
      rank: 1
    },
    2: {
      id: 2,
      name: "Team B",
      logo: "logo-b.png",
      score: 1,
      rank: 2
    }
  }
};

const mockPlayerStats = [
  {
    steam_id: "123",
    nickname: "Player1",
    team_id: 1,
    kills: 20,
    deaths: 15,
    assists: 5,
    flash_assists: 2,
    adr: 85.5,
    kast_percentage: 75,
    hs_percent: 50,
    kana_rating: 1.2,
    first_kills: 3,
    first_deaths: 2,
    utility_damage: 100,
    headshots: 10,
    enemies_flashed: 5
  }
];

const mockTopPlayers = {
  kills: [
    {
      steam_id: "123",
      nickname: "Player1",
      team_id: 1,
      kills: 20
    }
  ]
};

describe("MatchStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows player statistics skeleton while loading player stats", () => {
    (useMatchPlayerStats as jest.Mock).mockReturnValue({
      playerStats: null,
      isLoading: true
    });
    (useMatchTopPlayers as jest.Mock).mockReturnValue({
      topPlayers: null,
      isLoading: true
    });

    render(
      <MatchStats
        matchId={12345}
        matchInfo={mockMatchInfo}
        platform={SeasonPlatform.FACEIT}
        externalMatchRoomUrl="https://example.com"
      />
    );

    expect(screen.getByTestId("player-stats-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("player-statistics")).not.toBeInTheDocument();
  });

  it("shows player statistics when data is loaded", async () => {
    (useMatchPlayerStats as jest.Mock).mockReturnValue({
      playerStats: mockPlayerStats,
      isLoading: false
    });
    (useMatchTopPlayers as jest.Mock).mockReturnValue({
      topPlayers: mockTopPlayers,
      isLoading: false
    });

    render(
      <MatchStats
        matchId={12345}
        matchInfo={mockMatchInfo}
        platform={SeasonPlatform.FACEIT}
        externalMatchRoomUrl="https://example.com"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("player-statistics")).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("player-stats-skeleton")
    ).not.toBeInTheDocument();
    expect(screen.getByText(/1 players/)).toBeInTheDocument();
  });

  it("hides player statistics when no data is available", () => {
    (useMatchPlayerStats as jest.Mock).mockReturnValue({
      playerStats: [],
      isLoading: false
    });
    (useMatchTopPlayers as jest.Mock).mockReturnValue({
      topPlayers: null,
      isLoading: false
    });

    render(
      <MatchStats
        matchId={12345}
        matchInfo={mockMatchInfo}
        platform={SeasonPlatform.FACEIT}
        externalMatchRoomUrl="https://example.com"
      />
    );

    expect(screen.queryByTestId("player-statistics")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("player-stats-skeleton")
    ).not.toBeInTheDocument();
  });

  it("shows top players skeleton while loading top players", () => {
    (useMatchPlayerStats as jest.Mock).mockReturnValue({
      playerStats: mockPlayerStats,
      isLoading: false
    });
    (useMatchTopPlayers as jest.Mock).mockReturnValue({
      topPlayers: null,
      isLoading: true
    });

    render(
      <MatchStats
        matchId={12345}
        matchInfo={mockMatchInfo}
        platform={SeasonPlatform.FACEIT}
        externalMatchRoomUrl="https://example.com"
      />
    );

    expect(screen.getByTestId("top-players-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("top-players")).not.toBeInTheDocument();
  });

  it("shows top players when data is loaded", async () => {
    (useMatchPlayerStats as jest.Mock).mockReturnValue({
      playerStats: mockPlayerStats,
      isLoading: false
    });
    (useMatchTopPlayers as jest.Mock).mockReturnValue({
      topPlayers: mockTopPlayers,
      isLoading: false
    });

    render(
      <MatchStats
        matchId={12345}
        matchInfo={mockMatchInfo}
        platform={SeasonPlatform.FACEIT}
        externalMatchRoomUrl="https://example.com"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("top-players")).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("top-players-skeleton")
    ).not.toBeInTheDocument();
  });

  it("renders all match components", () => {
    (useMatchPlayerStats as jest.Mock).mockReturnValue({
      playerStats: mockPlayerStats,
      isLoading: false
    });
    (useMatchTopPlayers as jest.Mock).mockReturnValue({
      topPlayers: mockTopPlayers,
      isLoading: false
    });

    render(
      <MatchStats
        matchId={12345}
        matchInfo={mockMatchInfo}
        platform={SeasonPlatform.FACEIT}
        externalMatchRoomUrl="https://example.com"
      />
    );

    expect(screen.getByTestId("match-map-picks")).toBeInTheDocument();
    expect(screen.getByTestId("match-maps-header")).toBeInTheDocument();
    expect(screen.getByTestId("team-statistics")).toBeInTheDocument();
  });
});
