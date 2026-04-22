import { Router, type RequestHandler } from "express";
import request from "supertest";
import {
  reserveStreamController,
  unreserveStreamController,
  getMatchStreamReservationsController,
  removeReservationByRemovalTokenController
} from "./match-streams.controllers";
import {
  createStreamReservation,
  deleteStreamReservation,
  getStreamReservationsByMatch,
  removeReservationByRemovalTokenWithSeasonId
} from "../models/match-streams.models";
import {
  getMatchIs2xBO1,
  getMatchIdsWithSameExternalMatchRoomId
} from "../models/match.models";
import { createExpressTestApp } from "../test-utils";
import { createMockReservation } from "@eggosystem/types";

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
const mockRemoveReservationByRemovalTokenWithSeasonId =
  removeReservationByRemovalTokenWithSeasonId as jest.MockedFunction<
    typeof removeReservationByRemovalTokenWithSeasonId
  >;
const mockGetMatchIs2xBO1 = getMatchIs2xBO1 as jest.MockedFunction<
  typeof getMatchIs2xBO1
>;
const _mockGetMatchIdsWithSameExternalMatchRoomId =
  getMatchIdsWithSameExternalMatchRoomId as jest.MockedFunction<
    typeof getMatchIdsWithSameExternalMatchRoomId
  >;

const mockReservation = createMockReservation({
  id: 1,
  stream_url: "https://twitch.tv/test",
  hash: "test-hash",
  match_id: 123,
  account_id: 1
});

