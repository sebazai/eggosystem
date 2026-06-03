import request from "supertest";
import express, { type RequestHandler } from "express";
import { Router } from "express";
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../../../services/auth.services";
import { checkPermissions } from "../../../middlewares/auth.middleware";
import { expressErrorHandler } from "../../../middlewares/express-error-handler";
import demoRouter from "./demo.routes";
import { setupFrontendUrl } from "../../../test-utils/environment-setup";
import { getMatchIdByGameId } from "../../../models/match-game.models";
import { getHubMatchesByExternalMatchRoomId } from "../../../models/match.models";
import { publishToParseQueue } from "../../../services/parse-queue.services";
import { resolveOrCreateMatchGameIdForDemoUrl } from "../../../services/faceit-match.services";
import { resolveOrCreateMatchGameIdForHubMatchDemo } from "../../../services/faceit-match.services";
import { attachFailedParseJobSse } from "../../../services/failed-parse-sse.services";
import { replayGrandFinalPlacements } from "../../../services/replay-grand-final-placements.services";

jest.mock("../../../services/auth.services", () => ({
  getPermissionsForAccountId: jest.fn(),
  getRolesForAccountId: jest.fn()
}));

jest.mock("../../../models/match-game.models", () => ({
  getMatchIdByGameId: jest.fn(),
  listMatchGamesForMatch: jest.fn(),
  isChampionshipMatchGame: jest.fn().mockResolvedValue(false)
}));

