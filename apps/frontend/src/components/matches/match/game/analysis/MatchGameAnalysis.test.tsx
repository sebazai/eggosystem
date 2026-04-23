import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatchGameAnalysis } from "./MatchGameAnalysis";
import { useMatchGameAfterplantAnalysis } from "@/hooks/data/useMatchGameAfterplantAnalysis";
import { useMatchGameOpeningDuels } from "@/hooks/data/useMatchGameOpeningDuels";
import { useMatchGameKillMatrix } from "@/hooks/data/useMatchGameKillMatrix";
import { useMatchGameTradeStats } from "@/hooks/data/useMatchGameTradeStats";
import { useMatchGameInsights } from "@/hooks/data/useMatchGameInsights";
import { useGamePlayerStats } from "@/hooks/data/useGamePlayerStats";
import type { MatchInfo } from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";

// Mock all data hooks
jest.mock("@/hooks/data/useMatchGameAfterplantAnalysis");
jest.mock("@/hooks/data/useMatchGameOpeningDuels");
jest.mock("@/hooks/data/useMatchGameKillMatrix");
jest.mock("@/hooks/data/useMatchGameTradeStats");
jest.mock("@/hooks/data/useMatchGameInsights");
jest.mock("@/hooks/data/useGamePlayerStats");

// Mock Next.js navigation
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams
}));

// Mock child tab components to isolate MatchGameAnalysis logic
jest.mock("./InsightsTab", () => ({
  InsightsTab: () => <div data-testid="insights-tab">InsightsTab</div>
}));
jest.mock("./AfterplantTab", () => ({
  AfterplantTab: () => <div data-testid="afterplant-tab">AfterplantTab</div>
}));
jest.mock("./OpeningDuelsTab", () => ({
  OpeningDuelsTab: () => (
    <div data-testid="opening-duels-tab">OpeningDuelsTab</div>
  )
}));
jest.mock("./KillMatrixTab", () => ({
  KillMatrixTab: () => <div data-testid="kill-matrix-tab">KillMatrixTab</div>
}));
jest.mock("./TradeTab", () => ({
  TradeTab: () => <div data-testid="trade-tab">TradeTab</div>
}));

// Mock loading component
jest.mock("@/components/loading", () => ({
  TableSkeleton: () => <div data-testid="table-skeleton">Loading...</div>
}));

const mockMatchInfo: MatchInfo = {
  match_id: 7750,
  start_timestamp: "2024-01-01T12:00:00Z",
  end_timestamp: "2024-01-01T14:00:00Z",
  external_match_room_id: "room-abc",
  league_id: 1,
  league_name: "Test League",
  season_id: 1,
  season_name: "Season 1",
  season_platform: SeasonPlatform.FACEIT,
  best_of: 3,
  stage: 1,
  match_game_ids: [10340],
  status: "FINISHED",
  teams: {
    18: { id: 18, name: "Efecte Gaming Club", logo: null, score: 1, rank: 1 },
    53: { id: 53, name: "Polar Squad", logo: null, score: 2, rank: 2 }
  }
};

