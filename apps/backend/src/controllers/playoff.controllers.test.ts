import { type Request, type Response } from "express";
import { getPlayoffBracketController } from "./playoff.controllers";
import * as seasonLeagueExternalIdModels from "../models/season-league-external-id.models";
import * as playoffBracketServices from "../services/playoff-bracket.services";
import * as faceitBracketServices from "../services/faceit-bracket.services";
import * as matchModels from "../models/match.models";
import * as seasonLeagueTeamModels from "../models/season-league-team.models";
import * as teamModels from "../models/team.models";

jest.mock("../models/season-league-external-id.models");
jest.mock("../services/playoff-bracket.services");
jest.mock("../services/faceit-bracket.services");
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
const mockGetChampionshipBracketMatchesCached =
  faceitBracketServices.getChampionshipBracketMatchesCached as jest.MockedFunction<
    typeof faceitBracketServices.getChampionshipBracketMatchesCached
  >;
const mockGetPlayoffMatchIds =
  matchModels.getPlayoffMatchIdsByTeamPairs as jest.MockedFunction<
    typeof matchModels.getPlayoffMatchIdsByTeamPairs
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
      expect(mockGetChampionshipBracketMatchesCached).not.toHaveBeenCalled();
      expect(mockGetChampionshipMatchesCached).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        matches: [],
        bracket: { numR1Slots: 0 }
      });
    });

    it("returns matches and bracket with numR1Slots from seeds when FaceIT returns items", async () => {
      const championshipId = "champ-1";
      mockGetPlayoffExternalId.mockResolvedValue(championshipId);
      mockGetChampionshipBracketMatchesCached.mockResolvedValue([
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
      mockGetChampionshipMatchesCached.mockResolvedValue([]);
      // key format: "{group}-{minTeamId}-{maxTeamId}" → group=1, teams 10 and 20
      mockGetPlayoffMatchIds.mockResolvedValue(new Map([["1-10-20", 100]]));
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

      expect(mockGetChampionshipBracketMatchesCached).toHaveBeenCalledWith(
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
      mockGetChampionshipBracketMatchesCached.mockResolvedValue([
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
      mockGetChampionshipMatchesCached.mockResolvedValue([]);
      // key: group=1, teams 100 and 200
      mockGetPlayoffMatchIds.mockResolvedValue(new Map([["1-100-200", 1]]));
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

      mockGetChampionshipBracketMatchesCached.mockResolvedValue([
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
      mockGetChampionshipMatchesCached.mockResolvedValue([]);

      // All factions map to unknown team IDs (empty map) so teamPairKey is null; map unused.
      mockGetPlayoffMatchIds.mockResolvedValue(new Map());
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

    it("orders lower bracket R2+ by api_index (not scoreKey) when seeds are known", async () => {
      // LB R2 cross-seeding: Loser of last UB R2 match (e.g. seeds 6,3) goes to slot 0,
      // Loser of first UB R2 match (e.g. seeds 8,1) goes to the last slot.
      // FaceIT API returns LB R2 matches in slot order: slot0 first, slot1 last.
      // scoreKey (seedPos minimum) would produce the reverse: seed 8 (pos 2) < seed 6 (pos 14)
      // so scoreKey puts the slot-1 match first — wrong. apiIndexMap must be primary.
      mockGetPlayoffExternalId.mockResolvedValue("champ-lb-r2");

      mockGetChampionshipBracketMatchesCached.mockResolvedValue([
        // LB R1 match — needed so firstLowerBracketRound=1 and round=2 is treated as R2+
        {
          match_id: "lb-r1-seeds",
          round: 1,
          group: 2,
          status: "FINISHED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: { faction_id: "f1", name: "T1", avatar: "" },
            faction2: { faction_id: "f16", name: "T16", avatar: "" }
          },
          results: { score: { faction1: 1, faction2: 0 } }
        },
        // LB R2 slot 0: seeds 6 and 9 → scoreKey min = seedPos(9)=3
        {
          match_id: "lb-r2-slot0",
          round: 2,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: { faction_id: "f6", name: "T6", avatar: "" },
            faction2: { faction_id: "f9", name: "T9", avatar: "" }
          }
        },
        // LB R2 slot 1: seeds 8 and 11 → scoreKey min = seedPos(8)=2 (LOWER than slot0's 3)
        // Old scoreKey would put this match first (wrong). api_index keeps slot0 first (correct).
        {
          match_id: "lb-r2-slot1",
          round: 2,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: { faction_id: "f8", name: "T8", avatar: "" },
            faction2: { faction_id: "f11", name: "T11", avatar: "" }
          }
        }
      ]);
      mockGetChampionshipMatchesCached.mockResolvedValue([]);

      mockGetPlayoffMatchIds.mockResolvedValue(
        new Map([
          // group=2, "{min}-{max}" team IDs
          ["2-101-116", 1], // lb-r1-seeds: f1(101) vs f16(116)
          ["2-106-109", 2], // lb-r2-slot0: f6(106) vs f9(109)
          ["2-108-111", 3] // lb-r2-slot1: f8(108) vs f11(111)
        ])
      );
      mockGetTeamIdsByExternalIds.mockResolvedValue(
        new Map([
          ["f1", 101],
          ["f16", 116],
          ["f6", 106],
          ["f9", 109],
          ["f8", 108],
          ["f11", 111]
        ])
      );
      mockGetTeamLogosByTeamIds.mockResolvedValue(new Map());
      mockGetPlayoffSeedMap.mockResolvedValue(
        new Map([
          [101, 1],
          [116, 16],
          [106, 6],
          [109, 9],
          [108, 8],
          [111, 11]
        ])
      );

      await getPlayoffBracketController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const [payload] = (mockResponse.json as jest.Mock).mock.calls[0];
      const lbR2Matches = payload.matches.filter(
        (m: { group: number; round: number }) => m.group === 2 && m.round === 2
      );
      expect(lbR2Matches[0].external_match_id).toBe("lb-r2-slot0");
      expect(lbR2Matches[1].external_match_id).toBe("lb-r2-slot1");
      expect(lbR2Matches[0].slot).toBe(0);
      expect(lbR2Matches[1].slot).toBe(1);
    });

    /**
     * 16-team lower bracket excerpt matching FaceIT-style UI (issue discussion / bracket review):
     * LB2 “Telia Akatemia” (#8, upper drop) vs “Valtori” (#3, LB R1 winner) with #8 on top even
     * though #3 is the better seed — API may list the feeder first.
     */
    it("lower bracket R2: upper dropper is team1 even when feeder has a better seed (#8 vs #3)", async () => {
      mockGetPlayoffExternalId.mockResolvedValue("champ-lb-faceit-order");

      const fin = (s1: number, s2: number) => ({
        score: { faction1: s1, faction2: s2 }
      });

      const team = (id: string, name: string) => ({
        faction_id: id,
        name,
        avatar: ""
      });

      mockGetChampionshipBracketMatchesCached.mockResolvedValue([
        {
          match_id: "lb-r1-1",
          round: 1,
          group: 2,
          status: "FINISHED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: team("fs16", "T16"),
            faction2: team("fs9", "T9")
          },
          results: fin(2, 1)
        },
        {
          match_id: "lb-r1-2",
          round: 1,
          group: 2,
          status: "FINISHED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: team("fs13", "T13"),
            faction2: team("fs12", "T12")
          },
          results: fin(2, 0)
        },
        {
          match_id: "lb-r1-3",
          round: 1,
          group: 2,
          status: "FINISHED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: team("fs15", "T15"),
            faction2: team("fs10", "T10")
          },
          results: fin(1, 2)
        },
        {
          match_id: "lb-r1-4",
          round: 1,
          group: 2,
          status: "FINISHED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: team("fs3", "Valtori"),
            faction2: team("fs11", "T11")
          },
          results: fin(2, 0)
        },
        {
          match_id: "lb-r2-1",
          round: 2,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: team("fs6", "T6"),
            faction2: team("fs16", "T16")
          }
        },
        {
          match_id: "lb-r2-2",
          round: 2,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: team("fs2", "T2"),
            faction2: team("fs13", "T13")
          }
        },
        {
          match_id: "lb-r2-3",
          round: 2,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: team("fs5", "T5"),
            faction2: team("fs10", "T10")
          }
        },
        {
          match_id: "lb-r2-8v3",
          round: 2,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: team("fs3", "Valtori"),
            faction2: team("fs8", "Telia")
          }
        }
      ]);
      mockGetChampionshipMatchesCached.mockResolvedValue([]);

      const tid = (seed: number) => 1000 + seed;
      // key format: "{group}-{minTeamId}-{maxTeamId}", all group=2 (lower bracket)
      mockGetPlayoffMatchIds.mockResolvedValue(
        new Map([
          [`2-${tid(9)}-${tid(16)}`, 1], // lb-r1-1: fs16(1016) vs fs9(1009)
          [`2-${tid(12)}-${tid(13)}`, 2], // lb-r1-2: fs13(1013) vs fs12(1012)
          [`2-${tid(10)}-${tid(15)}`, 3], // lb-r1-3: fs15(1015) vs fs10(1010)
          [`2-${tid(3)}-${tid(11)}`, 4], // lb-r1-4: fs3(1003) vs fs11(1011)
          [`2-${tid(6)}-${tid(16)}`, 5], // lb-r2-1: fs6(1006) vs fs16(1016)
          [`2-${tid(2)}-${tid(13)}`, 6], // lb-r2-2: fs2(1002) vs fs13(1013)
          [`2-${tid(5)}-${tid(10)}`, 7], // lb-r2-3: fs5(1005) vs fs10(1010)
          [`2-${tid(3)}-${tid(8)}`, 8] // lb-r2-8v3: fs3(1003) vs fs8(1008)
        ])
      );
      const factions: [string, number][] = [
        ["fs16", tid(16)],
        ["fs9", tid(9)],
        ["fs13", tid(13)],
        ["fs12", tid(12)],
        ["fs15", tid(15)],
        ["fs10", tid(10)],
        ["fs3", tid(3)],
        ["fs11", tid(11)],
        ["fs6", tid(6)],
        ["fs2", tid(2)],
        ["fs5", tid(5)],
        ["fs8", tid(8)]
      ];
      mockGetTeamIdsByExternalIds.mockResolvedValue(new Map(factions));
      mockGetTeamLogosByTeamIds.mockResolvedValue(new Map());
      mockGetPlayoffSeedMap.mockResolvedValue(
        new Map(factions.map(([, id]) => [id, id - 1000] as const))
      );

      await getPlayoffBracketController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const [payload] = (mockResponse.json as jest.Mock).mock.calls[0];
      const m = payload.matches.find(
        (x: { external_match_id: string }) =>
          x.external_match_id === "lb-r2-8v3"
      );
      expect(m).toBeDefined();
      expect(m.slot).toBe(3);
      expect(m.seed1).toBe(8);
      expect(m.seed2).toBe(3);
      expect(m.team1_id).toBe(tid(8));
      expect(m.team2_id).toBe(tid(3));
    });

    it("orders lower bracket R1 by api_index over UUID lexicographic order when seeds resolve to same slot", async () => {
      mockGetPlayoffExternalId.mockResolvedValue("champ-lb2");

      mockGetChampionshipBracketMatchesCached.mockResolvedValue([
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
      mockGetChampionshipMatchesCached.mockResolvedValue([]);

      // All factions unknown (empty team map) so teamPairKey is null; map unused.
      mockGetPlayoffMatchIds.mockResolvedValue(new Map());
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

    it("links grand final to its own DB match when the same two teams also met in the upper bracket", async () => {
      // Regression: AirTap vs Evitec in UB round 4 AND grand final — old code keyed only by
      // team pair so both cards pointed to the earlier (UB) match.
      mockGetPlayoffExternalId.mockResolvedValue("champ-rematch");
      mockGetChampionshipBracketMatchesCached.mockResolvedValue([
        {
          match_id: "ub-r4",
          round: 4,
          group: 1,
          status: "FINISHED",
          best_of: 3,
          scheduled_at: 1000,
          teams: {
            faction1: { faction_id: "fa", name: "AirTap", avatar: "" },
            faction2: { faction_id: "fe", name: "Evitec", avatar: "" }
          },
          results: { score: { faction1: 2, faction2: 1 } }
        },
        {
          match_id: "gf-1",
          round: 1,
          group: 3,
          status: "FINISHED",
          best_of: 3,
          scheduled_at: 2000,
          teams: {
            faction1: { faction_id: "fa", name: "AirTap", avatar: "" },
            faction2: { faction_id: "fe", name: "Evitec", avatar: "" }
          },
          results: { score: { faction1: 2, faction2: 0 } }
        }
      ]);
      mockGetChampionshipMatchesCached.mockResolvedValue([]);
      mockGetTeamIdsByExternalIds.mockResolvedValue(
        new Map([
          ["fa", 10],
          ["fe", 20]
        ])
      );
      mockGetTeamLogosByTeamIds.mockResolvedValue(new Map());
      mockGetPlayoffSeedMap.mockResolvedValue(
        new Map([
          [10, 1],
          [20, 2]
        ])
      );
      // Two distinct DB match IDs: 41 for UB (group 1), 99 for grand final (group 3)
      mockGetPlayoffMatchIds.mockResolvedValue(
        new Map([
          ["1-10-20", 41],
          ["3-10-20", 99]
        ])
      );

      await getPlayoffBracketController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const [payload] = (mockResponse.json as jest.Mock).mock.calls[0];
      const ubMatch = payload.matches.find(
        (m: { external_match_id: string }) => m.external_match_id === "ub-r4"
      );
      const gfMatch = payload.matches.find(
        (m: { external_match_id: string }) => m.external_match_id === "gf-1"
      );
      expect(ubMatch.match_id).toBe(41);
      expect(gfMatch.match_id).toBe(99);
    });

    it("treats FaceIT BYE encoded as faction_id 'bye' as BYE (8-team brackets commonly do this)", async () => {
      mockGetPlayoffExternalId.mockResolvedValue(
        "e5bd9711-296a-4fa8-9d52-ec9a8604cd81"
      );
      mockGetChampionshipBracketMatchesCached.mockResolvedValue([
        {
          match_id: "ub-r1-bye",
          round: 1,
          group: 1,
          status: "FINISHED",
          best_of: 3,
          scheduled_at: 1000,
          teams: {
            faction1: { faction_id: "t1", name: "Team 1", avatar: "" },
            faction2: { faction_id: "bye", name: "TBD", avatar: "" }
          },
          results: { score: { faction1: 1, faction2: 0 } }
        }
      ]);
      mockGetChampionshipMatchesCached.mockResolvedValue([]);
      // BYE match: team2Id=null, no pair key built, map unused
      mockGetPlayoffMatchIds.mockResolvedValue(new Map());
      mockGetTeamIdsByExternalIds.mockResolvedValue(new Map([["t1", 10]]));
      mockGetTeamLogosByTeamIds.mockResolvedValue(new Map());
      mockGetPlayoffSeedMap.mockResolvedValue(new Map([[10, 1]]));

      await getPlayoffBracketController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const [payload] = (mockResponse.json as jest.Mock).mock.calls[0];
      expect(payload.matches[0].team2_id).toBeNull();
      expect(payload.matches[0].team2_name).toBe("BYE");
    });

    it("treats empty/unknown opponent (waiting slot from upper bracket drop) as TBD, not BYE", async () => {
      mockGetPlayoffExternalId.mockResolvedValue(
        "3acda697-c6ac-4ff5-b37a-5b11efffe77d"
      );
      mockGetChampionshipBracketMatchesCached.mockResolvedValue([
        {
          match_id: "lb-r6-waiting",
          round: 6,
          group: 2,
          status: "SCHEDULED",
          best_of: 3,
          scheduled_at: 0,
          teams: {
            faction1: { faction_id: "t1", name: "Team 1", avatar: "" },
            faction2: { faction_id: "", name: "TBD", avatar: "" }
          }
        }
      ]);
      mockGetChampionshipMatchesCached.mockResolvedValue([]);
      // TBD match: unknown faction → team2Id=0, no pair key built, map unused
      mockGetPlayoffMatchIds.mockResolvedValue(new Map());
      mockGetTeamIdsByExternalIds.mockResolvedValue(new Map([["t1", 10]]));
      mockGetTeamLogosByTeamIds.mockResolvedValue(new Map());
      mockGetPlayoffSeedMap.mockResolvedValue(new Map([[10, 1]]));

      await getPlayoffBracketController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const [payload] = (mockResponse.json as jest.Mock).mock.calls[0];
      expect(payload.matches[0].team2_id).toBeNull();
      expect(payload.matches[0].team2_name).toBe("TBD");
    });
  });
});
