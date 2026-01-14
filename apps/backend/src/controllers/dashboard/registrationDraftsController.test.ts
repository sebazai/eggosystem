import { getAllRegistrationDraftsController } from "./registration.controllers";
import { redisClient } from "../../utils/redisClient";
import type { Response } from "express";
import type { RequestWithParams } from "@eggosystem/types";
import { getDiscordUsernameByAccountId } from "../../models/discord.models";

jest.mock("../../utils/redisClient");
jest.mock("../../models/discord.models");

const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;
const mockGetDiscordUsernameByAccountId =
  getDiscordUsernameByAccountId as jest.MockedFunction<
    typeof getDiscordUsernameByAccountId
  >;

describe("getAllRegistrationDraftsController", () => {
  it("returns an empty array if no drafts exist", async () => {
    mockRedisClient.keys.mockResolvedValue([]);
    const req = {
      params: { season_id: "1" }
    } as unknown as RequestWithParams<{ season_id: string }>;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    await getAllRegistrationDraftsController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
    expect(mockGetDiscordUsernameByAccountId).not.toHaveBeenCalled();
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
    mockGetDiscordUsernameByAccountId.mockImplementation(
      async (accountId: number) => {
        if (accountId === 1) return "discord_user_1";
        if (accountId === 2) return "discord_user_2";
        return null;
      }
    );
    const req = {
      params: { season_id: "1" }
    } as unknown as RequestWithParams<{ season_id: string }>;
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
            nickname: "A",
            discord: "discord_user_1"
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
            nickname: "B",
            discord: "discord_user_2"
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
    mockGetDiscordUsernameByAccountId.mockResolvedValue(null);
    const req = {
      params: { season_id: "1" }
    } as unknown as RequestWithParams<{ season_id: string }>;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    await getAllRegistrationDraftsController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});
