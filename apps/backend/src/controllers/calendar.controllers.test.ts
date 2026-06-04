import { type Response } from "express";
import { getMatchesByOrganizerAndAppController } from "./calendar.controllers";
import { getOrganizerActiveOrLatestSeasonForAppId } from "../models/season.models";
import { getMatchesBySeasonAndLeagueWithStreamUrls } from "../models/match.models";
import type { RequestWithParamsAndQuery } from "@eggosystem/types";

jest.mock("../models/season.models");
jest.mock("../models/match.models");

const mockGetSeason =
  getOrganizerActiveOrLatestSeasonForAppId as jest.MockedFunction<
    typeof getOrganizerActiveOrLatestSeasonForAppId
  >;
const mockGetMatches =
  getMatchesBySeasonAndLeagueWithStreamUrls as jest.MockedFunction<
    typeof getMatchesBySeasonAndLeagueWithStreamUrls
  >;

type CalendarReq = RequestWithParamsAndQuery<
  { organizer_id: string; app_id: string },
  { league_id?: string; gametype?: string }
>;

const makeReq = (
  params: Record<string, string>,
  query: Record<string, string> = {}
): CalendarReq => ({ params, query }) as unknown as CalendarReq;

describe("getMatchesByOrganizerAndAppController", () => {
  let json: jest.Mock;
  let status: jest.Mock;
  let res: Response;

  beforeEach(() => {
    jest.clearAllMocks();
    json = jest.fn().mockReturnThis();
    status = jest.fn().mockReturnThis();
    res = { json, status } as unknown as Response;
  });

  it("resolves the running-or-latest season and returns its matches", async () => {
    mockGetSeason.mockResolvedValue({ season_id: 42 } as never);
    mockGetMatches.mockResolvedValue([{ id: 1 }] as never);

    await getMatchesByOrganizerAndAppController(
      makeReq({ organizer_id: "1", app_id: "730" }, { gametype: "comp" }),
      res
    );

    expect(mockGetSeason).toHaveBeenCalledWith(1, 730, "comp");
    expect(mockGetMatches).toHaveBeenCalledWith(42, null);
    expect(json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it("returns 404 when no current or past season exists", async () => {
    mockGetSeason.mockResolvedValue(undefined as never);

    await getMatchesByOrganizerAndAppController(
      makeReq({ organizer_id: "1", app_id: "730" }),
      res
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(mockGetMatches).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid organizer/app params before touching the DB", async () => {
    await getMatchesByOrganizerAndAppController(
      makeReq({ organizer_id: "abc", app_id: "730" }),
      res
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(mockGetSeason).not.toHaveBeenCalled();
  });

  it("passes a numeric league_id through to the matches query", async () => {
    mockGetSeason.mockResolvedValue({ season_id: 42 } as never);
    mockGetMatches.mockResolvedValue([] as never);

    await getMatchesByOrganizerAndAppController(
      makeReq({ organizer_id: "1", app_id: "730" }, { league_id: "7" }),
      res
    );

    expect(mockGetMatches).toHaveBeenCalledWith(42, 7);
  });
});
