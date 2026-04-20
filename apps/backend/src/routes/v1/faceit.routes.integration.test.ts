/**
 * Integration tests: replay FACEIT webhooks from fixture files (3 rooms) in order,
 * POST to /api/v1/faceit/webhook, mock getFaceITMatchDetails with fixture details,
 * assert final Matches, MatchGames, and (when present) team scores per room.
 * Requires empty DB + full seed (runFaceitWebhookIntegrationSeed) before replay.
 */

const TEST_WEBHOOK_API_KEY = "test-faceit-webhook-integration-key";
process.env.FACEIT_WEBHOOK_API_KEY = TEST_WEBHOOK_API_KEY;

import * as fs from "fs";
import * as path from "path";
import request from "supertest";
import express from "express";
import faceitRouter from "./faceit.routes";
import { expressErrorHandler } from "../../middlewares/express-error-handler";
import { runFaceitWebhookIntegrationSeed } from "./faceit-webhook-integration-seed";
import { runQuery } from "../../db/mysqlRunQuery";
import * as faceitMatchServices from "../../services/faceit-match.services";
import * as seasonTeamPlayersModels from "../../models/season-team-players.models";

const ROOM_IDS = [
  "1-3e047cf2-6b8f-479b-8a47-7ca122a2116d",
  "1-d3b5d80b-4319-4eaa-a34c-4fc4d17a8d5f",
  "1-f55c14a9-b708-4abc-8ffb-be4993e469c1"
] as const;

function getFixturesDir(): string {
  const fromDir = path.join(__dirname, "fixtures", "faceit-webhooks");
  if (fs.existsSync(fromDir)) return fromDir;
  const fromCwd = path.join(
    process.cwd(),
    "src",
    "routes",
    "v1",
    "fixtures",
    "faceit-webhooks"
  );
  if (fs.existsSync(fromCwd)) return fromCwd;
  return fromDir;
}

interface FixtureRow {
  event: string;
  data: Record<string, unknown>;
  details?: Record<string, unknown>;
}

function loadFixtureRows(roomId: string): FixtureRow[] {
  const dir = getFixturesDir();
  const p = path.join(dir, `${roomId}.json`);
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as FixtureRow[];
}

const app = express();
app.use(express.json());
app.use("/api/v1/faceit", faceitRouter);
app.use(expressErrorHandler);

