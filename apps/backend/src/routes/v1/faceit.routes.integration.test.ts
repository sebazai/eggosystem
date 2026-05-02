/**
 * Integration tests: replay FACEIT webhooks from fixture files (3 real 2xBO1
 * rooms + 2 synthetic non-2xBO1 rooms) in order, POST to /api/v1/faceit/webhook,
 * mock getFaceITMatchDetails with fixture details, assert final Matches,
 * MatchGames, and (when present) team scores per room. After the 2xBO1
 * (FINISHED, FINISHED) replay, also asserts `getDivStandings` does not double-
 * count a room's two sibling rows (S2-AC-1 anti-double-count spot-check).
 *
 * Requires empty DB + full seed (runFaceitWebhookIntegrationSeed) before replay.
 *
 * --------------------------------------------------------------------------
 * 2xBO1 terminal-tuple coverage matrix (S2-AC-3)
 * --------------------------------------------------------------------------
 * The four 2xBO1 terminal tuples (slot 0, slot 1) — the bug fix in T1
 * guarantees neither slot is left in SCHEDULED — are split between this
 * integration suite and the route unit tests in `faceit.routes.test.ts` as
 * follows. Both suites use the resolver in
 * `services/faceit-2xbo1-resolver.services.ts`; the unit tests exercise it
 * end-to-end via mocked DB (`getMatchesByExternalId`), the integration tests
 * via real DB writes from full webhook replays.
 *
 * Tuple                  | Integration (this file)              | Unit (`faceit.routes.test.ts`)
 * -----------------------|--------------------------------------|--------------------------------
 * (FINISHED, FINISHED)   | YES — all 3 real fixture rooms       | YES — idempotency test
 * (FORFEIT,  FINISHED)   | YES — room 1-00000003-0003…          | YES — explicit describe block
 * (FINISHED, FORFEIT)    | YES — room 1-00000004-0004…          | YES — idempotency test
 * (FORFEIT,  FORFEIT)    | YES — room 1-00000005-0005…          | YES — two-forfeit sequence test
 *
 * The three synthetic forfeit rooms use the entity / championship ID
 * `f2f2f2f2-f0ff-4000-8000-000000000001` (seeded as "Forfeit League") and
 * drive the resolver through real DB writes so that `getDivStandings` can
 * also be spot-checked against real FORFEIT rows (S2-AC-1 + S2-AC-3).
 *
 * Production room id `1-f30abfb4-04e1-4d17-8245-b16614e5cf06` (season 17,
 * one map played + one forfeited) modelled the original bug; the synthetic
 * room 1-00000003… replays the same sequence type (forfeit-first → real
 * finish) in a controlled fixture.
 */

const TEST_WEBHOOK_API_KEY = "test-faceit-webhook-integration-key";
process.env.FACEIT_WEBHOOK_API_KEY = TEST_WEBHOOK_API_KEY;

import * as fs from "fs";
import * as path from "path";
import request from "supertest";
import express from "express";
import { type FaceitMatchStatsResponse } from "@eggosystem/types";
import faceitRouter from "./faceit.routes";
import { expressErrorHandler } from "../../middlewares/express-error-handler";
import { runFaceitWebhookIntegrationSeed } from "./faceit-webhook-integration-seed";
import { runQuery } from "../../db/mysqlRunQuery";
import * as faceitMatchServices from "../../services/faceit-match.services";
import * as seasonTeamPlayersModels from "../../models/season-team-players.models";
import { getDivStandings } from "../../services/standings.services";

const ROOM_IDS = [
  "1-3e047cf2-6b8f-479b-8a47-7ca122a2116d",
  "1-d3b5d80b-4319-4eaa-a34c-4fc4d17a8d5f",
  "1-f55c14a9-b708-4abc-8ffb-be4993e469c1"
] as const;

