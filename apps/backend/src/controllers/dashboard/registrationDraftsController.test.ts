import { getAllRegistrationDraftsController } from "../registration.controllers";
import { redisClient } from "../../../utils/redisClient";
import type { Request, Response } from "express";

jest.mock("../../../utils/redisClient");

const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;

describe("getAllRegistrationDraftsController", () => {
  it("returns an empty array if no drafts exist", async () => {
    mockRedisClient.keys.mockResolvedValue([]);
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    await getAllRegistrationDraftsController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("returns parsed drafts from redis", async () => {
    mockRedisClient.keys.mockResolvedValue(["signup-1", "signup-2"]);
    mockRedisClient.mget.mockResolvedValue([
      JSON.stringify({
        organizationId: 1,
        teamId: 1,
        captainHasReadTermAndConditions: true,
        players: [{ accountId: 1, steamId: "s1", nickname: "A" }]
      }),
      JSON.stringify({
        organizationId: 2,
        teamId: 2,
        captainHasReadTermAndConditions: true,
        players: [{ accountId: 2, steamId: "s2", nickname: "B" }]
      })
    ]);
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    await getAllRegistrationDraftsController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        organizationId: 1,
        teamId: 1,
        captainHasReadTermAndConditions: true,
        players: [
          expect.objectContaining({
            accountId: 1,
            steamId: "s1",
            nickname: "A"
          })
        ]
      }),
      expect.objectContaining({
        organizationId: 2,
        teamId: 2,
        captainHasReadTermAndConditions: true,
        players: [
          expect.objectContaining({
            accountId: 2,
            steamId: "s2",
            nickname: "B"
          })
        ]
      })
    ]);
  });

  it("filters out drafts with extra keys (invalid structure)", async () => {
    mockRedisClient.keys.mockResolvedValue(["signup-1"]);
    mockRedisClient.mget.mockResolvedValue([
      JSON.stringify({
        organizationId: 1,
        teamId: 1,
        captainHasReadTermAndConditions: true,
        players: [{ accountId: 1, steamId: "s1", nickname: "A" }],
        extraKey: "should not be here"
      })
    ]);
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    await getAllRegistrationDraftsController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});
