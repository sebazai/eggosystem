import { type Response, type NextFunction } from "express";
import {
  reserveStreamController,
  unreserveStreamController
} from "./match-streams.controllers";
import {
  createStreamReservation,
  deleteStreamReservation
} from "../models/match-streams.models";
import { ConflictError } from "../utils/errors";
import type {
  RequestWithParams,
  RequestWithParamsAndBody,
  Reservation
} from "@eggosystem/types";
import { ZodError } from "zod";

// Mock dependencies
jest.mock("../models/match-streams.models");

const mockCreateStreamReservation =
  createStreamReservation as jest.MockedFunction<
    typeof createStreamReservation
  >;
const mockDeleteStreamReservation =
  deleteStreamReservation as jest.MockedFunction<
    typeof deleteStreamReservation
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
});
