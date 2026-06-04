import type { Request, Response, NextFunction } from "express";
import { cacheResponseMiddleware } from "./cache-filtered-queries";
import { getOrganizerActiveOrLatestSeasonForAppId } from "../models/season.models";
import { redisClient } from "../utils/redisClient";

jest.mock("../models/season.models");
jest.mock("../utils/redisClient", () => ({
  redisClient: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK")
  },
  expireIn7Days: 604800
}));
jest.mock("../utils/app-logger", () => ({
  logger: { info: jest.fn(), error: jest.fn() }
}));
jest.mock("../utils/normalize-parsed-params", () => ({
  normalizeParsedParams: jest.fn((params: unknown) => params)
}));

const mockGetActiveOrLatestSeason =
  getOrganizerActiveOrLatestSeasonForAppId as jest.MockedFunction<
    typeof getOrganizerActiveOrLatestSeasonForAppId
  >;
const mockRedis = redisClient as jest.Mocked<typeof redisClient>;

const emptyParams = {
  season_ids: null,
  league_ids: null,
  team_ids: null,
  stages: null,
  map_ids: null,
  player_name: null,
  faceit_level: null,
  cs2_rank_min: null,
  cs2_rank_max: null,
  tier: null
};

function buildReqRes(
  parsedParams: Record<string, unknown>,
  path = "/teams"
): { req: Request; res: Response; next: NextFunction } {
  const req = { parsedParams, path } as unknown as Request;
  const res = {
    statusCode: 200,
    json: jest.fn().mockReturnThis()
  } as unknown as Response;
  const next = jest.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe("cacheResponseMiddleware", () => {
  const middleware = cacheResponseMiddleware({ cachePrefix: "filters:" });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue("OK");
  });

  it("checks the current CS2 (org 1 / app 730) season instead of skipping the guard", async () => {
    // Regression: the guard used to read organizer_id/app_id off req.query,
    // which /filters never sends, so it silently never ran. It must resolve the
    // current season unconditionally.
    mockGetActiveOrLatestSeason.mockResolvedValue({ season_id: 11 } as never);
    const { req, res, next } = buildReqRes({ ...emptyParams, season_ids: [5] });

    await middleware(req, res, next);

    expect(mockGetActiveOrLatestSeason).toHaveBeenCalledWith(1, 730);
  });

  it("does not cache when the filter includes the current season", async () => {
    mockGetActiveOrLatestSeason.mockResolvedValue({ season_id: 11 } as never);
    const { req, res, next } = buildReqRes({
      ...emptyParams,
      season_ids: [11]
    });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockRedis.get).not.toHaveBeenCalled();
  });

  it("does not cache season-less filtered queries while a season is current", async () => {
    mockGetActiveOrLatestSeason.mockResolvedValue({ season_id: 11 } as never);
    const { req, res, next } = buildReqRes({
      ...emptyParams,
      season_ids: [],
      league_ids: [1]
    });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockRedis.get).not.toHaveBeenCalled();
  });

  it("caches when the filter does not touch the current season", async () => {
    mockGetActiveOrLatestSeason.mockResolvedValue({ season_id: 11 } as never);
    mockRedis.get.mockResolvedValue(null);
    const { req, res, next } = buildReqRes({ ...emptyParams, season_ids: [5] });

    await middleware(req, res, next);

    expect(mockRedis.get).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);

    // res.json is now wrapped; a 200 body should be written to the cache.
    res.json({ standingsLeagues: [] });
    expect(mockRedis.set).toHaveBeenCalledWith(
      expect.stringContaining("filters:/teams:"),
      JSON.stringify({ standingsLeagues: [] }),
      "EX",
      604800
    );
  });
});
