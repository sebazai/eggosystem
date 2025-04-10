import { type Request, type Response, type NextFunction } from "express";
import parseQueryParams from "../../middlewares/parse-query-params.middleware";

describe("parseParams Middleware", () => {
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
    req.params = { leaderboard: "top" };

    parseQueryParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: [1, 2],
      map_ids: [3, 4],
      league_ids: [5, 6],
      stages: [7, 8],
      team_ids: [9, 10],
      leaderboard: "top"
    });
    expect(next).toHaveBeenCalled();
  });

  it("should handle array-style query params correctly", () => {
    req.query = {
      season_ids: ["11", "12"],
      league_ids: ["13", "14"]
    };

    parseQueryParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: [11, 12],
      league_ids: [13, 14],
      map_ids: null,
      stages: null,
      team_ids: null,
      leaderboard: undefined
    });
    expect(next).toHaveBeenCalled();
  });

  it('should handle "any" values correctly by setting them to null', () => {
    req.params = { leaderboard: "any" };

    parseQueryParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: null,
      map_ids: null,
      league_ids: null,
      stages: null,
      team_ids: null,
      leaderboard: null
    });
    expect(next).toHaveBeenCalled();
  });

  it("should return null for missing params instead of NaN", () => {
    req.query = {}; // No params provided

    parseQueryParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: null,
      map_ids: null,
      league_ids: null,
      stages: null,
      team_ids: null,
      leaderboard: undefined
    });
    expect(next).toHaveBeenCalled();
  });

  it("should handle partial params correctly", () => {
    req.query = {
      season_ids: "1",
      league_ids: "2"
    };
    req.params = { leaderboard: "any" };

    parseQueryParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: [1],
      league_ids: [2],
      map_ids: null,
      stages: null,
      team_ids: null,
      leaderboard: null
    });
    expect(next).toHaveBeenCalled();
  });

  it("should correctly ignore empty params", () => {
    req.query = {
      season_ids: "",
      league_ids: ""
    };

    parseQueryParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: null,
      league_ids: null,
      map_ids: null,
      stages: null,
      team_ids: null,
      leaderboard: undefined
    });
    expect(next).toHaveBeenCalled();
  });

  it("should correctly parse mixed valid and empty params", () => {
    req.query = {
      season_ids: "1,2",
      league_ids: ""
    };

    parseQueryParams(req as Request, res as Response, next);

    expect(req.parsedParams).toEqual({
      season_ids: [1, 2],
      league_ids: null,
      map_ids: null,
      stages: null,
      team_ids: null,
      leaderboard: undefined
    });
    expect(next).toHaveBeenCalled();
  });
});
