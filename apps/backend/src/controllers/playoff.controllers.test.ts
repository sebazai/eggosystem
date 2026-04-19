import { type Request, type Response } from "express";
import { getPlayoffBracketController } from "./playoff.controllers";
import * as seasonLeagueExternalIdModels from "../models/season-league-external-id.models";
import * as playoffBracketServices from "../services/playoff-bracket.services";
import * as matchModels from "../models/match.models";
import * as seasonLeagueTeamModels from "../models/season-league-team.models";
import * as teamModels from "../models/team.models";

jest.mock("../models/season-league-external-id.models");
jest.mock("../services/playoff-bracket.services");
jest.mock("../models/match.models");
jest.mock("../models/season-league-team.models");
jest.mock("../models/team.models");

const mockGetPlayoffExternalId =
  seasonLeagueExternalIdModels.getPlayoffExternalIdBySeasonAndLeague as jest.MockedFunction<
    typeof seasonLeagueExternalIdModels.getPlayoffExternalIdBySeasonAndLeague
  >;
const mockGetChampionshipMatchesCached =
  playoffBracketServices.getChampionshipMatchesCached as jest.MockedFunction<
    typeof playoffBracketServices.getChampionshipMatchesCached
  >;
const mockGetPlayoffMatchIds =
  matchModels.getPlayoffMatchIdsByExternalRoomIds as jest.MockedFunction<
    typeof matchModels.getPlayoffMatchIdsByExternalRoomIds
  >;
const mockGetTeamIdsByExternalIds =
  seasonLeagueTeamModels.getTeamIdsByExternalIds as jest.MockedFunction<
    typeof seasonLeagueTeamModels.getTeamIdsByExternalIds
  >;
const mockGetPlayoffSeedMap =
  seasonLeagueTeamModels.getPlayoffSeedMapBySeasonAndLeague as jest.MockedFunction<
    typeof seasonLeagueTeamModels.getPlayoffSeedMapBySeasonAndLeague
  >;
const mockGetTeamLogosByTeamIds =
  teamModels.getTeamLogosByTeamIds as jest.MockedFunction<
    typeof teamModels.getTeamLogosByTeamIds
  >;

