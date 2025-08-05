import { type Request, type Response, type NextFunction } from "express";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";

describe("parseFilterParams Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      query: {},
      params: {}
    };
    res = {};
    next = jest.fn();
  });

  it("should parse query params correctly when all params are provided", () => {
    req.query = {
      season_ids: "1,2",
      map_ids: "3,4",
      league_ids: "5,6",
      stages: "7,8",
      team_ids: "9,10"
    };

    parseQueryFilterParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: [1, 2],
      map_ids: [3, 4],
      league_ids: [5, 6],
      stages: [7, 8],
      team_ids: [9, 10],
      playerName: null,
      cs2_rank_max: null,
      cs2_rank_min: null,
      faceit_level: null,
      tier: null
    });
    expect(next).toHaveBeenCalled();
  });

  it("should handle array-style query params correctly", () => {
    req.query = {
      season_ids: ["11", "12"],
      league_ids: ["13", "14"]
    };

    parseQueryFilterParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: [11, 12],
      league_ids: [13, 14],
      map_ids: null,
      playerName: null,
      stages: null,
      team_ids: null,
      cs2_rank_max: null,
      cs2_rank_min: null,
      faceit_level: null,
      tier: null
    });
    expect(next).toHaveBeenCalled();
  });

  it('should handle "any" values correctly by setting them to null', () => {
    parseQueryFilterParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: null,
      map_ids: null,
      league_ids: null,
      playerName: null,
      stages: null,
      team_ids: null,
      cs2_rank_max: null,
      cs2_rank_min: null,
      faceit_level: null,
      tier: null
    });
    expect(next).toHaveBeenCalled();
  });

  it("should return null for missing params instead of NaN", () => {
    req.query = {}; // No params provided

    parseQueryFilterParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: null,
      map_ids: null,
      league_ids: null,
      stages: null,
      playerName: null,
      team_ids: null,
      cs2_rank_max: null,
      cs2_rank_min: null,
      faceit_level: null,
      tier: null
    });
    expect(next).toHaveBeenCalled();
  });

  it("should handle partial params correctly", () => {
    req.query = {
      season_ids: "1",
      league_ids: "2"
    };

    parseQueryFilterParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: [1],
      league_ids: [2],
      map_ids: null,
      playerName: null,
      stages: null,
      team_ids: null,
      cs2_rank_max: null,
      cs2_rank_min: null,
      faceit_level: null,
      tier: null
    });
    expect(next).toHaveBeenCalled();
  });

  it("should correctly ignore empty params", () => {
    req.query = {
      season_ids: "",
      league_ids: ""
    };

    parseQueryFilterParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: null,
      league_ids: null,
      map_ids: null,
      playerName: null,
      stages: null,
      team_ids: null,
      cs2_rank_max: null,
      cs2_rank_min: null,
      faceit_level: null,
      tier: null
    });
    expect(next).toHaveBeenCalled();
  });

  it("should correctly parse mixed valid and empty params", () => {
    req.query = {
      season_ids: "1,2",
      league_ids: ""
    };

    parseQueryFilterParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: [1, 2],
      league_ids: null,
      map_ids: null,
      playerName: null,
      stages: null,
      team_ids: null,
      cs2_rank_max: null,
      cs2_rank_min: null,
      faceit_level: null,
      tier: null
    });
    expect(next).toHaveBeenCalled();
  });

  it("should correctly parse numeric filter params", () => {
    req.query = {
      faceit_level: "8",
      cs2_rank_min: "15",
      cs2_rank_max: "18",
      tier: "2"
    };

    parseQueryFilterParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: null,
      league_ids: null,
      map_ids: null,
      playerName: null,
      stages: null,
      team_ids: null,
      cs2_rank_max: 18,
      cs2_rank_min: 15,
      faceit_level: 8,
      tier: 2
    });
    expect(next).toHaveBeenCalled();
  });
});
