import { type Response } from "express";
import { populateKanaeloQueueController } from "./kanaelo.controllers";
import * as kanaeloModels from "../models/kanaelo.models";
import * as rabbitmqServices from "../services/rabbitmq.services";
import type { RequestWithParams } from "@eggosystem/types";
import { BadRequestError } from "../utils/errors";

// Mock the models and services
jest.mock("../models/kanaelo.models");
jest.mock("../services/rabbitmq.services");

describe("Kanaelo Controllers", () => {
  let mockRequest: Partial<RequestWithParams<Record<string, string>>>;
  let mockResponse: Partial<Response>;
  const mockKanaeloModels = kanaeloModels as jest.Mocked<typeof kanaeloModels>;
  const mockRabbitmqServices = rabbitmqServices as jest.Mocked<
    typeof rabbitmqServices
  >;

  beforeEach(() => {
    mockRequest = {
      params: {}
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("populateKanaeloQueueController", () => {
    it("should return 404 if no players found for the season", async () => {
      mockRequest.params = { season_id: "1" };
      mockKanaeloModels.getAllRegisteredPlayersForSeason.mockResolvedValue([]);

      const mockNext = jest.fn();
      await populateKanaeloQueueController(
        mockRequest as RequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockKanaeloModels.getAllRegisteredPlayersForSeason
      ).toHaveBeenCalledWith(1);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No players found for season 1",
          status: 404
        })
      );
      expect(
        mockRabbitmqServices.bulkPublishKanaeloCalculationRequests
      ).not.toHaveBeenCalled();
    });

    it("should publish players to the kanaelo queue and return success", async () => {
      const mockPlayers = ["76561197963921578", "76561197967885016"];
      const mockResult = {
        success: true,
        published: 2,
        total: 2
      };

      mockRequest.params = { season_id: "1" };
      mockKanaeloModels.getAllRegisteredPlayersForSeason.mockResolvedValue(
        mockPlayers
      );
      mockRabbitmqServices.bulkPublishKanaeloCalculationRequests.mockResolvedValue(
        mockResult
      );

      const mockNext = jest.fn();
      await populateKanaeloQueueController(
        mockRequest as RequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockKanaeloModels.getAllRegisteredPlayersForSeason
      ).toHaveBeenCalledWith(1);
      expect(
        mockRabbitmqServices.bulkPublishKanaeloCalculationRequests
      ).toHaveBeenCalledWith(mockPlayers, 1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message:
          "Successfully added 2 players to the kanaelo calculation queue",
        season_id: 1,
        total_players: 2,
        queued_players: 2,
        failed_players: 0
      });
    });

    it("should throw BadRequestError for invalid season ID", async () => {
      mockRequest.params = { season_id: "invalid" };

      const mockNext = jest.fn();
      await expect(
        populateKanaeloQueueController(
          mockRequest as RequestWithParams<{ season_id: string }>,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow(BadRequestError);

      expect(
        mockKanaeloModels.getAllRegisteredPlayersForSeason
      ).not.toHaveBeenCalled();
      expect(
        mockRabbitmqServices.bulkPublishKanaeloCalculationRequests
      ).not.toHaveBeenCalled();
    });

    it("should handle partial success when some players fail to be published", async () => {
      const mockPlayers = [
        "76561197963921578",
        "76561197967885016",
        "76561198001857963"
      ];
      const mockResult = {
        success: true,
        published: 2,
        total: 3
      };

      mockRequest.params = { season_id: "1" };
      mockKanaeloModels.getAllRegisteredPlayersForSeason.mockResolvedValue(
        mockPlayers
      );
      mockRabbitmqServices.bulkPublishKanaeloCalculationRequests.mockResolvedValue(
        mockResult
      );

      const mockNext = jest.fn();
      await populateKanaeloQueueController(
        mockRequest as RequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockKanaeloModels.getAllRegisteredPlayersForSeason
      ).toHaveBeenCalledWith(1);
      expect(
        mockRabbitmqServices.bulkPublishKanaeloCalculationRequests
      ).toHaveBeenCalledWith(mockPlayers, 1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message:
          "Successfully added 2 players to the kanaelo calculation queue",
        season_id: 1,
        total_players: 3,
        queued_players: 2,
        failed_players: 1
      });
    });
  });
});