describe("playoff.controllers", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    mockRequest = {
      params: { season_id: "1", league_id: "2" }
    };
    mockResponse = {
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("getPlayoffBracketController", () => {
    it("returns empty matches and numR1Slots 0 when no championship id", async () => {
      mockGetPlayoffExternalId.mockResolvedValue(null);

      await getPlayoffBracketController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetPlayoffExternalId).toHaveBeenCalledWith(1, 2);
      expect(mockGetChampionshipMatchesCached).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        matches: [],
        bracket: { numR1Slots: 0 }
      });
    });

    it("returns matches and bracket with numR1Slots from seeds when FaceIT returns items", async () => {
      const championshipId = "champ-1";
      mockGetPlayoffExternalId.mockResolvedValue(championshipId);
      mockGetChampionshipMatchesCached.mockResolvedValue([
        {
          match_id: "faceit-1",
          round: 1,
          group: 1,
          status: "FINISHED",
          best_of: 3,
          scheduled_at: 1000,
          teams: {
            faction1: {
              faction_id: "f1",
              name: "Team A",
              avatar: "https://faceit.com/a.png"
            },
            faction2: {
              faction_id: "f2",
              name: "Team B",
              avatar: "https://faceit.com/b.png"
            }
          },
          results: { score: { faction1: 2, faction2: 1 } }
        }
      ]);
      mockGetPlayoffMatchIds.mockResolvedValue(new Map([["faceit-1", 100]]));
      mockGetTeamIdsByExternalIds.mockResolvedValue(
        new Map([
          ["f1", 10],
          ["f2", 20]
        ])
      );
      mockGetTeamLogosByTeamIds.mockResolvedValue(
        new Map([
          [10, "logo10"],
          [20, "logo20"]
        ])
      );
      mockGetPlayoffSeedMap.mockResolvedValue(
        new Map([
          [10, 1],
          [20, 2]
        ])
      );

      await getPlayoffBracketController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetChampionshipMatchesCached).toHaveBeenCalledWith(
        championshipId
      );
      expect(mockResponse.json).toHaveBeenCalled();
      const [payload] = (mockResponse.json as jest.Mock).mock.calls[0];
      expect(payload).toHaveProperty("matches");
      expect(payload).toHaveProperty("bracket");
      expect(payload.bracket).toMatchObject({ numR1Slots: 1 });
      expect(Array.isArray(payload.matches)).toBe(true);
      expect(payload.matches.length).toBe(1);
      expect(payload.matches[0]).toMatchObject({
        match_id: 100,
        external_match_id: "faceit-1",
        round: 1,
        group: 1,
        team1_id: 10,
        team2_id: 20,
        seed1: 1,
        seed2: 2,
        team1_logo: "logo10",
        team2_logo: "logo20"
      });
    });

    it("puts higher seed as team1 when FaceIT order has lower seed first", async () => {
      mockGetPlayoffExternalId.mockResolvedValue("champ-1");
      mockGetChampionshipMatchesCached.mockResolvedValue([
        {
          match_id: "m1",
          round: 1,
          group: 1,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 2000,
          teams: {
            faction1: {
              faction_id: "low",
              name: "Low Seed",
              avatar: ""
            },
            faction2: {
              faction_id: "high",
              name: "High Seed",
              avatar: ""
            }
          }
        }
      ]);
      mockGetPlayoffMatchIds.mockResolvedValue(new Map([["m1", 1]]));
      mockGetTeamIdsByExternalIds.mockResolvedValue(
        new Map([
          ["low", 100],
          ["high", 200]
        ])
      );
      mockGetTeamLogosByTeamIds.mockResolvedValue(new Map());
      mockGetPlayoffSeedMap.mockResolvedValue(
        new Map([
          [100, 8],
          [200, 1]
        ])
      );

      await getPlayoffBracketController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const [payload] = (mockResponse.json as jest.Mock).mock.calls[0];
      expect(payload.matches[0].team1_id).toBe(200);
      expect(payload.matches[0].team2_id).toBe(100);
      expect(payload.matches[0].seed1).toBe(1);
      expect(payload.matches[0].seed2).toBe(8);
    });

    it("orders lower bracket R1 matches by api_index when teams have no seeds (placeholder)", async () => {
      mockGetPlayoffExternalId.mockResolvedValue("champ-lb");

      const makePlaceholderFaction = (id: string, name: string) => ({
        faction_id: id,
        name,
        avatar: ""
      });

      mockGetChampionshipMatchesCached.mockResolvedValue([
        {
          match_id: "lb-r1-c",
          round: 1,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: makePlaceholderFaction("p5", "TBD"),
            faction2: makePlaceholderFaction("p6", "TBD")
          }
        },
        {
          match_id: "lb-r1-a",
          round: 1,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: makePlaceholderFaction("p1", "TBD"),
            faction2: makePlaceholderFaction("p2", "TBD")
          }
        },
        {
          match_id: "lb-r1-d",
          round: 1,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: makePlaceholderFaction("p7", "TBD"),
            faction2: makePlaceholderFaction("p8", "TBD")
          }
        },
        {
          match_id: "lb-r1-b",
          round: 1,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: makePlaceholderFaction("p3", "TBD"),
            faction2: makePlaceholderFaction("p4", "TBD")
          }
        }
      ]);

      mockGetPlayoffMatchIds.mockResolvedValue(
        new Map([
          ["lb-r1-a", 10],
          ["lb-r1-b", 11],
          ["lb-r1-c", 12],
          ["lb-r1-d", 13]
        ])
      );
      mockGetTeamIdsByExternalIds.mockResolvedValue(new Map());
      mockGetTeamLogosByTeamIds.mockResolvedValue(new Map());
      mockGetPlayoffSeedMap.mockResolvedValue(new Map());

      await getPlayoffBracketController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const [payload] = (mockResponse.json as jest.Mock).mock.calls[0];
      const lbMatches = payload.matches.filter(
        (m: { group: number }) => m.group === 2
      );
      expect(
        lbMatches.map((m: { external_match_id: string }) => m.external_match_id)
      ).toEqual(["lb-r1-c", "lb-r1-a", "lb-r1-d", "lb-r1-b"]);
    });

    it("orders lower bracket R1 by api_index over UUID lexicographic order when seeds resolve to same slot", async () => {
      mockGetPlayoffExternalId.mockResolvedValue("champ-lb2");

      mockGetChampionshipMatchesCached.mockResolvedValue([
        {
          match_id: "zzz-first-in-api",
          round: 1,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: { faction_id: "f1", name: "TBD", avatar: "" },
            faction2: { faction_id: "f2", name: "TBD", avatar: "" }
          }
        },
        {
          match_id: "aaa-second-in-api",
          round: 1,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: { faction_id: "f3", name: "TBD", avatar: "" },
            faction2: { faction_id: "f4", name: "TBD", avatar: "" }
          }
        }
      ]);

      mockGetPlayoffMatchIds.mockResolvedValue(
        new Map([
          ["zzz-first-in-api", 20],
          ["aaa-second-in-api", 21]
        ])
      );
      mockGetTeamIdsByExternalIds.mockResolvedValue(new Map());
      mockGetTeamLogosByTeamIds.mockResolvedValue(new Map());
      mockGetPlayoffSeedMap.mockResolvedValue(new Map());

      await getPlayoffBracketController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const [payload] = (mockResponse.json as jest.Mock).mock.calls[0];
      const lbMatches = payload.matches.filter(
        (m: { group: number }) => m.group === 2
      );
      expect(lbMatches[0].external_match_id).toBe("zzz-first-in-api");
      expect(lbMatches[1].external_match_id).toBe("aaa-second-in-api");
    });
  });
});
