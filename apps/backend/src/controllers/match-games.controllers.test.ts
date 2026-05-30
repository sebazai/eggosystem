import { type Response } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import {
  getMatchGameAfterplantAnalysisController,
  getMatchGameKillMatrixController,
  getMatchGameOpeningDuelsController,
  getMatchGameTradeStatsController,
  getMatchGameInsightsController,
  getRoundSwingsController,
  getFlashMatrixController,
  getEntryKillsController,
  getSetupPairsController,
  getWastedUtilityController,
  getRoundUtilitySummaryController
} from "./match-games.controllers";
import {
  getMatchGameAfterplantAnalysis,
  getMatchGameKillMatrix,
  getMatchGameOpeningDuels,
  getMatchGameTradeStats,
  getMatchGameInsights,
  getRoundSwingEvents,
  getEntryKills
} from "../models/match-game-analysis.models";
import {
  getFlashMatrix,
  getPlayerFlashStats
} from "../models/flash-events.models";
import { getSetupPairs } from "../models/setup-events.models";
import { getWastedUtilityByPlayer } from "../models/wasted-utility-events.models";
import { getRoundUtilitySummary } from "../models/round-utility-summary.models";
import { RoundEndReasonInfo } from "@eggosystem/types";

jest.mock("../models/match-game-analysis.models", () => ({
  getMatchGameAfterplantAnalysis: jest.fn(),
  getMatchGameKillMatrix: jest.fn(),
  getMatchGameOpeningDuels: jest.fn(),
  getMatchGameTradeStats: jest.fn(),
  getMatchGameInsights: jest.fn(),
  getRoundSwingEvents: jest.fn(),
  getEntryKills: jest.fn()
}));

jest.mock("../models/flash-events.models", () => ({
  saveFlashEventsForGame: jest.fn(),
  getFlashMatrix: jest.fn(),
  getPlayerFlashStats: jest.fn()
}));

jest.mock("../models/setup-events.models", () => ({
  saveSetupEventsForGame: jest.fn(),
  getSetupPairs: jest.fn()
}));

jest.mock("../models/wasted-utility-events.models", () => ({
  saveWastedUtilityEventsForGame: jest.fn(),
  getWastedUtilityByPlayer: jest.fn()
}));

jest.mock("../models/round-utility-summary.models", () => ({
  saveRoundUtilitySummaryForGame: jest.fn(),
  getRoundUtilitySummary: jest.fn()
}));

const mockAfterplantAnalysis =
  getMatchGameAfterplantAnalysis as jest.MockedFunction<
    typeof getMatchGameAfterplantAnalysis
  >;
const mockKillMatrix = getMatchGameKillMatrix as jest.MockedFunction<
  typeof getMatchGameKillMatrix
>;
const mockOpeningDuels = getMatchGameOpeningDuels as jest.MockedFunction<
  typeof getMatchGameOpeningDuels
>;
const mockTradeStats = getMatchGameTradeStats as jest.MockedFunction<
  typeof getMatchGameTradeStats
>;
const mockInsights = getMatchGameInsights as jest.MockedFunction<
  typeof getMatchGameInsights
>;

const mockRoundSwingEvents = getRoundSwingEvents as jest.MockedFunction<
  typeof getRoundSwingEvents
>;
const mockGetFlashMatrix = getFlashMatrix as jest.MockedFunction<
  typeof getFlashMatrix
>;
const mockGetPlayerFlashStats = getPlayerFlashStats as jest.MockedFunction<
  typeof getPlayerFlashStats
>;
const mockGetEntryKills = getEntryKills as jest.MockedFunction<
  typeof getEntryKills
>;
const mockGetSetupPairs = getSetupPairs as jest.MockedFunction<
  typeof getSetupPairs
>;
const mockGetWastedUtilityByPlayer =
  getWastedUtilityByPlayer as jest.MockedFunction<
    typeof getWastedUtilityByPlayer
  >;
const mockGetRoundUtilitySummary =
  getRoundUtilitySummary as jest.MockedFunction<typeof getRoundUtilitySummary>;

