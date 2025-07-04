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
      JSON.stringify({ team_name: "A" }),
      JSON.stringify({ team_name: "B" })
    ]);
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    await getAllRegistrationDraftsController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ team_name: "A", _redisKey: "signup-1" }),
      expect.objectContaining({ team_name: "B", _redisKey: "signup-2" })
    ]);
  });
});
