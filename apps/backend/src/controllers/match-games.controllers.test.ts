import { type Response } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import {
  getMatchGameAfterplantAnalysisController,
  getMatchGameKillMatrixController,
  getMatchGameOpeningDuelsController,
  getMatchGameTradeStatsController,
  getMatchGameInsightsController
} from "./match-games.controllers";
import {
  getMatchGameAfterplantAnalysis,
  getMatchGameKillMatrix,
  getMatchGameOpeningDuels,
  getMatchGameTradeStats,
  getMatchGameInsights
} from "../models/match-game-analysis.models";

jest.mock("../models/match-game-analysis.models", () => ({
  getMatchGameAfterplantAnalysis: jest.fn(),
  getMatchGameKillMatrix: jest.fn(),
  getMatchGameOpeningDuels: jest.fn(),
  getMatchGameTradeStats: jest.fn(),
  getMatchGameInsights: jest.fn()
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

function makeReq(match_game_id: string) {
  return {
    params: { match_game_id }
  } as RequestWithParams<{ match_game_id: string }>;
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
        round_end_reason_info: { id: 7, name: "Bomb defused" },
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

    it("parses match_game_id and calls model with numeric id", async () => {
      mockKillMatrix.mockResolvedValue(mockMatrix);
      const req = makeReq("10340");
      const { res } = makeRes();

      await getMatchGameKillMatrixController(req, res);

      expect(mockKillMatrix).toHaveBeenCalledWith(10340);
    });

    it("returns kill matrix data as JSON", async () => {
      mockKillMatrix.mockResolvedValue(mockMatrix);
      const req = makeReq("10340");
      const { res, jsonSpy } = makeRes();

      await getMatchGameKillMatrixController(req, res);

      expect(jsonSpy).toHaveBeenCalledWith(mockMatrix);
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
});