function makeReq(match_game_id: string, query: Record<string, string> = {}) {
  return {
    params: { match_game_id },
    query
  } as unknown as RequestWithParams<{ match_game_id: string }>;
}

function makeRes() {
  const jsonSpy = jest.fn();
  return {
    res: { json: jsonSpy } as unknown as Response,
    jsonSpy
  };
}

describe("match-games analysis controllers", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getMatchGameAfterplantAnalysisController", () => {
    const mockRounds = [
      {
        round_number: 1,
        plant_site: "A" as const,
        ct_t: { T: ["76561198000000001"], CT: ["76561198000000002"] },
        round_end_reason_info: RoundEndReasonInfo.BombDefused,
        ct_team_id: 1,
        t_team_id: 2,
        t_alive_at_plant: 3,
        ct_alive_at_plant: 2,
        ct_team_name: "Team CT",
        t_team_name: "Team T",
        ct_team_logo: null,
        t_team_logo: null,
        kills_after_plant: []
      }
    ];

    it("parses match_game_id and calls model with numeric id", async () => {
      mockAfterplantAnalysis.mockResolvedValue(mockRounds);
      const req = makeReq("42");
      const { res } = makeRes();

      await getMatchGameAfterplantAnalysisController(req, res);

      expect(mockAfterplantAnalysis).toHaveBeenCalledWith(42);
    });

    it("returns model data as JSON", async () => {
      mockAfterplantAnalysis.mockResolvedValue(mockRounds);
      const req = makeReq("42");
      const { res, jsonSpy } = makeRes();

      await getMatchGameAfterplantAnalysisController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith(mockRounds);
    });

    it("returns empty array when model returns no rounds", async () => {
      mockAfterplantAnalysis.mockResolvedValue([]);
      const req = makeReq("999");
      const { res, jsonSpy } = makeRes();

      await getMatchGameAfterplantAnalysisController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith([]);
    });
  });

  describe("getMatchGameKillMatrixController", () => {
    const mockMatrix = {
      kills: [
        {
          killer_steam_id: "76561198000000001",
          victim_steam_id: "76561198000000002",
          count: 3
        }
      ],
      flash_assists: [
        {
          assister_steam_id: "76561198000000001",
          victim_steam_id: "76561198000000003",
          count: 1
        }
      ]
    };

    it("parses match_game_id and calls model with numeric id and default filters", async () => {
      mockKillMatrix.mockResolvedValue(mockMatrix);
      const req = makeReq("10340");
      const { res } = makeRes();

      await getMatchGameKillMatrixController(req, res);

      expect(mockKillMatrix).toHaveBeenCalledWith(10340, {
        excludeExitKills: false,
        postPlantOnly: false,
        excludeEcoKills: false
      });
    });

    it("returns kill matrix data as JSON", async () => {
      mockKillMatrix.mockResolvedValue(mockMatrix);
      const req = makeReq("10340");
      const { res, jsonSpy } = makeRes();

      await getMatchGameKillMatrixController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith(mockMatrix);
    });

    it("passes excludeExitKills filter when query param is true", async () => {
      mockKillMatrix.mockResolvedValue(mockMatrix);
      const req = makeReq("10340", { excludeExitKills: "true" });
      const { res } = makeRes();

      await getMatchGameKillMatrixController(req, res);

      expect(mockKillMatrix).toHaveBeenCalledWith(10340, {
        excludeExitKills: true,
        postPlantOnly: false,
        excludeEcoKills: false
      });
    });

    it("passes postPlantOnly filter when query param is true", async () => {
      mockKillMatrix.mockResolvedValue(mockMatrix);
      const req = makeReq("10340", { postPlantOnly: "true" });
      const { res } = makeRes();

      await getMatchGameKillMatrixController(req, res);

      expect(mockKillMatrix).toHaveBeenCalledWith(10340, {
        excludeExitKills: false,
        postPlantOnly: true,
        excludeEcoKills: false
      });
    });
  });

  describe("getMatchGameOpeningDuelsController", () => {
    const mockDuels = [
      {
        round_number: 1,
        killer_steam_id: "76561198000000001",
        killer_team: "CT" as const,
        victim_steam_id: "76561198000000002",
        victim_team: "T" as const,
        weapon: "ak47",
        time_in_round: 12.5,
        is_headshot: true,
        round_won_by: "CT" as const,
        trade: "isolated" as const
      }
    ];

    it("parses match_game_id and calls model with numeric id", async () => {
      mockOpeningDuels.mockResolvedValue(mockDuels);
      const req = makeReq("10340");
      const { res } = makeRes();

      await getMatchGameOpeningDuelsController(req, res);

      expect(mockOpeningDuels).toHaveBeenCalledWith(10340);
    });

    it("returns opening duels as JSON", async () => {
      mockOpeningDuels.mockResolvedValue(mockDuels);
      const req = makeReq("10340");
      const { res, jsonSpy } = makeRes();

      await getMatchGameOpeningDuelsController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith(mockDuels);
    });
  });

  describe("getMatchGameTradeStatsController", () => {
    const mockTrades = {
      players: [
        {
          steam_id: "76561198000000001",
          nickname: "Player1",
          team_id: 1,
          trade_opportunities: 10,
          trade_attempts: 7,
          trades: 5,
          traded: 3,
          deaths: 12,
          first_death_traded: 1,
          first_death_trade_opportunities: 2,
          first_deaths: 2
        }
      ],
      matrix: [
        {
          trader_steam_id: "76561198000000001",
          killer_steam_id: "76561198000000002",
          count: 3
        }
      ]
    };

    it("parses match_game_id and calls model with numeric id", async () => {
      mockTradeStats.mockResolvedValue(mockTrades);
      const req = makeReq("10340");
      const { res } = makeRes();

      await getMatchGameTradeStatsController(req, res);

      expect(mockTradeStats).toHaveBeenCalledWith(10340);
    });

    it("returns trade stats as JSON", async () => {
      mockTradeStats.mockResolvedValue(mockTrades);
      const req = makeReq("10340");
      const { res, jsonSpy } = makeRes();

      await getMatchGameTradeStatsController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith(mockTrades);
    });
  });

  describe("getMatchGameInsightsController", () => {
    const mockInsightsData = {
      teams: [
        {
          team_id: 1,
          team_name: "Team Alpha",
          team_logo: null,
          ct: [
            {
              id: "OD-1",
              category: "openings" as const,
              polarity: "concern" as const,
              severity: "critical" as const,
              side: "CT" as const,
              team_id: 1,
              headline: "Opening Death → Site Plant",
              story:
                "Team Alpha lost the opening duel on CT side 8 times, leading to site plants.",
              evidence_rounds: [3, 7, 14],
              players: ["76561198000000001"]
            }
          ],
          t: []
        }
      ]
    };

    it("parses match_game_id and calls model with numeric id", async () => {
      mockInsights.mockResolvedValue(mockInsightsData);
      const req = makeReq("10340");
      const { res } = makeRes();

      await getMatchGameInsightsController(req, res);

      expect(mockInsights).toHaveBeenCalledWith(10340);
    });

    it("returns insights as JSON", async () => {
      mockInsights.mockResolvedValue(mockInsightsData);
      const req = makeReq("10340");
      const { res, jsonSpy } = makeRes();

      await getMatchGameInsightsController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith(mockInsightsData);
    });

    it("returns empty teams array when no insights found", async () => {
      const emptyInsights = { teams: [] };
      mockInsights.mockResolvedValue(emptyInsights);
      const req = makeReq("999");
      const { res, jsonSpy } = makeRes();

      await getMatchGameInsightsController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({ teams: [] });
    });
  });

  describe("getRoundSwingsController", () => {
    const mockSwings = [
      {
        round_number: 14,
        time_in_round: 42.18,
        event_type: "kill",
        pre_win_prob: 0.62,
        post_win_prob: 0.31,
        delta: -0.31,
        primary_player_steam_id: "1001",
        contributors: [{ steam_id: "1001", contribution: 1 }],
        victim_steam_id: "1002",
        weapon: "AK-47",
        is_headshot: true,
        is_post_plant: false,
        cts_alive_after: 3,
        ts_alive_after: 4
      }
    ];

    it("parses match_game_id and calls model with numeric id and defaults", async () => {
      mockRoundSwingEvents.mockResolvedValue(mockSwings);
      const req = makeReq("42");
      const { res } = makeRes();

      await getRoundSwingsController(req, res);

      expect(mockRoundSwingEvents).toHaveBeenCalledWith(42, {
        roundNumber: undefined,
        limit: undefined
      });
    });

    it("passes roundNumber and limit query params to model", async () => {
      mockRoundSwingEvents.mockResolvedValue(mockSwings);
      const req = makeReq("42", { roundNumber: "3", limit: "10" });
      const { res } = makeRes();

      await getRoundSwingsController(req, res);

      expect(mockRoundSwingEvents).toHaveBeenCalledWith(42, {
        roundNumber: 3,
        limit: 10
      });
    });

    it("wraps result in round_swings envelope", async () => {
      mockRoundSwingEvents.mockResolvedValue(mockSwings);
      const req = makeReq("42");
      const { res, jsonSpy } = makeRes();

      await getRoundSwingsController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({ round_swings: mockSwings });
    });

    it("returns empty round_swings array for games with no swing data", async () => {
      mockRoundSwingEvents.mockResolvedValue([]);
      const req = makeReq("999");
      const { res, jsonSpy } = makeRes();

      await getRoundSwingsController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({ round_swings: [] });
    });
  });

  describe("getFlashMatrixController", () => {
    const mockMatrix = [
      {
        thrower_steam_id: "1001",
        victim_steam_id: "1002",
        flash_count: 5,
        avg_duration_seconds: 2.4,
        total_duration_seconds: 12.0
      }
    ];
    const mockStats = [
      {
        steam_id: "1001",
        enemy_flashes: 5,
        teammate_flashes: 1,
        self_flashes: 0,
        total_flashes: 6,
        avg_duration_seconds: 2.0,
        total_duration_seconds: 12.0
      }
    ];

    it("calls both model functions with match_game_id", async () => {
      mockGetFlashMatrix.mockResolvedValue(mockMatrix);
      mockGetPlayerFlashStats.mockResolvedValue(mockStats);
      const req = makeReq("42");
      const { res } = makeRes();

      await getFlashMatrixController(req, res);

      expect(mockGetFlashMatrix).toHaveBeenCalledWith(42, { enemyOnly: false });
      expect(mockGetPlayerFlashStats).toHaveBeenCalledWith(42);
    });

    it("returns flash_matrix and player_stats in response", async () => {
      mockGetFlashMatrix.mockResolvedValue(mockMatrix);
      mockGetPlayerFlashStats.mockResolvedValue(mockStats);
      const req = makeReq("42");
      const { res, jsonSpy } = makeRes();

      await getFlashMatrixController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({
        flash_matrix: mockMatrix,
        player_stats: mockStats
      });
    });

    it("returns empty arrays for old-parser games with no flash events", async () => {
      mockGetFlashMatrix.mockResolvedValue([]);
      mockGetPlayerFlashStats.mockResolvedValue([]);
      const req = makeReq("999");
      const { res, jsonSpy } = makeRes();

      await getFlashMatrixController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({
        flash_matrix: [],
        player_stats: []
      });
    });
  });

  describe("getEntryKillsController", () => {
    const mockEntryKills = [
      {
        round_number: 5,
        time_in_round: 12.5,
        killer_steam_id: "1001",
        victim_steam_id: "1002",
        killer_team: "CT",
        victim_team: "T",
        setup_flash_thrower: "1003",
        victim_blind_seconds: 2.1,
        was_victim_traded: false
      }
    ];

    it("calls model with numeric match_game_id", async () => {
      mockGetEntryKills.mockResolvedValue(mockEntryKills);
      const req = makeReq("42");
      const { res } = makeRes();

      await getEntryKillsController(req, res);

      expect(mockGetEntryKills).toHaveBeenCalledWith(42);
    });

    it("wraps result in entry_kills envelope", async () => {
      mockGetEntryKills.mockResolvedValue(mockEntryKills);
      const req = makeReq("42");
      const { res, jsonSpy } = makeRes();

      await getEntryKillsController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({ entry_kills: mockEntryKills });
    });

    it("returns empty entry_kills array for old-parser games", async () => {
      mockGetEntryKills.mockResolvedValue([]);
      const req = makeReq("999");
      const { res, jsonSpy } = makeRes();

      await getEntryKillsController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({ entry_kills: [] });
    });
  });

  describe("getSetupPairsController", () => {
    const mockPairs = [
      {
        setup_player_steam_id: "1001",
        beneficiary_steam_id: "1002",
        setup_type: "flash",
        count: 3,
        avg_seconds_after_setup: 1.5
      }
    ];

    it("calls model with numeric match_game_id", async () => {
      mockGetSetupPairs.mockResolvedValue(mockPairs);
      const req = makeReq("42");
      const { res } = makeRes();

      await getSetupPairsController(req, res);

      expect(mockGetSetupPairs).toHaveBeenCalledWith(42);
    });

    it("wraps result in setup_pairs envelope", async () => {
      mockGetSetupPairs.mockResolvedValue(mockPairs);
      const req = makeReq("42");
      const { res, jsonSpy } = makeRes();

      await getSetupPairsController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({ setup_pairs: mockPairs });
    });

    it("returns empty setup_pairs for games with no setup events", async () => {
      mockGetSetupPairs.mockResolvedValue([]);
      const req = makeReq("999");
      const { res, jsonSpy } = makeRes();

      await getSetupPairsController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({ setup_pairs: [] });
    });
  });

  describe("getWastedUtilityController", () => {
    const mockWasted = [
      { thrower_steam_id: "1001", utility_type: "HE", count: 2 }
    ];

    it("calls model with numeric match_game_id", async () => {
      mockGetWastedUtilityByPlayer.mockResolvedValue(mockWasted);
      const req = makeReq("42");
      const { res } = makeRes();

      await getWastedUtilityController(req, res);

      expect(mockGetWastedUtilityByPlayer).toHaveBeenCalledWith(42);
    });

    it("wraps result in wasted_utility envelope", async () => {
      mockGetWastedUtilityByPlayer.mockResolvedValue(mockWasted);
      const req = makeReq("42");
      const { res, jsonSpy } = makeRes();

      await getWastedUtilityController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({ wasted_utility: mockWasted });
    });

    it("returns empty wasted_utility for games with no data", async () => {
      mockGetWastedUtilityByPlayer.mockResolvedValue([]);
      const req = makeReq("999");
      const { res, jsonSpy } = makeRes();

      await getWastedUtilityController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({ wasted_utility: [] });
    });
  });

  describe("getRoundUtilitySummaryController", () => {
    const mockSummary = [
      {
        round_number: 3,
        steam_id: "1001",
        flashes_thrown: 2,
        enemies_flashed: 1,
        teammates_flashed: 0,
        smokes_thrown: 1,
        utility_damage: 45,
        wasted_utility: 0
      }
    ];

    it("calls model with numeric match_game_id", async () => {
      mockGetRoundUtilitySummary.mockResolvedValue(mockSummary);
      const req = makeReq("42");
      const { res } = makeRes();

      await getRoundUtilitySummaryController(req, res);

      expect(mockGetRoundUtilitySummary).toHaveBeenCalledWith(42);
    });

    it("wraps result in round_utility_summary envelope", async () => {
      mockGetRoundUtilitySummary.mockResolvedValue(mockSummary);
      const req = makeReq("42");
      const { res, jsonSpy } = makeRes();

      await getRoundUtilitySummaryController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({
        round_utility_summary: mockSummary
      });
    });

    it("returns empty round_utility_summary for games with no data", async () => {
      mockGetRoundUtilitySummary.mockResolvedValue([]);
      const req = makeReq("999");
      const { res, jsonSpy } = makeRes();

      await getRoundUtilitySummaryController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith({ round_utility_summary: [] });
    });
  });
});
