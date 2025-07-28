import { type Response } from "express";
import { getLeaguesBySeasonController } from "../leagues.controllers";
import { getLeaguesBySeason } from "../../models/league.models";
import type { RequestWithParams } from "@eggosystem/types";

// Mock the model
jest.mock("../../models/league.models");
const mockGetLeaguesBySeason = getLeaguesBySeason as jest.MockedFunction<
  typeof getLeaguesBySeason
>;

describe("getLeaguesBySeasonController", () => {
  let mockRequest: Partial<RequestWithParams<{ seasonId: string }>>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: { seasonId: "15" }
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return leagues for a valid season", async () => {
    const mockLeagues = [
      {
        id: 1,
        name: "Division 1",
        season_id: 15,
        tier: 1
      },
      {
        id: 2,
        name: "Division 2",
        season_id: 15,
        tier: 2
      }
    ];

    mockGetLeaguesBySeason.mockResolvedValue(mockLeagues);

    await getLeaguesBySeasonController(
      mockRequest as RequestWithParams<{ seasonId: string }>,
      mockResponse as Response
    );

    expect(mockGetLeaguesBySeason).toHaveBeenCalledWith(15);
    expect(mockJson).toHaveBeenCalledWith(mockLeagues);
  });

  it("should return empty array when season has no leagues", async () => {
    mockGetLeaguesBySeason.mockResolvedValue([]);

    await getLeaguesBySeasonController(
      mockRequest as RequestWithParams<{ seasonId: string }>,
      mockResponse as Response
    );

    expect(mockGetLeaguesBySeason).toHaveBeenCalledWith(15);
    expect(mockJson).toHaveBeenCalledWith([]);
  });

  it("should handle database errors", async () => {
    const error = new Error("Database connection failed");
    mockGetLeaguesBySeason.mockRejectedValue(error);

    await expect(
      getLeaguesBySeasonController(
        mockRequest as RequestWithParams<{ seasonId: string }>,
        mockResponse as Response
      )
    ).rejects.toThrow("Database connection failed");

    expect(mockGetLeaguesBySeason).toHaveBeenCalledWith(15);
  });
});