describe("FACEIT webhook integration (replay from fixtures)", () => {
  beforeAll(async () => {
    await runFaceitWebhookIntegrationSeed();
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    jest
      .spyOn(seasonTeamPlayersModels, "validatePlayersInTeams")
      .mockResolvedValue(undefined);
  });

  describe("room 1-3e047cf2-6b8f-479b-8a47-7ca122a2116d", () => {
    const roomId = ROOM_IDS[0];

    it("replays webhooks in order and asserts final Matches, MatchGames, and structure", async () => {
      const rows = loadFixtureRows(roomId);
      const callIndexByRoom = new Map<string, number>();

      jest
        .spyOn(faceitMatchServices, "getFaceITMatchDetails")
        .mockImplementation((externalMatchRoomId: string) => {
          const idx = callIndexByRoom.get(externalMatchRoomId) ?? 0;
          callIndexByRoom.set(externalMatchRoomId, idx + 1);
          const row = rows[idx];
          if (!row?.details) {
            return Promise.reject(
              new Error(
                `No details for room ${externalMatchRoomId} call ${idx}`
              )
            );
          }
          return Promise.resolve(row.details);
        });

      for (const row of rows) {
        const res = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(row.data);
        expect(res.status).toBe(200);
      }

      const matches = await runQuery<
        Array<{
          id: number;
          status: string;
          best_of: number;
          start_timestamp: Date | null;
          end_timestamp: Date | null;
        }>
      >(
        "SELECT id, status, best_of, start_timestamp, end_timestamp FROM Matches WHERE external_match_room_id = ? ORDER BY id",
        [roomId]
      );
      expect(matches).toHaveLength(2);
      const [firstMatch, secondMatch] = matches;

      // Correct end state per data analysis: both matches FINISHED (2 played games)
      expect(firstMatch?.status).toBe("FINISHED");
      expect(secondMatch?.status).toBe("FINISHED");
      expect(firstMatch?.best_of).toBe(1);
      expect(secondMatch?.best_of).toBe(1);
      expect(firstMatch?.start_timestamp).toBeTruthy();
      expect(firstMatch?.end_timestamp).toBeTruthy();
      expect(secondMatch?.start_timestamp).toBeTruthy();
      expect(secondMatch?.end_timestamp).toBeTruthy();

      const matchGames = await runQuery<
        Array<{
          match_id: number;
          id: number;
          map_order: number | null;
          demofile: string;
          regulation_rounds: number | null;
        }>
      >(
        "SELECT mg.match_id, mg.id, mg.map_order, mg.demofile, mg.regulation_rounds FROM Matches m JOIN MatchGames mg ON mg.match_id = m.id WHERE m.external_match_room_id = ? ORDER BY m.id, mg.map_order",
        [roomId]
      );
      expect(matchGames).toHaveLength(2);
      expect(matchGames.map((g) => g.map_order)).toEqual([1, 2]);
      matchGames.forEach((mg) => {
        expect(mg.demofile).toBeTruthy();
        expect(mg.demofile).not.toBe("");
      });

      for (const mg of matchGames) {
        const scores = await runQuery<
          Array<{ match_game_id: number; team_id: number; score: number }>
        >(
          "SELECT match_game_id, team_id, score FROM TeamGameScores WHERE match_game_id = ? ORDER BY team_id",
          [mg.id]
        );
        if (scores.length > 0) {
          expect(scores).toHaveLength(2);
          const [t1, t2] = scores;
          expect(typeof t1?.score).toBe("number");
          expect(typeof t2?.score).toBe("number");
        }
      }
    });
  });

  describe("room 1-d3b5d80b-4319-4eaa-a34c-4fc4d17a8d5f", () => {
    const roomId = ROOM_IDS[1];

    it("replays webhooks in order and asserts final Matches, MatchGames, and structure", async () => {
      const rows = loadFixtureRows(roomId);
      const callIndexByRoom = new Map<string, number>();

      jest
        .spyOn(faceitMatchServices, "getFaceITMatchDetails")
        .mockImplementation((externalMatchRoomId: string) => {
          const idx = callIndexByRoom.get(externalMatchRoomId) ?? 0;
          callIndexByRoom.set(externalMatchRoomId, idx + 1);
          const row = rows[idx];
          if (!row?.details) {
            return Promise.reject(
              new Error(
                `No details for room ${externalMatchRoomId} call ${idx}`
              )
            );
          }
          return Promise.resolve(row.details);
        });

      for (const row of rows) {
        await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(row.data)
          .expect(200);
      }

      const matches = await runQuery<
        Array<{
          id: number;
          status: string;
          best_of: number;
          start_timestamp: Date | null;
          end_timestamp: Date | null;
        }>
      >(
        "SELECT id, status, best_of, start_timestamp, end_timestamp FROM Matches WHERE external_match_room_id = ? ORDER BY id",
        [roomId]
      );
      expect(matches).toHaveLength(2);
      const [firstMatch, secondMatch] = matches;

      expect(firstMatch?.status).toBe("FINISHED");
      expect(["FORFEIT", "FINISHED"]).toContain(secondMatch?.status ?? "");
      expect(firstMatch?.best_of).toBe(1);
      expect(secondMatch?.best_of).toBe(1);
      expect(firstMatch?.start_timestamp).toBeTruthy();
      expect(firstMatch?.end_timestamp).toBeTruthy();
      if (secondMatch?.status === "FORFEIT") {
        expect(secondMatch?.end_timestamp).toBeTruthy();
      }
      if (secondMatch?.status === "FINISHED") {
        expect(secondMatch?.start_timestamp).toBeTruthy();
        expect(secondMatch?.end_timestamp).toBeTruthy();
      }

      const matchGames = await runQuery<
        Array<{
          match_id: number;
          id: number;
          map_order: number | null;
          demofile: string;
        }>
      >(
        "SELECT mg.match_id, mg.id, mg.map_order, mg.demofile FROM Matches m JOIN MatchGames mg ON mg.match_id = m.id WHERE m.external_match_room_id = ? ORDER BY m.id, mg.map_order",
        [roomId]
      );
      expect(matchGames.length).toBeGreaterThanOrEqual(1);
      const firstMatchGames = matchGames.filter(
        (g) => g.match_id === firstMatch?.id
      );
      expect(firstMatchGames.length).toBeGreaterThanOrEqual(1);
      firstMatchGames.forEach((mg) => {
        expect(mg.demofile).toBeTruthy();
        expect(mg.demofile).not.toBe("");
      });

      for (const mg of matchGames) {
        const scores = await runQuery<
          Array<{ match_game_id: number; team_id: number; score: number }>
        >(
          "SELECT match_game_id, team_id, score FROM TeamGameScores WHERE match_game_id = ? ORDER BY team_id",
          [mg.id]
        );
        if (scores.length > 0) {
          expect(scores).toHaveLength(2);
          scores.forEach((s) => expect(typeof s.score).toBe("number"));
        }
      }
    });
  });

  describe("room 1-f55c14a9-b708-4abc-8ffb-be4993e469c1", () => {
    const roomId = ROOM_IDS[2];

    it("replays webhooks in order and asserts final Matches, MatchGames, and structure", async () => {
      const rows = loadFixtureRows(roomId);
      const callIndexByRoom = new Map<string, number>();

      jest
        .spyOn(faceitMatchServices, "getFaceITMatchDetails")
        .mockImplementation((externalMatchRoomId: string) => {
          const idx = callIndexByRoom.get(externalMatchRoomId) ?? 0;
          callIndexByRoom.set(externalMatchRoomId, idx + 1);
          const row = rows[idx];
          if (!row?.details) {
            return Promise.reject(
              new Error(
                `No details for room ${externalMatchRoomId} call ${idx}`
              )
            );
          }
          return Promise.resolve(row.details);
        });

      for (const row of rows) {
        await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(row.data)
          .expect(200);
      }

      const matches = await runQuery<
        Array<{
          id: number;
          status: string;
          best_of: number;
          start_timestamp: Date | null;
          end_timestamp: Date | null;
        }>
      >(
        "SELECT id, status, best_of, start_timestamp, end_timestamp FROM Matches WHERE external_match_room_id = ? ORDER BY id",
        [roomId]
      );
      expect(matches).toHaveLength(2);
      const [firstMatch, secondMatch] = matches;

      expect(firstMatch?.status).toBe("FINISHED");
      expect(["FORFEIT", "FINISHED"]).toContain(secondMatch?.status ?? "");
      expect(firstMatch?.best_of).toBe(1);
      expect(secondMatch?.best_of).toBe(1);
      expect(firstMatch?.start_timestamp).toBeTruthy();
      expect(firstMatch?.end_timestamp).toBeTruthy();
      if (secondMatch?.status === "FORFEIT") {
        expect(secondMatch?.end_timestamp).toBeTruthy();
      }
      if (secondMatch?.status === "FINISHED") {
        expect(secondMatch?.start_timestamp).toBeTruthy();
        expect(secondMatch?.end_timestamp).toBeTruthy();
      }

      const matchGames = await runQuery<
        Array<{
          match_id: number;
          id: number;
          map_order: number | null;
          demofile: string;
        }>
      >(
        "SELECT mg.match_id, mg.id, mg.map_order, mg.demofile FROM Matches m JOIN MatchGames mg ON mg.match_id = m.id WHERE m.external_match_room_id = ? ORDER BY m.id, mg.map_order",
        [roomId]
      );
      expect(matchGames.length).toBeGreaterThanOrEqual(1);
      const firstMatchGames = matchGames.filter(
        (g) => g.match_id === firstMatch?.id
      );
      expect(firstMatchGames.length).toBeGreaterThanOrEqual(1);
      firstMatchGames.forEach((mg) => {
        expect(mg.demofile).toBeTruthy();
        expect(mg.demofile).not.toBe("");
      });

      for (const mg of matchGames) {
        const scores = await runQuery<
          Array<{ match_game_id: number; team_id: number; score: number }>
        >(
          "SELECT match_game_id, team_id, score FROM TeamGameScores WHERE match_game_id = ? ORDER BY team_id",
          [mg.id]
        );
        if (scores.length > 0) {
          expect(scores).toHaveLength(2);
          scores.forEach((s) => expect(typeof s.score).toBe("number"));
        }
      }
    });
  });

  describe("room 1-00000001-0001-4000-8000-000000000001 (normal BO1, single Match)", () => {
    const roomId = "1-00000001-0001-4000-8000-000000000001";

    it("replays webhooks and asserts single Match, one MatchGame, FINISHED", async () => {
      const rows = loadFixtureRows(roomId);
      const callIndexByRoom = new Map<string, number>();

      jest
        .spyOn(faceitMatchServices, "getFaceITMatchDetails")
        .mockImplementation((externalMatchRoomId: string) => {
          const idx = callIndexByRoom.get(externalMatchRoomId) ?? 0;
          callIndexByRoom.set(externalMatchRoomId, idx + 1);
          const row = rows[idx];
          if (!row?.details) {
            return Promise.reject(
              new Error(
                `No details for room ${externalMatchRoomId} call ${idx}`
              )
            );
          }
          return Promise.resolve(row.details);
        });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const res = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(row.data);
        if (res.status !== 200) {
          throw new Error(
            `BO1 row ${i} event=${row.event} status=${res.status} body=${JSON.stringify(res.body)}`
          );
        }
      }

      const matches = await runQuery<
        Array<{
          id: number;
          status: string;
          best_of: number;
          start_timestamp: Date | null;
          end_timestamp: Date | null;
        }>
      >(
        "SELECT id, status, best_of, start_timestamp, end_timestamp FROM Matches WHERE external_match_room_id = ? ORDER BY id",
        [roomId]
      );
      expect(matches).toHaveLength(1);
      const [match] = matches;
      expect(match?.status).toBe("FINISHED");
      expect(match?.best_of).toBe(1);
      expect(match?.start_timestamp).toBeTruthy();
      expect(match?.end_timestamp).toBeTruthy();

      const matchGames = await runQuery<
        Array<{
          match_id: number;
          id: number;
          map_order: number | null;
          demofile: string;
        }>
      >(
        "SELECT mg.match_id, mg.id, mg.map_order, mg.demofile FROM Matches m JOIN MatchGames mg ON mg.match_id = m.id WHERE m.external_match_room_id = ? ORDER BY mg.map_order",
        [roomId]
      );
      expect(matchGames).toHaveLength(1);
      expect(matchGames[0].map_order).toBe(1);
      expect(matchGames[0].demofile).toBeTruthy();
    });
  });

  describe("room 1-00000002-0002-4000-8000-000000000002 (BO3 single Match)", () => {
    const roomId = "1-00000002-0002-4000-8000-000000000002";

    it("replays webhooks and asserts single Match, two MatchGames, FINISHED", async () => {
      const rows = loadFixtureRows(roomId);
      const callIndexByRoom = new Map<string, number>();

      jest
        .spyOn(faceitMatchServices, "getFaceITMatchDetails")
        .mockImplementation((externalMatchRoomId: string) => {
          const idx = callIndexByRoom.get(externalMatchRoomId) ?? 0;
          callIndexByRoom.set(externalMatchRoomId, idx + 1);
          const row = rows[idx];
          if (!row?.details) {
            return Promise.reject(
              new Error(
                `No details for room ${externalMatchRoomId} call ${idx}`
              )
            );
          }
          return Promise.resolve(row.details);
        });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const res = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(row.data);
        if (res.status !== 200) {
          throw new Error(
            `BO3 row ${i} event=${row.event} status=${res.status} body=${JSON.stringify(res.body)}`
          );
        }
      }

      const matches = await runQuery<
        Array<{
          id: number;
          status: string;
          best_of: number;
          start_timestamp: Date | null;
          end_timestamp: Date | null;
        }>
      >(
        "SELECT id, status, best_of, start_timestamp, end_timestamp FROM Matches WHERE external_match_room_id = ? ORDER BY id",
        [roomId]
      );
      expect(matches).toHaveLength(1);
      const [match] = matches;
      expect(match?.status).toBe("FINISHED");
      expect(match?.best_of).toBe(3);
      expect(match?.start_timestamp).toBeTruthy();
      expect(match?.end_timestamp).toBeTruthy();

      const matchGames = await runQuery<
        Array<{
          match_id: number;
          id: number;
          map_order: number | null;
          demofile: string;
        }>
      >(
        "SELECT mg.match_id, mg.id, mg.map_order, mg.demofile FROM Matches m JOIN MatchGames mg ON mg.match_id = m.id WHERE m.external_match_room_id = ? ORDER BY mg.map_order",
        [roomId]
      );
      expect(matchGames).toHaveLength(2);
      expect(matchGames.map((g) => g.map_order)).toEqual([1, 2]);
      matchGames.forEach((mg) => {
        expect(mg.demofile).toBeTruthy();
        expect(mg.demofile).not.toBe("");
      });
    });
  });
});
