import { type Response, type NextFunction } from "express";
import {
  getPlayoffSeedLeaguesController,
  getPlayoffSeedsController,
  putPlayoffSeedsController
} from "./playoff-seeds.controllers";
import * as seasonLeagueModels from "../../models/season-league.models";
import * as seasonLeagueTeamModels from "../../models/season-league-team.models";

jest.mock("../../models/season-league.models");
jest.mock("../../models/season-league-team.models");

const mockGetSeasonLeaguesWithMappingsBySeasonId =
  seasonLeagueModels.getSeasonLeaguesWithMappingsBySeasonId as jest.MockedFunction<
    typeof seasonLeagueModels.getSeasonLeaguesWithMappingsBySeasonId
  >;
const mockGetPlayoffSeedsBySeasonAndLeague =
  seasonLeagueTeamModels.getPlayoffSeedsBySeasonAndLeague as jest.MockedFunction<
    typeof seasonLeagueTeamModels.getPlayoffSeedsBySeasonAndLeague
  >;
const mockUpdatePlayoffSeeds =
  seasonLeagueTeamModels.updatePlayoffSeeds as jest.MockedFunction<
    typeof seasonLeagueTeamModels.updatePlayoffSeeds
  >;

describe("playoff-seeds.controllers", () => {
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockResponse = { json: jest.fn() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("getPlayoffSeedLeaguesController", () => {
    it("returns leagues for season", async () => {
      mockGetSeasonLeaguesWithMappingsBySeasonId.mockResolvedValue([
        {
          season_id: 14,
          league_id: 1,
          league_name: "Masters",
          tier: 1,
          mappings_count: 1,
          mappings: "[]"
        },
        {
          season_id: 14,
          league_id: 2,
          league_name: "Challengers",
          tier: 2,
          mappings_count: 0,
          mappings: "[]"
        }
      ]);

      await getPlayoffSeedLeaguesController(
        { params: { season_id: "14" } } as Parameters<
          typeof getPlayoffSeedLeaguesController
        >[0],
        mockResponse as Response,
        mockNext
      );

      expect(mockGetSeasonLeaguesWithMappingsBySeasonId).toHaveBeenCalledWith(
        14
      );
      expect(mockResponse.json).toHaveBeenCalledWith([
        { league_id: 1, league_name: "Masters", tier: 1 },
        { league_id: 2, league_name: "Challengers", tier: 2 }
      ]);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("calls next(BadRequestError) for invalid season_id", async () => {
      await getPlayoffSeedLeaguesController(
        { params: { season_id: "x" } } as Parameters<
          typeof getPlayoffSeedLeaguesController
        >[0],
        mockResponse as Response,
        mockNext
      );

      expect(mockGetSeasonLeaguesWithMappingsBySeasonId).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid season_id" })
      );
    });
  });

  describe("getPlayoffSeedsController", () => {
    it("returns teams with playoff seeds", async () => {
      mockGetPlayoffSeedsBySeasonAndLeague.mockResolvedValue([
        { team_id: 10, team_name: "Team A", playoff_seed: 1 },
        { team_id: 20, team_name: "Team B", playoff_seed: 2 }
      ]);

      await getPlayoffSeedsController(
        {
          params: { season_id: "14", league_id: "1" }
        } as Parameters<typeof getPlayoffSeedsController>[0],
        mockResponse as Response,
        mockNext
      );

      expect(mockGetPlayoffSeedsBySeasonAndLeague).toHaveBeenCalledWith(14, 1);
      expect(mockResponse.json).toHaveBeenCalledWith([
        { team_id: 10, team_name: "Team A", playoff_seed: 1 },
        { team_id: 20, team_name: "Team B", playoff_seed: 2 }
      ]);
    });

    it("calls next(BadRequestError) for invalid season_id", async () => {
      await getPlayoffSeedsController(
        {
          params: { season_id: "x", league_id: "1" }
        } as Parameters<typeof getPlayoffSeedsController>[0],
        mockResponse as Response,
        mockNext
      );

      expect(mockGetPlayoffSeedsBySeasonAndLeague).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid season_id or league_id"
        })
      );
    });

    it("calls next(BadRequestError) for invalid league_id", async () => {
      await getPlayoffSeedsController(
        {
          params: { season_id: "14", league_id: "y" }
        } as Parameters<typeof getPlayoffSeedsController>[0],
        mockResponse as Response,
        mockNext
      );

      expect(mockGetPlayoffSeedsBySeasonAndLeague).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid season_id or league_id"
        })
      );
    });
  });

  describe("putPlayoffSeedsController", () => {
    it("updates seeds and returns teams", async () => {
      mockUpdatePlayoffSeeds.mockResolvedValue(undefined);
      mockGetPlayoffSeedsBySeasonAndLeague.mockResolvedValue([
        { team_id: 10, team_name: "Team A", playoff_seed: 2 },
        { team_id: 20, team_name: "Team B", playoff_seed: 1 }
      ]);

      await putPlayoffSeedsController(
        {
          params: { season_id: "14", league_id: "1" },
          body: {
            seeds: [
              { team_id: 10, playoff_seed: 2 },
              { team_id: 20, playoff_seed: 1 }
            ]
          }
        } as Parameters<typeof putPlayoffSeedsController>[0],
        mockResponse as Response,
        mockNext
      );

      expect(mockUpdatePlayoffSeeds).toHaveBeenCalledWith(14, 1, [
        { team_id: 10, playoff_seed: 2 },
        { team_id: 20, playoff_seed: 1 }
      ]);
      expect(mockGetPlayoffSeedsBySeasonAndLeague).toHaveBeenCalledWith(14, 1);
      expect(mockResponse.json).toHaveBeenCalledWith([
        { team_id: 10, team_name: "Team A", playoff_seed: 2 },
        { team_id: 20, team_name: "Team B", playoff_seed: 1 }
      ]);
    });

    it("filters invalid seed entries and updates with valid only", async () => {
      mockUpdatePlayoffSeeds.mockResolvedValue(undefined);
      mockGetPlayoffSeedsBySeasonAndLeague.mockResolvedValue([]);

      await putPlayoffSeedsController(
        {
          params: { season_id: "14", league_id: "1" },
          body: {
            seeds: [
              { team_id: 10, playoff_seed: 1 },
              { team_id: 20, playoff_seed: 0 },
              { team_id: 30, playoff_seed: 2 },
              null as unknown as { team_id: number; playoff_seed: number },
              { team_id: NaN, playoff_seed: 1 }
            ]
          }
        } as Parameters<typeof putPlayoffSeedsController>[0],
        mockResponse as Response,
        mockNext
      );

      expect(mockUpdatePlayoffSeeds).toHaveBeenCalledWith(14, 1, [
        { team_id: 10, playoff_seed: 1 },
        { team_id: 30, playoff_seed: 2 }
      ]);
    });

    it("calls next(BadRequestError) when body.seeds is not an array", async () => {
      await putPlayoffSeedsController(
        {
          params: { season_id: "14", league_id: "1" },
          body: {}
        } as Parameters<typeof putPlayoffSeedsController>[0],
        mockResponse as Response,
        mockNext
      );

      expect(mockUpdatePlayoffSeeds).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Body must include seeds array"
        })
      );
    });

    it("calls next(BadRequestError) for invalid params", async () => {
      await putPlayoffSeedsController(
        {
          params: { season_id: "n", league_id: "1" },
          body: { seeds: [{ team_id: 10, playoff_seed: 1 }] }
        } as Parameters<typeof putPlayoffSeedsController>[0],
        mockResponse as Response,
        mockNext
      );

      expect(mockUpdatePlayoffSeeds).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid season_id or league_id"
        })
      );
    });
  });
});
