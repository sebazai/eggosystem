import type { Request, Response, NextFunction } from "express";
import {
  type MyTeamDetails,
  type MyTeamUpcomingMatch,
  createMockUserPayload
} from "@eggosystem/types";
import {
  getMyTeamsController,
  getMyTeamsUpcomingMatchesController
} from "./my-team.controllers";
import * as myTeamModels from "../models/my-team.models";

jest.mock("../models/my-team.models");

const mockGetMyTeams = myTeamModels.getMyTeams as jest.MockedFunction<
  typeof myTeamModels.getMyTeams
>;
const mockGetMyTeamsUpcomingMatches =
  myTeamModels.getMyTeamsUpcomingMatches as jest.MockedFunction<
    typeof myTeamModels.getMyTeamsUpcomingMatches
  >;

describe("My Team Controllers", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockReq = {
      auth: createMockUserPayload({
        account_id: 123,
        provider_id: "76561198000000001",
        nickname: "TestPlayer"
      }),
      query: {}
    };

    mockRes = {
      json: mockJson,
      status: mockStatus
    };

    mockNext = jest.fn();
  });

  describe("getMyTeamsController", () => {
    it("should return teams for authenticated user", async () => {
      const mockTeams: MyTeamDetails[] = [
        {
          team_id: 1,
          team_name: "Test Team",
          team_logo: "logo.png",
          season_id: 16,
          season_name: "Season 16",
          league_id: 1,
          league_name: "Division 1",
          external_team_id: "faceit-team-123",
          platform: "faceit",
          players: [
            {
              steam_id: "76561198000000001",
              nickname: "TestPlayer",
              is_captain: true,
              is_co_captain: false,
              role: "primary"
            },
            {
              steam_id: "76561198000000002",
              nickname: "Teammate",
              is_captain: false,
              is_co_captain: true,
              role: "primary"
            }
          ]
        }
      ];

      mockGetMyTeams.mockResolvedValue(mockTeams);

      await getMyTeamsController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockGetMyTeams).toHaveBeenCalledWith("76561198000000001");
      expect(mockJson).toHaveBeenCalledWith({ teams: mockTeams });
    });

    it("should return error if user is not authenticated", async () => {
      mockReq.auth = undefined;

      await getMyTeamsController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Unauthorized",
          status: 401
        })
      );
      expect(mockGetMyTeams).not.toHaveBeenCalled();
    });

    it("should return error if user is not authenticated via Steam", async () => {
      mockReq.auth = {
        account_id: 123,
        provider_id: "discord-123",
        permissions: [],
        roles: [],
        nickname: "TestPlayer",
        provider: "discord"
      };

      await getMyTeamsController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Unauthorized",
          status: 401
        })
      );
      expect(mockGetMyTeams).not.toHaveBeenCalled();
    });
  });

  describe("getMyTeamsUpcomingMatchesController", () => {
    it("should return upcoming matches for authenticated user", async () => {
      const mockMatches: MyTeamUpcomingMatch[] = [
        {
          match_id: 1,
          team_id: 1,
          team_name: "Test Team",
          opponent_team_id: 2,
          opponent_team_name: "Opponent Team",
          start_timestamp: "2025-11-15T18:00:00.000Z",
          season_id: 16,
          season_name: "Season 16",
          league_id: 1,
          league_name: "Division 1",
          best_of: 3,
          external_match_room_id: "faceit-match-456",
          status: "SCHEDULED",
          platform: "faceit"
        }
      ];

      mockGetMyTeamsUpcomingMatches.mockResolvedValue(mockMatches);

      await getMyTeamsUpcomingMatchesController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockGetMyTeamsUpcomingMatches).toHaveBeenCalledWith([
        "76561198000000001"
      ]);
      expect(mockJson).toHaveBeenCalledWith({ matches: mockMatches });
    });

    it("should return error if user is not authenticated", async () => {
      mockReq.auth = undefined;

      await getMyTeamsUpcomingMatchesController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Unauthorized",
          status: 401
        })
      );
      expect(mockGetMyTeamsUpcomingMatches).not.toHaveBeenCalled();
    });

    it("should return error if user is not authenticated via Steam", async () => {
      mockReq.auth = {
        account_id: 123,
        provider_id: "discord-123",
        permissions: [],
        roles: [],
        nickname: "TestPlayer",
        provider: "discord"
      };

      await getMyTeamsUpcomingMatchesController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Unauthorized",
          status: 401
        })
      );
      expect(mockGetMyTeamsUpcomingMatches).not.toHaveBeenCalled();
    });
  });
});
