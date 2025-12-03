import { type Response, type NextFunction } from "express";
import {
  reserveStreamController,
  unreserveStreamController,
  getMatchStreamReservationsController
} from "./match-streams.controllers";
import {
  createStreamReservation,
  deleteStreamReservation,
  getStreamReservationsByMatch
} from "../models/match-streams.models";
import {
  getMatchIs2xBO1,
  getMatchIdsWithSameExternalMatchRoomId
} from "../models/match.models";
import { ConflictError } from "../utils/errors";
import type {
  RequestWithParams,
  RequestWithParamsAndBody,
  Reservation
} from "@eggosystem/types";
import { ZodError } from "zod";

// Mock dependencies
jest.mock("../models/match-streams.models");
jest.mock("../models/match.models");

const mockCreateStreamReservation =
  createStreamReservation as jest.MockedFunction<
    typeof createStreamReservation
  >;
const mockDeleteStreamReservation =
  deleteStreamReservation as jest.MockedFunction<
    typeof deleteStreamReservation
  >;
const mockGetStreamReservationsByMatch =
  getStreamReservationsByMatch as jest.MockedFunction<
    typeof getStreamReservationsByMatch
  >;
const mockGetMatchIs2xBO1 = getMatchIs2xBO1 as jest.MockedFunction<
  typeof getMatchIs2xBO1
>;
const _mockGetMatchIdsWithSameExternalMatchRoomId =
  getMatchIdsWithSameExternalMatchRoomId as jest.MockedFunction<
    typeof getMatchIdsWithSameExternalMatchRoomId
  >;

const mockReservation: Reservation = {
  id: 1,
  stream_url: "https://twitch.tv/test",
  hash: "test-hash",
  match_id: 123,
  account_id: 1
};

describe("match-streams controllers", () => {
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();

    res = {
      status: statusMock,
      json: jsonMock
    };

    jest.clearAllMocks();
  });

  describe("reserveStreamController", () => {
    const mockReq = {
      auth: {
        account_id: 1,
        provider_id: "12345",
        permissions: [],
        roles: ["caster"],
        nickname: "testcaster",
        provider: "steam"
      },
      params: { match_id: "123" },
      body: {
        stream_url: "https://twitch.tv/testcaster",
        reserve_both_games: false
      }
    } as unknown as RequestWithParamsAndBody<
      { match_id: string },
      { stream_url: string; reserve_both_games: boolean }
    >;

    it("should successfully reserve a stream for a caster", async () => {
      mockGetMatchIs2xBO1.mockResolvedValue(false);
      mockCreateStreamReservation.mockResolvedValue(mockReservation);

      await reserveStreamController(mockReq, res as Response, next);

      expect(mockCreateStreamReservation).toHaveBeenCalledWith({
        match_id: 123,
        account_id: 1,
        stream_url: "https://twitch.tv/testcaster"
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Stream reserved successfully",
        reservations: [mockReservation]
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid stream URL", async () => {
      const invalidUrlReq = {
        ...mockReq,
        body: { stream_url: "not-a-url" }
      } as unknown as RequestWithParamsAndBody<
        { match_id: string },
        { stream_url: string; reserve_both_games: boolean }
      >;

      // The controller now lets ZodError bubble up, so it should be thrown
      await expect(
        reserveStreamController(invalidUrlReq, res as Response, next)
      ).rejects.toThrow(ZodError);

      expect(mockCreateStreamReservation).not.toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should handle conflict when match already reserved", async () => {
      mockGetMatchIs2xBO1.mockResolvedValue(false);
      const conflictError = new ConflictError(
        "You have already reserved this match for streaming"
      );
      mockCreateStreamReservation.mockRejectedValue(conflictError);

      await expect(
        reserveStreamController(mockReq, res as Response, next)
      ).rejects.toThrow(ConflictError);

      expect(mockCreateStreamReservation).toHaveBeenCalledWith({
        match_id: 123,
        account_id: 1,
        stream_url: "https://twitch.tv/testcaster"
      });
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe("unreserveStreamController", () => {
    const mockReq = {
      auth: {
        account_id: 1,
        provider_id: "12345",
        permissions: [],
        roles: ["caster"],
        nickname: "testcaster",
        provider: "steam"
      },
      params: { match_id: "123" }
    } as unknown as RequestWithParams<{ match_id: string }>;

    it("should successfully unreserve a stream", async () => {
      mockDeleteStreamReservation.mockResolvedValue(true);

      await unreserveStreamController(mockReq, res as Response, next);

      expect(mockDeleteStreamReservation).toHaveBeenCalledWith(123, 1);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Stream reservation removed successfully"
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 404 if no reservation found", async () => {
      mockDeleteStreamReservation.mockResolvedValue(false);

      await unreserveStreamController(mockReq, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No stream reservation found for this match",
          status: 404
        })
      );
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      mockDeleteStreamReservation.mockRejectedValue(dbError);

      await expect(
        unreserveStreamController(mockReq, res as Response, next)
      ).rejects.toThrow("Database connection failed");

      expect(mockDeleteStreamReservation).toHaveBeenCalledWith(123, 1);
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe("getMatchStreamReservationsController", () => {
    const mockReq = {
      params: { match_id: "123" }
    } as RequestWithParams<{ match_id: string }>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return stream URLs for match", async () => {
      const mockReservations = [
        { ...mockReservation, stream_url: "https://twitch.tv/caster1" },
        { ...mockReservation, id: 2, stream_url: "https://twitch.tv/caster2" }
      ];

      mockGetStreamReservationsByMatch.mockResolvedValue(mockReservations);

      await getMatchStreamReservationsController(mockReq, res as Response);

      expect(mockGetStreamReservationsByMatch).toHaveBeenCalledWith(123);
      expect(jsonMock).toHaveBeenCalledWith({
        streamUrls: ["https://twitch.tv/caster1", "https://twitch.tv/caster2"]
      });
    });

    it("should return empty array when no reservations found", async () => {
      mockGetStreamReservationsByMatch.mockResolvedValue([]);

      await getMatchStreamReservationsController(mockReq, res as Response);

      expect(mockGetStreamReservationsByMatch).toHaveBeenCalledWith(123);
      expect(jsonMock).toHaveBeenCalledWith({
        streamUrls: []
      });
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      mockGetStreamReservationsByMatch.mockRejectedValue(dbError);

      await expect(
        getMatchStreamReservationsController(mockReq, res as Response)
      ).rejects.toThrow("Database connection failed");

      expect(mockGetStreamReservationsByMatch).toHaveBeenCalledWith(123);
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });
});