jest.mock("../../../services/allstar.services", () => ({
  sendDemoForAllStarPOTGClip: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock("../../../models/match.models", () => ({
  getHubMatchesByExternalMatchRoomId: jest.fn()
}));

jest.mock("../../../services/parse-queue.services", () => ({
  publishToParseQueue: jest.fn(),
  createDemoProcessingRequest: jest.requireActual(
    "../../../services/parse-queue.services"
  ).createDemoProcessingRequest
}));

jest.mock("../../../services/faceit-match.services", () => ({
  resolveOrCreateMatchGameIdForDemoUrl: jest.fn(),
  resolveOrCreateMatchGameIdForHubMatchDemo: jest.fn()
}));

jest.mock("../../../models/failed-parse.models", () => ({
  getFailedParseMessages: jest.fn(),
  getFailedParseMessagesCount: jest.fn(),
  getFailedParseMessageById: jest.fn(),
  reparseFailedMessages: jest.fn(),
  getFailedParseMessagesStats: jest.fn()
}));

jest.mock("../../../services/failed-parse-sse.services", () => ({
  attachFailedParseJobSse: jest.fn(async (_req, res) => {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.end();
  })
}));

jest.mock("../../../services/replay-grand-final-placements.services", () => ({
  replayGrandFinalPlacements: jest.fn()
}));

const mockGetPermissions = jest.mocked(getPermissionsForAccountId);
const mockGetRoles = jest.mocked(getRolesForAccountId);
const mockGetMatchIdByGameId = jest.mocked(getMatchIdByGameId);
const mockGetHubMatchesByExternalMatchRoomId = jest.mocked(
  getHubMatchesByExternalMatchRoomId
);
const mockPublishToParseQueue = jest.mocked(publishToParseQueue);
const mockResolveOrCreateMatchGameIdForDemoUrl = jest.mocked(
  resolveOrCreateMatchGameIdForDemoUrl
);
const mockResolveOrCreateMatchGameIdForHubMatchDemo = jest.mocked(
  resolveOrCreateMatchGameIdForHubMatchDemo
);
const mockReplayGrandFinalPlacements = jest.mocked(replayGrandFinalPlacements);

const testAuthHeader = "x-test-auth";

const placementsNotRequested = {
  applied: false,
  skipped_reason: "not_requested",
  season_id: null,
  league_id: null,
  updated: [] as Array<{
    team_id: number;
    placement: number;
    team_name: string;
  }>
};

const attachTestAuth: RequestHandler = (req, _res, next) => {
  if (req.get(testAuthHeader) === "none") {
    return next();
  }
  req.auth = {
    account_id: 99,
    provider: "steam",
    provider_id: "76561198000000099",
    permissions: [],
    roles: [],
    nickname: "Staff",
    jti: "jti"
  };
  next();
};

function createDemoDashboardTestApp() {
  const cleanup = setupFrontendUrl();
  const wrapped = Router();
  wrapped.use(attachTestAuth);
  wrapped.use(
    checkPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
    demoRouter
  );

  const app = express();
  app.use(express.json());
  app.use("/api/v1/dashboard/demos", wrapped);
  app.use(expressErrorHandler);
  return { app, cleanup };
}

describe("POST /api/v1/dashboard/demos/manual/parse-queue", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when no match identifier is provided", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        download_url: "https://example.com/demo.dem.zst"
      });

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({
      status: 400,
      issues: expect.any(Array)
    });
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns 400 when multiple match identifiers are provided", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        match_id: 2,
        download_url: "https://example.com/demo.dem.zst"
      });

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({
      status: 400,
      issues: expect.any(Array)
    });
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns 401 when unauthenticated", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .set(testAuthHeader, "none")
      .send({
        match_game_id: 1,
        download_url: "https://example.com/demo.dem.zst"
      });

    expect(res.status).toBe(401);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({
      status: 401,
      title: "Unauthorized",
      detail: "Forbidden: Requires authentication"
    });
    cleanup();
  });

  it("returns 403 for player role (not global staff)", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["player"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "https://example.com/demo.dem.zst"
      });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      status: 403,
      title: "Forbidden"
    });
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns 403 for caster role", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["caster"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "https://example.com/demo.dem.zst"
      });

    expect(res.status).toBe(403);
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("enqueues for admin with HTTPS URL and propagates parse message contract", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 42, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);

    const url =
      "https://cdn.example.com/very/long/path/segment/demo-file-name-goes-here.dem.zst";
    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 7,
        download_url: url,
        priority: 3
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "enqueued",
      match_game_id: 7,
      mark_finished: {
        applied: false,
        match_ids: [],
        end_timestamp: null,
        skipped_reason: "not_requested"
      },
      placements: placementsNotRequested
    });

    expect(mockPublishToParseQueue).toHaveBeenCalledTimes(1);
    const msg = mockPublishToParseQueue.mock.calls[0][0];
    expect(msg).toMatchObject({
      match_game_id: "7",
      download_url: url,
      priority: 3,
      source: "manual",
      reparse: false
    });
    expect(typeof msg.created_at).toBe("string");

    cleanup();
  });

  it("resolves/creates match_game_id from match_id (+ optional map_order) like faceit and enqueues", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockResolveOrCreateMatchGameIdForHubMatchDemo.mockResolvedValue(77);
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 42, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_id: 42,
        map_order: 1,
        download_url: "https://example.com/demo.dem.zst",
        priority: 2,
        reparse: true
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "enqueued",
      match_game_id: 77,
      mark_finished: {
        applied: false,
        match_ids: [],
        end_timestamp: null,
        skipped_reason: "not_requested"
      },
      placements: placementsNotRequested
    });
    expect(mockResolveOrCreateMatchGameIdForHubMatchDemo).toHaveBeenCalledWith(
      expect.objectContaining({ matchId: 42, mapOrder: 1 })
    );
    expect(mockPublishToParseQueue).toHaveBeenCalledTimes(1);
    const msg = mockPublishToParseQueue.mock.calls[0][0];
    expect(msg).toMatchObject({
      match_game_id: "77",
      priority: 2,
      source: "manual",
      reparse: true
    });
    cleanup();
  });

  it("resolves match_game_id from external_match_room_id + demo url (faceit-like) and enqueues", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue([
      { id: 101, status: "FINISHED" }
    ]);
    mockResolveOrCreateMatchGameIdForDemoUrl.mockResolvedValue(555);
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 101, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);

    const demoUrl =
      "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/room-xyz-1-1.dem.zst";
    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        external_match_room_id: "room-xyz",
        download_url: demoUrl
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "enqueued",
      match_game_id: 555,
      mark_finished: {
        applied: false,
        match_ids: [],
        end_timestamp: null,
        skipped_reason: "not_requested"
      },
      placements: placementsNotRequested
    });
    expect(mockResolveOrCreateMatchGameIdForDemoUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        externalMatchRoomId: "room-xyz",
        demoUrl
      })
    );
    expect(mockPublishToParseQueue).toHaveBeenCalledTimes(1);
    const msg = mockPublishToParseQueue.mock.calls[0][0];
    expect(msg).toMatchObject({
      match_game_id: "555",
      download_url: demoUrl,
      source: "faceit",
      reparse: false
    });
    cleanup();
  });

  it("returns 404 when external_match_room_id has no matches", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue([]);

    const demoUrl =
      "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/room-empty-1-1.dem.zst";
    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        external_match_room_id: "room-empty",
        download_url: demoUrl
      });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 404,
      title: "Not Found",
      detail: "No matches found for external_match_room_id"
    });
    expect(mockResolveOrCreateMatchGameIdForDemoUrl).not.toHaveBeenCalled();
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("enqueues for helpdesk role (global staff)", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["helpdesk"]);
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 1, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 2,
        download_url: "https://example.com/x.dem.zst"
      });

    expect(res.status).toBe(200);
    expect(mockPublishToParseQueue).toHaveBeenCalled();
    cleanup();
  });

  it("returns 400 with Zod issues for non-HTTPS URL", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "http://example.com/demo.dem"
      });

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({
      status: 400,
      issues: expect.any(Array)
    });
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns 400 when priority is out of range", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "https://example.com/demo.dem.zst",
        priority: 11
      });

    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns 400 for invalid URL string", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "not-a-url"
      });

    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
    cleanup();
  });

  it("returns 404 when match game does not exist", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockGetMatchIdByGameId.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 999999,
        download_url: "https://example.com/demo.dem.zst"
      });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 404,
      title: "Not Found",
      detail: "Match game not found"
    });
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns application/problem+json when RabbitMQ publish fails", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 1, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockRejectedValue(new Error("amqp broke"));

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "https://example.com/demo.dem.zst"
      });

    // Generic Error instances default to status 400 in express-error-handler
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 400,
      detail: "amqp broke"
    });
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    cleanup();
  });

  it("attaches SSE stream for admin", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app).get(
      "/api/v1/dashboard/demos/failed/parse/events"
    );

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
    expect(attachFailedParseJobSse).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      99
    );
    cleanup();
  });

  it("returns 403 for helpdesk on SSE stream", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["helpdesk"]);

    const res = await request(app).get(
      "/api/v1/dashboard/demos/failed/parse/events"
    );

    expect(res.status).toBe(403);
    expect(attachFailedParseJobSse).not.toHaveBeenCalled();
    cleanup();
  });
});

