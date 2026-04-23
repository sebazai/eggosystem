import { Router } from "express";
import request from "supertest";
import { createExpressTestApp } from "../../test-utils/express-app-setup";
import { removeReservationByRemovalTokenController } from "../../controllers/match-streams.controllers";
import { removeReservationByRemovalTokenWithSeasonId } from "../../models/match-streams.models";

jest.mock("../../models/match-streams.models");

const mockRemoveReservationByRemovalTokenWithSeasonId =
  removeReservationByRemovalTokenWithSeasonId as jest.MockedFunction<
    typeof removeReservationByRemovalTokenWithSeasonId
  >;

describe("POST /api/v1/reservations/remove", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("removes reservation with valid token", async () => {
    const token = "a".repeat(64);
    mockRemoveReservationByRemovalTokenWithSeasonId.mockResolvedValue({
      deleted: true,
      season_id: 12
    });

    const router = Router();
    router.post(
      "/reservations/remove",
      removeReservationByRemovalTokenController
    );

    const { app, cleanup } = createExpressTestApp(router, "/api/v1");
    const res = await request(app)
      .post("/api/v1/reservations/remove")
      .send({ token });
    cleanup();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: "Stream reservation removed successfully",
      season_id: 12
    });
    expect(
      mockRemoveReservationByRemovalTokenWithSeasonId
    ).toHaveBeenCalledWith(token);
  });

  it("returns RFC7807 404 and does not remove with invalid token", async () => {
    const token = "b".repeat(64);
    mockRemoveReservationByRemovalTokenWithSeasonId.mockResolvedValue({
      deleted: false,
      season_id: null
    });

    const router = Router();
    router.post(
      "/reservations/remove",
      removeReservationByRemovalTokenController
    );

    const { app, cleanup } = createExpressTestApp(router, "/api/v1");
    const res = await request(app)
      .post("/api/v1/reservations/remove")
      .send({ token });
    cleanup();

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toContain("application/problem+json");
    expect(res.body).toMatchObject({
      type: "about:blank",
      title: "Not Found",
      status: 404
    });
    expect(
      mockRemoveReservationByRemovalTokenWithSeasonId
    ).toHaveBeenCalledWith(token);
  });
});
