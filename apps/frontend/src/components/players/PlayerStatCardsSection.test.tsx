import { render } from "@testing-library/react";
import { PlayerStatCardsSection } from "./PlayerStatCardsSection";
import { usePlayerStats } from "@/hooks/data/filtered/usePlayerStats";
import { useFilters } from "@/context/FilterContext";

// Mock the hooks
jest.mock("@/hooks/data/filtered/usePlayerStats", () => ({
  usePlayerStats: jest.fn()
}));

jest.mock("@/context/FilterContext", () => ({
  useFilters: jest.fn()
}));

const mockPlayerStats = {
  steam_id: "76561198012345678",
  nickname: "TestPlayer",
  maps_played: 25,
  kills: 520,
  deaths: 410,
  assists: 85,
  kd: 1.27,
  adr: 82.5,
  hs_percent: 48.2,
  kana_rating: 1.15
};

describe("PlayerStatCardsSection", () => {
  const mockUsePlayerStats = usePlayerStats as jest.Mock;
  const mockUseFilters = useFilters as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFilters.mockReturnValue({
      filterParams: { seasons: [1], leagues: [1] }
    });
  });

  describe("Snapshot Tests", () => {
    it("renders correctly with player stats data", () => {
      mockUsePlayerStats.mockReturnValue({
        playerStats: mockPlayerStats,
        isLoading: false,
        isError: false
      });

      const { container } = render(
        <PlayerStatCardsSection steamId="76561198012345678" />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly in loading state", () => {
      mockUsePlayerStats.mockReturnValue({
        playerStats: undefined,
        isLoading: true,
        isError: false
      });

      const { container } = render(
        <PlayerStatCardsSection steamId="76561198012345678" />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly in error state", () => {
      mockUsePlayerStats.mockReturnValue({
        playerStats: undefined,
        isLoading: false,
        isError: true
      });

      const { container } = render(
        <PlayerStatCardsSection steamId="76561198012345678" />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly when no player stats found", () => {
      mockUsePlayerStats.mockReturnValue({
        playerStats: null,
        isLoading: false,
        isError: false
      });

      const { container } = render(
        <PlayerStatCardsSection steamId="76561198012345678" />
      );
      expect(container).toMatchSnapshot();
    });
  });
});
