import { type Request, type Response } from "express";
import { getKanaLeaderboardController } from "./kana-leaderboard.controllers";
import { getKanaLeaderboard } from "../services/kana-leaderboard.services";
import { BadRequestError } from "../utils/errors";
import { type KanaLeaderboardResponse } from "@eggosystem/types";

jest.mock("../services/kana-leaderboard.services", () => ({
  getKanaLeaderboard: jest.fn()
}));

const mockGetKanaLeaderboard = getKanaLeaderboard as jest.MockedFunction<
  typeof getKanaLeaderboard
>;

describe("getKanaLeaderboardController", () => {
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  const emptyResult: KanaLeaderboardResponse = { tier: null, players: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockResponse = { status: statusMock, json: jsonMock };
    mockGetKanaLeaderboard.mockResolvedValue(emptyResult);
  });

  const makeReq = (query: Record<string, unknown>): Request =>
    ({ query }) as unknown as Request;

  it("calls the service with no tier when ?tier is omitted", async () => {
    await getKanaLeaderboardController(
      makeReq({}),
      mockResponse as Response<KanaLeaderboardResponse>
    );

    expect(mockGetKanaLeaderboard).toHaveBeenCalledWith(undefined);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(emptyResult);
  });

  it("treats an empty ?tier as no filter", async () => {
    await getKanaLeaderboardController(
      makeReq({ tier: "" }),
      mockResponse as Response<KanaLeaderboardResponse>
    );

    expect(mockGetKanaLeaderboard).toHaveBeenCalledWith(undefined);
  });

  it("passes a valid tier through to the service", async () => {
    await getKanaLeaderboardController(
      makeReq({ tier: "CHICKEN_2" }),
      mockResponse as Response<KanaLeaderboardResponse>
    );

    expect(mockGetKanaLeaderboard).toHaveBeenCalledWith("CHICKEN_2");
  });

  it("throws BadRequestError for an invalid tier", async () => {
    await expect(
      getKanaLeaderboardController(
        makeReq({ tier: "NOT_A_TIER" }),
        mockResponse as Response<KanaLeaderboardResponse>
      )
    ).rejects.toBeInstanceOf(BadRequestError);

    expect(mockGetKanaLeaderboard).not.toHaveBeenCalled();
  });
});
