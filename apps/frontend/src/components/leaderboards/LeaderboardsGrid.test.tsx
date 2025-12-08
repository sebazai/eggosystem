import { render } from "@testing-library/react";
import { LeaderboardsGrid } from "./LeaderboardsGrid";
import { useLeaderboards } from "@/hooks/data/filtered/useLeaderboards";

// Mock the useLeaderboards hook
jest.mock("@/hooks/data/filtered/useLeaderboards", () => ({
  useLeaderboards: jest.fn()
}));

const mockLeaderboardsData = [
  {
    title: "Top Rating",
    unit: "",
    players: [
      {
        steam_id: "76561198012345678",
        nickname: "TestPlayer1",
        team_name: "TestTeam1",
        matches_played: 15,
        value: 1.25,
        rank: 1
      },
      {
        steam_id: "76561198012345679",
        nickname: "TestPlayer2",
        team_name: "TestTeam2",
        matches_played: 12,
        value: 1.18,
        rank: 2
      },
      {
        steam_id: "76561198012345680",
        nickname: "TestPlayer3",
        team_name: "TestTeam1",
        matches_played: 10,
        value: 1.12,
        rank: 3
      }
    ]
  },
  {
    title: "Headshot %",
    unit: "%",
    players: [
      {
        steam_id: "76561198012345681",
        nickname: "HeadshotKing",
        team_name: "TestTeam3",
        matches_played: 8,
        value: 65.5,
        rank: 1
      }
    ]
  }
];

describe("LeaderboardsGrid", () => {
  const mockUseLeaderboards = useLeaderboards as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Snapshot Tests", () => {
    it("renders correctly with leaderboard data", () => {
      mockUseLeaderboards.mockReturnValue({
        leaderboards: mockLeaderboardsData,
        isLoading: false,
        isError: false,
        isValidating: false
      });

      const { container } = render(
        <LeaderboardsGrid
          filterQueryParams={{
            seasons: [1],
            leagues: [1],
            stages: null,
            teams: null,
            maps: null
          }}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly in loading state", () => {
      mockUseLeaderboards.mockReturnValue({
        leaderboards: undefined,
        isLoading: true,
        isError: false,
        isValidating: false
      });

      const { container } = render(
        <LeaderboardsGrid
          filterQueryParams={{
            seasons: [1],
            leagues: [1],
            stages: null,
            teams: null,
            maps: null
          }}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly in error state", () => {
      mockUseLeaderboards.mockReturnValue({
        leaderboards: undefined,
        isLoading: false,
        isError: true,
        isValidating: false
      });

      const { container } = render(
        <LeaderboardsGrid
          filterQueryParams={{
            seasons: [1],
            leagues: [1],
            stages: null,
            teams: null,
            maps: null
          }}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly with empty leaderboards", () => {
      mockUseLeaderboards.mockReturnValue({
        leaderboards: [],
        isLoading: false,
        isError: false,
        isValidating: false
      });

      const { container } = render(
        <LeaderboardsGrid
          filterQueryParams={{
            seasons: [1],
            leagues: [1],
            stages: null,
            teams: null,
            maps: null
          }}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly with category that has no players", () => {
      mockUseLeaderboards.mockReturnValue({
        leaderboards: [
          {
            title: "Empty Category",
            unit: "",
            players: []
          }
        ],
        isLoading: false,
        isError: false,
        isValidating: false
      });

      const { container } = render(
        <LeaderboardsGrid
          filterQueryParams={{
            seasons: [1],
            leagues: [1],
            stages: null,
            teams: null,
            maps: null
          }}
        />
      );
      expect(container).toMatchSnapshot();
    });
  });
});