describe("match-streams controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("reserveStreamController", () => {
    const authMiddleware: RequestHandler = (req, _res, next) => {
      const accountIdHeader = req.header("x-account-id");
      const account_id = accountIdHeader ? Number(accountIdHeader) : 1;

      req.auth = {
        account_id,
        provider_id: "12345",
        permissions: [],
        roles: ["caster"],
        nickname: "testcaster",
        provider: "steam"
      };
      next();
    };

    const router = Router();
    router.post(
      "/matches/:match_id/reserve-cast",
      authMiddleware,
      reserveStreamController
    );

    const { app, cleanup } = createExpressTestApp(router);
    afterEach(() => cleanup());

    it("should successfully reserve a stream for a caster", async () => {
      mockGetMatchIs2xBO1.mockResolvedValue(false);
      mockCreateStreamReservation.mockResolvedValue(mockReservation);

      const res = await request(app)
        .post("/matches/123/reserve-cast")
        .set("x-account-id", "1")
        .send({
          stream_url: "https://twitch.tv/testcaster",
          reserve_both_games: false
        });

      expect(mockCreateStreamReservation).toHaveBeenCalledWith({
        match_id: 123,
        account_id: 1,
        stream_url: "https://twitch.tv/testcaster"
      });
      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: "Stream reserved successfully",
        reservations: [mockReservation]
      });
    });

    it("should return 400 for invalid stream URL", async () => {
      const res = await request(app)
        .post("/matches/123/reserve-cast")
        .send({ stream_url: "not-a-url", reserve_both_games: false });

      expect(res.status).toBe(400);
      expect(mockCreateStreamReservation).not.toHaveBeenCalled();
    });

    it("should handle conflict when match already reserved", async () => {
      mockGetMatchIs2xBO1.mockResolvedValue(false);
      mockCreateStreamReservation.mockRejectedValue(
        new Error("You have already reserved this match for streaming")
      );

      const res = await request(app).post("/matches/123/reserve-cast").send({
        stream_url: "https://twitch.tv/testcaster",
        reserve_both_games: false
      });

      expect(mockCreateStreamReservation).toHaveBeenCalledWith({
        match_id: 123,
        account_id: 1,
        stream_url: "https://twitch.tv/testcaster"
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("unreserveStreamController", () => {
    const authMiddleware: RequestHandler = (req, _res, next) => {
      const accountIdHeader = req.header("x-account-id");
      const account_id = accountIdHeader ? Number(accountIdHeader) : 1;

      req.auth = {
        account_id,
        provider_id: "12345",
        permissions: [],
        roles: ["caster"],
        nickname: "testcaster",
        provider: "steam"
      };
      next();
    };

    const router = Router();
    router.delete(
      "/matches/:match_id/reserve-cast",
      authMiddleware,
      unreserveStreamController
    );

    const { app, cleanup } = createExpressTestApp(router);
    afterEach(() => cleanup());

    it("should successfully unreserve a stream", async () => {
      mockDeleteStreamReservation.mockResolvedValue(true);

      const res = await request(app)
        .delete("/matches/123/reserve-cast")
        .set("x-account-id", "1");

      expect(mockDeleteStreamReservation).toHaveBeenCalledWith(123, 1);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Stream reservation removed successfully"
      });
    });

    it("should return 404 if no reservation found", async () => {
      mockDeleteStreamReservation.mockResolvedValue(false);

      const res = await request(app)
        .delete("/matches/123/reserve-cast")
        .set("x-account-id", "1");

      expect(res.status).toBe(404);
    });

    it("should scope deletion to authenticated user (IDOR regression)", async () => {
      mockDeleteStreamReservation.mockResolvedValue(true);

      await request(app)
        .delete("/matches/123/reserve-cast")
        .set("x-account-id", "1001");

      expect(mockDeleteStreamReservation).toHaveBeenCalledWith(123, 1001);
    });
  });

  describe("getMatchStreamReservationsController", () => {
    const router = Router();
    router.get(
      "/matches/:match_id/streams",
      getMatchStreamReservationsController
    );
    const { app, cleanup } = createExpressTestApp(router);
    afterEach(() => cleanup());

    it("should return stream URLs for match", async () => {
      const mockReservations = [
        { ...mockReservation, stream_url: "https://twitch.tv/caster1" },
        { ...mockReservation, id: 2, stream_url: "https://twitch.tv/caster2" }
      ];

      mockGetStreamReservationsByMatch.mockResolvedValue(mockReservations);

      const res = await request(app).get("/matches/123/streams");

      expect(mockGetStreamReservationsByMatch).toHaveBeenCalledWith(123);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        streamUrls: ["https://twitch.tv/caster1", "https://twitch.tv/caster2"]
      });
    });

    it("should return empty array when no reservations found", async () => {
      mockGetStreamReservationsByMatch.mockResolvedValue([]);

      const res = await request(app).get("/matches/123/streams");

      expect(mockGetStreamReservationsByMatch).toHaveBeenCalledWith(123);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        streamUrls: []
      });
    });
  });

  describe("removeReservationByRemovalTokenController", () => {
    const router = Router();
    router.post(
      "/reservations/remove",
      removeReservationByRemovalTokenController
    );
    const { app, cleanup } = createExpressTestApp(router);
    afterEach(() => cleanup());

    it("should remove reservation for valid token", async () => {
      const token = "a".repeat(64);
      mockRemoveReservationByRemovalTokenWithSeasonId.mockResolvedValueOnce({
        deleted: true,
        season_id: 12
      });

      const res = await request(app)
        .post("/reservations/remove")
        .send({ token });

      expect(
        mockRemoveReservationByRemovalTokenWithSeasonId
      ).toHaveBeenCalledWith(token);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Stream reservation removed successfully",
        season_id: 12
      });
    });

    it("should return 404 for invalid token without leaking existence", async () => {
      const token = "b".repeat(64);
      mockRemoveReservationByRemovalTokenWithSeasonId.mockResolvedValueOnce({
        deleted: false,
        season_id: null
      });

      const res = await request(app)
        .post("/reservations/remove")
        .send({ token });
      expect(res.status).toBe(404);
    });

    it("should return 400 when token param missing", async () => {
      const res = await request(app)
        .post("/reservations/remove")
        .send({ token: "" });
      expect(res.status).toBe(400);
    });
  });
});