/** Synthetic rooms for forfeit-tuple integration tests (all share FORFEIT_ENTITY_ID). */
const FORFEIT_ROOM_IDS = {
  FORFEIT_FINISHED: "1-00000003-0003-4000-8000-000000000003",
  FINISHED_FORFEIT: "1-00000004-0004-4000-8000-000000000004",
  FORFEIT_FORFEIT: "1-00000005-0005-4000-8000-000000000005"
} as const;
const FORFEIT_ENTITY_ID = "f2f2f2f2-f0ff-4000-8000-000000000001";

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

    /**
     * S2-AC-1 anti-double-count spot-check.
     *
     * After the (FINISHED, FINISHED) replay above, the league
     * `7464ba95-996a-43bc-88c2-ccce3d6127ec` ("Div4 S5 Lohko A") has TWO
     * sibling Matches rows for this room. `getDivStandings` must group them
     * to exactly ONE FaceIT call (`getFaceitMatchStats`) per room — the
     * `getFaceitMatchesFromDbForFaceitLeague` SQL groups FINISHED rows by
     * `external_match_room_id` when `is_round_robin_bo2_as_2xbo1` is true —
     * and the resulting standings must show `games_played === 2` per team
     * (one per map). Anything other than 2 (e.g. 4) signals the regression
     * the T1 fix prevents: both Matches rows being aggregated into the
     * standings independently.
     *
     * The synthetic stats response below mirrors the fixture's
     * `detailed_results`: Ossi Botit wins map 1 (Rounds=22, regulation),
     * Produal wins map 2 (Rounds=30, overtime). The assertions verify the
     * slot-accounting invariant (`games_played === 2`) plus the
     * regulation/overtime point breakdown.
     */
    it("S2-AC-1: getDivStandings does not double-count 2xBO1 sibling rows in this room", async () => {
      const syntheticStats = {
        rounds: [
          {
            best_of: "2",
            played: "1",
            round_stats: { Rounds: "22" },
            teams: [
              {
                team_stats: { Team: "Ossi Botit", "Final Score": "13" }
              },
              {
                team_stats: { Team: "Produal", "Final Score": "9" }
              }
            ]
          },
          {
            best_of: "2",
            played: "1",
            round_stats: { Rounds: "30" },
            teams: [
              {
                team_stats: { Team: "Ossi Botit", "Final Score": "14" }
              },
              {
                team_stats: { Team: "Produal", "Final Score": "16" }
              }
            ]
          }
        ]
      } satisfies FaceitMatchStatsResponse;

      jest
        .spyOn(faceitMatchServices, "getFaceitMatchStats")
        .mockResolvedValue(syntheticStats);

      const standings = await getDivStandings(
        "7464ba95-996a-43bc-88c2-ccce3d6127ec"
      );

      // Two teams in the room — sanity check; further team rows would imply
      // the league has more than this single 2xBO1 room (it does not in the
      // test seed), or a duplicate team_name leaked through aggregation.
      expect(standings).toHaveLength(2);

      const ossiBotit = standings.find((s) => s.team_name === "Ossi Botit");
      const produal = standings.find((s) => s.team_name === "Produal");
      expect(ossiBotit).toBeDefined();
      expect(produal).toBeDefined();

      // Anti-double-count invariant: the room contributes exactly TWO maps
      // total (one per FaceIT round), never four. If the SQL grouping
      // regressed and both sibling Matches rows leaked into the aggregator,
      // each team's games_played would be 4.
      expect(ossiBotit?.games_played).toBe(2);
      expect(produal?.games_played).toBe(2);

      // Points breakdown for this synthetic stats payload:
      //   Map 1 — Rounds=22 (regulation): Ossi Botit wins 13-9
      //     → Ossi Botit +3 (regulation win), Produal +0 (regulation loss)
      //   Map 2 — Rounds=30 (overtime, > 24): Produal wins 16-14
      //     → Produal +2 (overtime win = 3 - 1), Ossi Botit +1 (overtime loss = 1)
      // Totals: Ossi Botit = 4, Produal = 2. The double-count regression
      // would yield 8 / 4 (or similar) — twice the legitimate values.
      expect(ossiBotit?.points).toBe(4);
      expect(produal?.points).toBe(2);

      // Maps split: each team wins exactly one map across the two rounds
      // (one regulation, one overtime — `maps_won` is regulation-only).
      expect(ossiBotit?.maps_won).toBe(1);
      expect(ossiBotit?.maps_won_ot).toBe(0);
      expect(ossiBotit?.maps_lost).toBe(0);
      expect(ossiBotit?.maps_lost_ot).toBe(1);
      expect(produal?.maps_won).toBe(0);
      expect(produal?.maps_won_ot).toBe(1);
      expect(produal?.maps_lost).toBe(1);
      expect(produal?.maps_lost_ot).toBe(0);
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

      // Concrete tuple: (FINISHED, FINISHED) — both maps played in this fixture.
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

      // Concrete tuple: (FINISHED, FINISHED) — both maps played in this fixture.
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

    /**
     * S2-AC-1 anti-double-count spot-check across MULTIPLE rooms in the same
     * league. Competition `32ea3ab1-d916-4701-b545-5c76b19d9c64` has TWO
     * 2xBO1 rooms in the seed (`1-d3b5d80b-…` and `1-f55c14a9-…`) — both
     * end (FINISHED, FINISHED) per the assertions above. The CABB Esports 2
     * team plays in BOTH rooms, so its aggregate `games_played` must be 4
     * (2 rooms × 2 maps), never 8 (the regression case where SQL grouping
     * fails to collapse sibling Matches rows).
     *
     * The mocked stats response below is intentionally identical for both
     * rooms; we only care about per-room slot accounting, not score
     * realism.
     */
    it("S2-AC-1: getDivStandings aggregates two rooms in the same league without double-counting", async () => {
      const syntheticStats = {
        rounds: [
          {
            best_of: "2",
            played: "1",
            round_stats: { Rounds: "24" },
            teams: [
              {
                team_stats: { Team: "CABB Esports 2", "Final Score": "13" }
              },
              {
                team_stats: { Team: "Opponent", "Final Score": "10" }
              }
            ]
          },
          {
            best_of: "2",
            played: "1",
            round_stats: { Rounds: "24" },
            teams: [
              {
                team_stats: { Team: "CABB Esports 2", "Final Score": "8" }
              },
              {
                team_stats: { Team: "Opponent", "Final Score": "13" }
              }
            ]
          }
        ]
      } satisfies FaceitMatchStatsResponse;

      jest
        .spyOn(faceitMatchServices, "getFaceitMatchStats")
        .mockResolvedValue(syntheticStats);

      const standings = await getDivStandings(
        "32ea3ab1-d916-4701-b545-5c76b19d9c64"
      );

      const cabb = standings.find((s) => s.team_name === "CABB Esports 2");
      expect(cabb).toBeDefined();

      // CABB plays in 2 rooms × 2 maps each = 4 games. The double-count
      // regression would yield 8 (2 sibling Matches rows × 2 rooms × 2
      // maps).
      expect(cabb?.games_played).toBe(4);

      // 1 win + 1 loss per room (both regulation, Rounds = 24). Across 2
      // rooms: 2 wins, 2 losses, 6 points (2 × 3 regulation wins).
      expect(cabb?.maps_won).toBe(2);
      expect(cabb?.maps_lost).toBe(2);
      expect(cabb?.points).toBe(6);
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

  // -------------------------------------------------------------------------
  // Forfeit-tuple integration tests (S2-AC-3): synthetic 2xBO1 rooms that
  // exercise FORFEIT-containing terminal pairs via real DB writes.
  // -------------------------------------------------------------------------

  describe("room 1-00000003-0003-4000-8000-000000000003 (2xBO1 FORFEIT,FINISHED)", () => {
    const roomId = FORFEIT_ROOM_IDS.FORFEIT_FINISHED;

    it("replays webhooks and asserts slot 0 FORFEIT, slot 1 FINISHED", async () => {
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
            `Room3 row ${i} event=${row.event} status=${res.status} body=${JSON.stringify(res.body)}`
          );
        }
      }

      const matches = await runQuery<
        Array<{ id: number; status: string; best_of: number }>
      >(
        "SELECT id, status, best_of FROM Matches WHERE external_match_room_id = ? ORDER BY id",
        [roomId]
      );
      expect(matches).toHaveLength(2);
      const [firstMatch, secondMatch] = matches;

      // Single finished webhook with detailed_results[0]={0-6} (forfeit, max≤12 → Case D)
      // and detailed_results[1]={13-10} (real game, max>12 → Case D).
      expect(firstMatch?.status).toBe("FORFEIT");
      expect(secondMatch?.status).toBe("FINISHED");
      expect(firstMatch?.best_of).toBe(1);
      expect(secondMatch?.best_of).toBe(1);
    });
  });

  describe("room 1-00000004-0004-4000-8000-000000000004 (2xBO1 FINISHED,FORFEIT)", () => {
    const roomId = FORFEIT_ROOM_IDS.FINISHED_FORFEIT;

    it("replays webhooks and asserts slot 0 FINISHED, slot 1 FORFEIT", async () => {
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
            `Room4 row ${i} event=${row.event} status=${res.status} body=${JSON.stringify(res.body)}`
          );
        }
      }

      const matches = await runQuery<
        Array<{ id: number; status: string; best_of: number }>
      >(
        "SELECT id, status, best_of FROM Matches WHERE external_match_room_id = ? ORDER BY id",
        [roomId]
      );
      expect(matches).toHaveLength(2);
      const [firstMatch, secondMatch] = matches;

      // Slot 0 finished via match_demo_ready (demo handler sets FINISHED).
      // Single finished webhook with detailed_results[1]={0-6} (forfeit, max≤12)
      // → score-based Case A: slot 0 already FINISHED, slot 1 gets FORFEIT.
      expect(firstMatch?.status).toBe("FINISHED");
      expect(secondMatch?.status).toBe("FORFEIT");
      expect(firstMatch?.best_of).toBe(1);
      expect(secondMatch?.best_of).toBe(1);

      // Slot 0 must have a MatchGame with a demo URL (inserted by match_demo_ready).
      const matchGames = await runQuery<
        Array<{ match_id: number; demofile: string }>
      >(
        "SELECT mg.match_id, mg.demofile FROM MatchGames mg WHERE mg.match_id = ? ORDER BY mg.map_order",
        [firstMatch?.id]
      );
      expect(matchGames).toHaveLength(1);
      expect(matchGames[0]?.demofile).toContain(
        "1-00000004-0004-4000-8000-000000000004-1-1"
      );
    });
  });

  describe("room 1-00000005-0005-4000-8000-000000000005 (2xBO1 FORFEIT,FORFEIT)", () => {
    const roomId = FORFEIT_ROOM_IDS.FORFEIT_FORFEIT;

    it("replays webhooks and asserts both slots FORFEIT", async () => {
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
            `Room5 row ${i} event=${row.event} status=${res.status} body=${JSON.stringify(res.body)}`
          );
        }
      }

      const matches = await runQuery<
        Array<{ id: number; status: string; best_of: number }>
      >(
        "SELECT id, status, best_of FROM Matches WHERE external_match_room_id = ? ORDER BY id",
        [roomId]
      );
      expect(matches).toHaveLength(2);
      const [firstMatch, secondMatch] = matches;

      // Single finished webhook with detailed_results[0]={0-6} and [1]={6-0}
      // (both max≤12 → forfeit) → score-based Case D → both slots FORFEIT.
      // No SCHEDULED straggler: this is the exact bug pattern from issue #378.
      expect(firstMatch?.status).toBe("FORFEIT");
      expect(secondMatch?.status).toBe("FORFEIT");
      expect(firstMatch?.best_of).toBe(1);
      expect(secondMatch?.best_of).toBe(1);
    });
  });

  describe("forfeit league (S2-AC-1 + S2-AC-3): getDivStandings across all three forfeit rooms", () => {
    /**
     * After all three forfeit rooms have been replayed above, the forfeit
     * league has 6 total match-slots (3 rooms × 2 slots each). Neither
     * team should appear with more than 6 games_played — any higher value
     * would indicate the FORFEIT double-count regression the standings
     * service's slot-accounting logic prevents.
     *
     * Mock strategy:
     *  - FINISHED rows (rooms 3 and 4 each have one slot FINISHED):
     *    `getFaceitMatchStats` → synthetic 1-round response.
     *  - FORFEIT rows (rooms 3, 4, and 5 contribute 4 FORFEIT slots total):
     *    `getFaceITMatchDetails` → synthetic details with `detailed_results`.
     */
    it("S2-AC-1: getDivStandings returns 2 teams with games_played==6, no double-counting", async () => {
      const syntheticStats = {
        rounds: [
          {
            best_of: "2",
            played: "1",
            round_stats: { Rounds: "24" },
            teams: [
              {
                team_stats: { Team: "Forfeit Team A", "Final Score": "13" }
              },
              {
                team_stats: { Team: "Forfeit Team B", "Final Score": "10" }
              }
            ]
          }
        ]
      } satisfies FaceitMatchStatsResponse;

      jest
        .spyOn(faceitMatchServices, "getFaceitMatchStats")
        .mockResolvedValue(syntheticStats);

      // getFaceitMatchInfoForForfeit calls getFaceITMatchDetails for each
      // FORFEIT row. All four FORFEIT slots use the same synthetic response:
      // detailed_results[0].winner = "faction1" (Forfeit Team A wins forfeit).
      const syntheticForfeitDetails = {
        detailed_results: [
          {
            winner: "faction1",
            asc_score: false,
            factions: { faction1: { score: 1 }, faction2: { score: 0 } }
          },
          {
            winner: "faction2",
            asc_score: false,
            factions: { faction1: { score: 0 }, faction2: { score: 1 } }
          }
        ],
        teams: {
          faction1: {
            name: "Forfeit Team A",
            faction_id: "f2-faction-a-0001-4000-8000-000000000001"
          },
          faction2: {
            name: "Forfeit Team B",
            faction_id: "f2-faction-b-0002-4000-8000-000000000002"
          }
        }
      };

      jest
        .spyOn(faceitMatchServices, "getFaceITMatchDetails")
        .mockResolvedValue(syntheticForfeitDetails);

      const standings = await getDivStandings(FORFEIT_ENTITY_ID);

      expect(standings).toHaveLength(2);

      const teamA = standings.find((s) => s.team_name === "Forfeit Team A");
      const teamB = standings.find((s) => s.team_name === "Forfeit Team B");
      expect(teamA).toBeDefined();
      expect(teamB).toBeDefined();

      // Anti-double-count invariant: 3 rooms × 2 slots = 6 games per team.
      // A regression where FORFEIT rows expand all detailed_results entries
      // (instead of onlyFirstGame) would inflate this to 8 or 12.
      expect(teamA?.games_played).toBe(6);
      expect(teamB?.games_played).toBe(6);
    });
  });
});