const mockPlayerStats = [
  {
    steam_id: "76561198000000001",
    nickname: "Player1",
    team_id: 18,
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

function setupAllDataLoaded() {
  (useMatchGameAfterplantAnalysis as jest.Mock).mockReturnValue({
    afterplantRounds: [],
    isLoading: false,
    isError: null
  });
  (useMatchGameOpeningDuels as jest.Mock).mockReturnValue({
    openingDuels: [],
    isLoading: false,
    isError: null
  });
  (useMatchGameKillMatrix as jest.Mock).mockReturnValue({
    killMatrix: { kills: [], flash_assists: [] },
    isLoading: false,
    isError: null
  });
  (useMatchGameTradeStats as jest.Mock).mockReturnValue({
    tradeStats: { players: [], matrix: [] },
    isLoading: false,
    isError: null
  });
  (useMatchGameInsights as jest.Mock).mockReturnValue({
    insights: { teams: [] },
    isLoading: false,
    isError: null
  });
  (useGamePlayerStats as jest.Mock).mockReturnValue({
    playerStats: mockPlayerStats,
    isLoading: false,
    isError: null
  });
}

function setupAllLoading() {
  (useMatchGameAfterplantAnalysis as jest.Mock).mockReturnValue({
    afterplantRounds: undefined,
    isLoading: true,
    isError: null
  });
  (useMatchGameOpeningDuels as jest.Mock).mockReturnValue({
    openingDuels: undefined,
    isLoading: true,
    isError: null
  });
  (useMatchGameKillMatrix as jest.Mock).mockReturnValue({
    killMatrix: undefined,
    isLoading: true,
    isError: null
  });
  (useMatchGameTradeStats as jest.Mock).mockReturnValue({
    tradeStats: undefined,
    isLoading: true,
    isError: null
  });
  (useMatchGameInsights as jest.Mock).mockReturnValue({
    insights: undefined,
    isLoading: true,
    isError: null
  });
  (useGamePlayerStats as jest.Mock).mockReturnValue({
    playerStats: undefined,
    isLoading: true,
    isError: null
  });
}

describe("MatchGameAnalysis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockReplace.mockClear();
  });

  describe("Tab rendering", () => {
    it("renders all 5 tab triggers", () => {
      setupAllDataLoaded();
      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      expect(
        screen.getByRole("tab", { name: /insights/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /afterplants/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /opening duels/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /kill.*flash matrix/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /trades/i })).toBeInTheDocument();
    });

    it("defaults to insights tab when no tab param is set", () => {
      setupAllDataLoaded();
      mockSearchParams = new URLSearchParams();

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      const insightsTab = screen.getByRole("tab", { name: /insights/i });
      expect(insightsTab).toHaveAttribute("data-state", "active");
    });

    it("defaults to insights tab for unknown tab param value", () => {
      setupAllDataLoaded();
      mockSearchParams = new URLSearchParams("tab=unknown-tab");

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      const insightsTab = screen.getByRole("tab", { name: /insights/i });
      expect(insightsTab).toHaveAttribute("data-state", "active");
    });

    it("activates afterplant tab when tab=afterplant in search params", () => {
      setupAllDataLoaded();
      mockSearchParams = new URLSearchParams("tab=afterplant");

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      const afterplantTab = screen.getByRole("tab", { name: /afterplants/i });
      expect(afterplantTab).toHaveAttribute("data-state", "active");
    });

    it("activates kill-matrix tab when tab=kill-matrix in search params", () => {
      setupAllDataLoaded();
      mockSearchParams = new URLSearchParams("tab=kill-matrix");

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      const killMatrixTab = screen.getByRole("tab", {
        name: /kill.*flash matrix/i
      });
      expect(killMatrixTab).toHaveAttribute("data-state", "active");
    });
  });

  describe("Loading states", () => {
    it("shows skeleton when insights data is loading", () => {
      (useMatchGameInsights as jest.Mock).mockReturnValue({
        insights: undefined,
        isLoading: true,
        isError: null
      });
      (useGamePlayerStats as jest.Mock).mockReturnValue({
        playerStats: undefined,
        isLoading: false,
        isError: null
      });
      // Other hooks loaded
      (useMatchGameAfterplantAnalysis as jest.Mock).mockReturnValue({
        afterplantRounds: [],
        isLoading: false,
        isError: null
      });
      (useMatchGameOpeningDuels as jest.Mock).mockReturnValue({
        openingDuels: [],
        isLoading: false,
        isError: null
      });
      (useMatchGameKillMatrix as jest.Mock).mockReturnValue({
        killMatrix: { kills: [], flash_assists: [] },
        isLoading: false,
        isError: null
      });
      (useMatchGameTradeStats as jest.Mock).mockReturnValue({
        tradeStats: { players: [], matrix: [] },
        isLoading: false,
        isError: null
      });

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
      expect(screen.queryByTestId("insights-tab")).not.toBeInTheDocument();
    });

    it("shows skeleton on afterplant tab when legacy data is loading", async () => {
      const user = userEvent.setup();
      setupAllLoading();

      mockSearchParams = new URLSearchParams("tab=afterplant");

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      // Navigate to afterplant tab
      await user.click(screen.getByRole("tab", { name: /afterplants/i }));

      expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
      expect(screen.queryByTestId("afterplant-tab")).not.toBeInTheDocument();
    });

    it("shows skeleton on trades tab while trade data is loading", () => {
      setupAllDataLoaded();
      (useMatchGameTradeStats as jest.Mock).mockReturnValue({
        tradeStats: undefined,
        isLoading: true,
        isError: null
      });
      mockSearchParams = new URLSearchParams("tab=trades");

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
      expect(screen.queryByTestId("trade-tab")).not.toBeInTheDocument();
    });
  });

  describe("Data display", () => {
    it("renders InsightsTab when insights data is loaded", () => {
      setupAllDataLoaded();

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      expect(screen.getByTestId("insights-tab")).toBeInTheDocument();
      expect(screen.queryByTestId("table-skeleton")).not.toBeInTheDocument();
    });

    it("renders AfterplantTab when data is loaded and tab is active", () => {
      setupAllDataLoaded();
      mockSearchParams = new URLSearchParams("tab=afterplant");

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      expect(screen.getByTestId("afterplant-tab")).toBeInTheDocument();
    });

    it("renders KillMatrixTab when data is loaded and tab is active", () => {
      setupAllDataLoaded();
      mockSearchParams = new URLSearchParams("tab=kill-matrix");

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      expect(screen.getByTestId("kill-matrix-tab")).toBeInTheDocument();
    });

    it("renders TradeTab when data is loaded and tab is active", () => {
      setupAllDataLoaded();
      mockSearchParams = new URLSearchParams("tab=trades");

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      expect(screen.getByTestId("trade-tab")).toBeInTheDocument();
    });

    it("renders OpeningDuelsTab when data is loaded and tab is active", () => {
      setupAllDataLoaded();
      mockSearchParams = new URLSearchParams("tab=opening-duels");

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      expect(screen.getByTestId("opening-duels-tab")).toBeInTheDocument();
    });
  });

  describe("Tab navigation", () => {
    it("calls router.replace with tab param when a tab is clicked", async () => {
      const user = userEvent.setup();
      setupAllDataLoaded();

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      await user.click(screen.getByRole("tab", { name: /afterplants/i }));

      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining("tab=afterplant"),
        expect.objectContaining({ scroll: false })
      );
    });

    it("calls router.replace with trades tab param when trades is clicked", async () => {
      const user = userEvent.setup();
      setupAllDataLoaded();

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      await user.click(screen.getByRole("tab", { name: /trades/i }));

      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining("tab=trades"),
        expect.objectContaining({ scroll: false })
      );
    });
  });

  describe("Hook calls", () => {
    it("calls all hooks with the given matchGameId", () => {
      setupAllDataLoaded();

      render(
        <MatchGameAnalysis matchGameId={10340} matchInfo={mockMatchInfo} />
      );

      expect(useMatchGameAfterplantAnalysis).toHaveBeenCalledWith(10340);
      expect(useMatchGameOpeningDuels).toHaveBeenCalledWith(10340);
      expect(useMatchGameKillMatrix).toHaveBeenCalledWith(10340);
      expect(useMatchGameTradeStats).toHaveBeenCalledWith(10340);
      expect(useMatchGameInsights).toHaveBeenCalledWith(10340);
      expect(useGamePlayerStats).toHaveBeenCalledWith(10340);
    });
  });
});
