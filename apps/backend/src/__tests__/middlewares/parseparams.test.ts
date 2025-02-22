/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import parseParams from "../../middlewares/parseParams";

describe("parseParams Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: {},
    };
    res = {};
    next = jest.fn();
  });

  it("should parse params correctly when all params are provided", () => {
    req.params = {
      season_id: "1",
      map_id: "1",
      league_id: "2",
      stage: "3",
      team_id: "4",
      leaderboard: "top",
    };

    parseParams(req as Request, res as Response, next);

    expect((req as any).parsedParams).toEqual({
      season_id: 1,
      map_id: 1,
      league_id: 2,
      stage: 3,
      team_id: 4,
      leaderboard: "top",
    });
    expect(next).toHaveBeenCalled();
  });

  it('should handle "any" values correctly', () => {
    req.params = {
      season_id: "any",
      map_id: "any",
      league_id: "any",
      stage: "any",
      team_id: "any",
      leaderboard: "any",
    };

    parseParams(req as Request, res as Response, next);

    expect((req as any).parsedParams).toEqual({
      season_id: undefined,
      map_id: undefined,
      league_id: undefined,
      stage: undefined,
      team_id: undefined,
      leaderboard: undefined,
    });
    expect(next).toHaveBeenCalled();
  });

  it("should handle missing params correctly", () => {
    req.params = {};

    parseParams(req as Request, res as Response, next);

    expect((req as any).parsedParams).toEqual({
      season_id: NaN,
      map_id: undefined,
      league_id: NaN,
      stage: NaN,
      team_id: NaN,
      leaderboard: undefined,
    });
    expect(next).toHaveBeenCalled();
  });

  it("should handle partial params correctly", () => {
    req.params = {
      season_id: "1",
      map_id: "any",
      league_id: "2",
    };

    parseParams(req as Request, res as Response, next);

    expect((req as any).parsedParams).toEqual({
      season_id: 1,
      map_id: undefined,
      league_id: 2,
      stage: NaN,
      team_id: NaN,
      leaderboard: undefined,
    });
    expect(next).toHaveBeenCalled();
  });
});
