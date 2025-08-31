import { type Response, type NextFunction } from "express";
import {
  reserveStreamController,
  unreserveStreamController
} from "./match-streams.controllers";
import {
  createStreamReservation,
  deleteStreamReservation
} from "../models/match-streams.models";
import { getRolesForAccountId } from "../services/auth.services";
import { ConflictError } from "../utils/errors";
import type {
  RequestWithParams,
  RequestWithBody,
  Reservation
} from "@eggosystem/types";

// Mock dependencies
jest.mock("../models/match-streams.models");
jest.mock("../services/auth.services");

const mockCreateStreamReservation =
  createStreamReservation as jest.MockedFunction<
    typeof createStreamReservation
  >;
const mockDeleteStreamReservation =
  deleteStreamReservation as jest.MockedFunction<
    typeof deleteStreamReservation
  >;
const mockGetRolesForAccountId = getRolesForAccountId as jest.MockedFunction<
  typeof getRolesForAccountId
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
      body: { stream_url: "https://twitch.tv/testcaster" }
    } as unknown as RequestWithParams<{ match_id: string }> &
      RequestWithBody<{ stream_url: string }>;

    it("should successfully reserve a stream for a caster", async () => {
      mockGetRolesForAccountId.mockResolvedValue(["caster"]);
      mockCreateStreamReservation.mockResolvedValue(mockReservation);

      await reserveStreamController(mockReq, res as Response, next);

      expect(mockGetRolesForAccountId).toHaveBeenCalledWith(1);
      expect(mockCreateStreamReservation).toHaveBeenCalledWith({
        match_id: 123,
        account_id: 1,
        stream_url: "https://twitch.tv/testcaster"
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Stream reserved successfully",
        reservation: mockReservation
      });
    });

    it("should return 401 if user is not authenticated", async () => {
      const unauthReq = { ...mockReq, auth: undefined };

      await reserveStreamController(
        unauthReq as unknown as RequestWithParams<{ match_id: string }> &
          RequestWithBody<{ stream_url: string }>,
        res as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
          status: 401
        })
      );
    });

    it("should return 403 if user doesn't have caster role", async () => {
      mockGetRolesForAccountId.mockResolvedValue(["player"]);

      await reserveStreamController(mockReq, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Caster role required",
          status: 403
        })
      );
    });

    it("should return 400 for invalid match ID", async () => {
      const invalidReq = { ...mockReq, params: { match_id: "invalid" } };

      await reserveStreamController(
        invalidReq as unknown as RequestWithParams<{ match_id: string }> &
          RequestWithBody<{ stream_url: string }>,
        res as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid match ID",
          status: 400
        })
      );
    });

    it("should return 400 for invalid stream URL", async () => {
      const invalidUrlReq = { ...mockReq, body: { stream_url: "not-a-url" } };
      mockGetRolesForAccountId.mockResolvedValue(["caster"]);

      await reserveStreamController(
        invalidUrlReq as unknown as RequestWithParams<{ match_id: string }> &
          RequestWithBody<{ stream_url: string }>,
        res as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid request data",
          status: 400
        })
      );
    });

    it("should handle conflict when match already reserved", async () => {
      mockGetRolesForAccountId.mockResolvedValue(["caster"]);
      const conflictError = new ConflictError(
        "You have already reserved this match for streaming"
      );
      mockCreateStreamReservation.mockRejectedValue(conflictError);

      await reserveStreamController(mockReq, res as Response, next);

      expect(next).toHaveBeenCalledWith(conflictError);
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
      mockGetRolesForAccountId.mockResolvedValue(["caster"]);
      mockDeleteStreamReservation.mockResolvedValue(true);

      await unreserveStreamController(mockReq, res as Response, next);

      expect(mockDeleteStreamReservation).toHaveBeenCalledWith(123, 1);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Stream reservation removed successfully"
      });
    });

    it("should return 404 if no reservation found", async () => {
      mockGetRolesForAccountId.mockResolvedValue(["caster"]);
      mockDeleteStreamReservation.mockResolvedValue(false);

      await unreserveStreamController(mockReq, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No stream reservation found for this match",
          status: 404
        })
      );
    });
  });
});
