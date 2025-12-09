import { render } from "@testing-library/react";
import { PlayerCards } from "./PlayerCards";
import { useMultiplePlayersStats } from "@/hooks/data/filtered/useMultiplePlayersStats";

// Mock the useMultiplePlayersStats hook
jest.mock("@/hooks/data/filtered/useMultiplePlayersStats", () => ({
  useMultiplePlayersStats: jest.fn()
}));

const mockPlayers = [
  {
    steam_id: "76561198012345678",
    nickname: "TopPlayer1",
    kills: 250,
    deaths: 180,
    kd: 1.39,
    adr: 88.5,
    kana_rating: 1.35
  },
  {
    steam_id: "76561198012345679",
    nickname: "TopPlayer2",
    kills: 220,
    deaths: 190,
    kd: 1.16,
    adr: 82.1,
    kana_rating: 1.22
  },
  {
    steam_id: "76561198012345680",
    nickname: "TopPlayer3",
    kills: 200,
    deaths: 200,
    kd: 1.0,
    adr: 75.5,
    kana_rating: 1.1
  },
  {
    steam_id: "76561198012345681",
    nickname: "TopPlayer4",
    kills: 180,
    deaths: 210,
    kd: 0.86,
    adr: 68.2,
    kana_rating: 0.95
  },
  {
    steam_id: "76561198012345682",
    nickname: "TopPlayer5",
    kills: 160,
    deaths: 220,
    kd: 0.73,
    adr: 62.0,
    kana_rating: 0.85
  }
];

describe("PlayerCards", () => {
  const mockUseMultiplePlayersStats = useMultiplePlayersStats as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Snapshot Tests", () => {
    it("renders correctly with top 5 players", () => {
      mockUseMultiplePlayersStats.mockReturnValue({
        players: mockPlayers,
        isLoading: false,
        isError: false
      });

      const { container } = render(
        <PlayerCards
          teamId={1}
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
      mockUseMultiplePlayersStats.mockReturnValue({
        players: undefined,
        isLoading: true,
        isError: false
      });

      const { container } = render(
        <PlayerCards
          teamId={1}
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
      mockUseMultiplePlayersStats.mockReturnValue({
        players: undefined,
        isLoading: false,
        isError: true
      });

      const { container } = render(
        <PlayerCards
          teamId={1}
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

    it("renders correctly with null players", () => {
      mockUseMultiplePlayersStats.mockReturnValue({
        players: null,
        isLoading: false,
        isError: false
      });

      const { container } = render(
        <PlayerCards
          teamId={1}
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

    it("renders correctly with fewer than 5 players", () => {
      mockUseMultiplePlayersStats.mockReturnValue({
        players: mockPlayers.slice(0, 3),
        isLoading: false,
        isError: false
      });

      const { container } = render(
        <PlayerCards
          teamId={1}
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