describe("POST /api/v1/dashboard/demos/placements/replay-grand-final", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when no identifier is provided", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/placements/replay-grand-final")
      .send({});

    expect(res.status).toBe(400);
    expect(mockReplayGrandFinalPlacements).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns 400 when multiple identifier modes are provided", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/placements/replay-grand-final")
      .send({ match_id: 1, external_match_room_id: "room-1" });

    expect(res.status).toBe(400);
    expect(mockReplayGrandFinalPlacements).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns 400 when only season_id is provided", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/placements/replay-grand-final")
      .send({ season_id: 17 });

    expect(res.status).toBe(400);
    expect(mockReplayGrandFinalPlacements).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns 200 and replays placements by season and league", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockReplayGrandFinalPlacements.mockResolvedValue({
      applied: true,
      season_id: 17,
      league_id: 3,
      stage_id: 2,
      external_match_room_id: "room-gf",
      placements: [
        { team_id: 1, placement: 1, team_name: "Team 1" },
        { team_id: 2, placement: 2, team_name: "Team 2" },
        { team_id: 3, placement: 3, team_name: "Team 3" }
      ],
      skipped_reason: null
    });

    const res = await request(app)
      .post("/api/v1/dashboard/demos/placements/replay-grand-final")
      .send({ season_id: 17, league_id: 3 });

    expect(res.status).toBe(200);
    expect(mockReplayGrandFinalPlacements).toHaveBeenCalledWith({
      season_id: 17,
      league_id: 3
    });
    cleanup();
  });

  it("returns 200 and replays placements for helpdesk", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["helpdesk"]);
    mockReplayGrandFinalPlacements.mockResolvedValue({
      applied: true,
      season_id: 17,
      league_id: 3,
      stage_id: 2,
      external_match_room_id: "room-gf",
      placements: [
        { team_id: 1, placement: 1, team_name: "Team 1" },
        { team_id: 2, placement: 2, team_name: "Team 2" }
      ],
      skipped_reason: null
    });

    const res = await request(app)
      .post("/api/v1/dashboard/demos/placements/replay-grand-final")
      .send({ match_id: 42 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      applied: true,
      season_id: 17,
      league_id: 3,
      stage_id: 2,
      external_match_room_id: "room-gf",
      placements: [
        { team_id: 1, placement: 1, team_name: "Team 1" },
        { team_id: 2, placement: 2, team_name: "Team 2" }
      ],
      skipped_reason: null
    });
    expect(mockReplayGrandFinalPlacements).toHaveBeenCalledWith({
      match_id: 42
    });
    cleanup();
  });

  it("returns 403 for player role", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["player"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/placements/replay-grand-final")
      .send({ external_match_room_id: "room-1" });

    expect(res.status).toBe(403);
    expect(mockReplayGrandFinalPlacements).not.toHaveBeenCalled();
    cleanup();
  });
});
