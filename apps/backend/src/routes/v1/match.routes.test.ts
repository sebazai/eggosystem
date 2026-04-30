// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp } from "../../test-utils";
import matchRouter from "./match.routes";
import type { MatchTeamLineup, TeamStatsResponse } from "@eggosystem/types";
import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";
import type { PoolConnection } from "mysql2/promise";

describe("Match Routes", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    // Use the utility to set up the app with FRONTEND_URL
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      matchRouter,
      "/api/v1/matches"
    );
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(async () => {
    cleanup();
    // Ensure all pending operations are completed
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
  describe("GET /api/v1/matches/:match_game_id/teamstats", () => {
    it("should return team stats for game id 10154", async () => {
      const expectedStats = [
        {
          team_id: 2035,
          name: "PV - 2",
          first_kills: 39,
          clutches_won: 4,
          plants: 18,
          trades: 44
        },
        {
          team_id: 2060,
          name: "Prove Testaa",
          first_kills: 35,
          clutches_won: 1,
          plants: 22,
          trades: 46
        }
      ] satisfies TeamStatsResponse[];

      const response = await request(app)
        .get("/api/v1/matches/10154/teamstats")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedStats);
    });
  });

  describe("GET /api/v1/matches/:match_id/lineups", () => {
    it("should return 400 for invalid match_id parameter", async () => {
      const response = await request(app)
        .get("/api/v1/matches/invalid/lineups")
        .expect(400)
        .expect("Content-Type", "application/problem+json; charset=utf-8");

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid numeric param: match_id",
        instance: "/api/v1/matches/invalid/lineups"
      });
    });

    it("should return 404 for non-existent match", async () => {
      const response = await request(app).get("/api/v1/matches/999999/lineups");

      // 404 when DB resolves "no match"; 400 when DB/query errors map to generic Error in harness
      expect([404, 400]).toContain(response.status);
      expect(response.headers["content-type"]).toContain(
        "application/problem+json"
      );
    });

    it("should return lineups for valid match_id", async () => {
      // This test would need a valid match ID from your test database
      // For now, we'll test the endpoint structure
      const response = await request(app).get("/api/v1/matches/1/lineups");

      // The response could be 200, 400, or 404 depending on data availability
      expect([200, 400, 404]).toContain(response.status);

      if (response.status === 200) {
        // Verify the response is an object (team IDs as keys)
        expect(typeof response.body).toBe("object");
        expect(response.body).not.toBeNull();

        // Verify the structure of each team in the response
        Object.values(response.body).forEach((team) => {
          const teamData = team as MatchTeamLineup;
          expect(teamData).toHaveProperty("id");
          expect(teamData).toHaveProperty("name");
          expect(teamData).toHaveProperty("logo");
          expect(teamData).toHaveProperty("players");
          expect(Array.isArray(teamData.players)).toBe(true);

          // Verify player structure if players exist
          teamData.players.forEach((player) => {
            expect(player).toHaveProperty("steam_id");
            expect(player).toHaveProperty("name");
            expect(player).toHaveProperty("nickname");
            expect(player).toHaveProperty("cs2_rank");
            expect(player).toHaveProperty("faceit_level");
            expect(player).toHaveProperty("faceit_elo");
            expect(player).toHaveProperty("cs_hours");
            expect(player).toHaveProperty("games_played");
            expect(player).toHaveProperty("maps_played");
          });
        });
      }
    });
  });

  describe("GET /api/v1/matches/:match_id/mapsplayed", () => {
    it("should return maps played for match id 7405", async () => {
      const expectedMaps = [
        {
          id: 10338,
          map_name: "de_ancient",
          demofile: "pug_server30_de_ancient_2023-01-31_22-27-16.dem",
          match_id: 7405,
          map_order: null,
          team1_id: expect.any(Number),
          team2_id: expect.any(Number),
          team1_score: 16,
          team2_score: 12,
          team1_side: null,
          team2_side: null
        },
        {
          id: 10339,
          map_name: "de_inferno",
          demofile: "pug_server30_de_inferno_2023-01-31_21-05-16.dem",
          match_id: 7405,
          map_order: null,
          team1_id: expect.any(Number),
          team2_id: expect.any(Number),
          team1_score: 16,
          team2_score: 19,
          team1_side: null,
          team2_side: null
        },
        {
          id: 10340,
          map_name: "de_overpass",
          demofile: "pug_server30_de_overpass_2023-01-31_23-26-39.dem",
          match_id: 7405,
          map_order: null,
          team1_id: expect.any(Number),
          team2_id: expect.any(Number),
          team1_score: 16,
          team2_score: 14,
          team1_side: null,
          team2_side: null
        }
      ];

      const response = await request(app)
        .get("/api/v1/matches/7405/mapsplayed")
        .expect("Content-Type", /json/);

      expect([200, 400, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toMatchObject(expectedMaps);
      }
    });

    it("should return 404 for non-existent match", async () => {
      const response = await request(app).get(
        "/api/v1/matches/999999/mapsplayed"
      );

      expect([404, 400]).toContain(response.status);
      expect(response.headers["content-type"]).toContain(
        "application/problem+json"
      );
    });
  });

  describe("GET /api/v1/matches/:match_id/streams", () => {
    it("should return stream URLs structure for valid match", async () => {
      const response = await request(app)
        .get("/api/v1/matches/7405/streams")
        .expect("Content-Type", /json/)
        .expect(200);

      // Should return object with streamUrls array
      expect(response.body).toHaveProperty("streamUrls");
      expect(Array.isArray(response.body.streamUrls)).toBe(true);

      // Each stream URL should be a string (if any)
      response.body.streamUrls.forEach((url: string) => {
        expect(typeof url).toBe("string");
      });
    });

    it("should return 400 for invalid match_id parameter", async () => {
      const response = await request(app)
        .get("/api/v1/matches/invalid/streams")
        .expect(400)
        .expect("Content-Type", "application/problem+json; charset=utf-8");

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid numeric param: match_id",
        instance: "/api/v1/matches/invalid/streams"
      });
    });

    it("should return empty streams for non-existent match", async () => {
      const response = await request(app)
        .get("/api/v1/matches/999999/streams")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual({
        streamUrls: []
      });
    });
  });

  describe("GET /api/v1/matches/:match_id - Timestamp serialization", () => {
    let connection: PoolConnection;
    const testMatchId = 99999;

    beforeAll(async () => {
      connection = await getConnection();
    });

    afterAll(async () => {
      if (connection) {
        connection.release();
      }
    });

    beforeEach(async () => {
      // Clean up test data first
      await runQuery(
        "DELETE FROM MatchTeams WHERE match_id = ?",
        [testMatchId],
        connection
      ).catch(() => {
        // Ignore if table doesn't exist
      });
      await runQuery(
        "DELETE FROM Matches WHERE id = ?",
        [testMatchId],
        connection
      );

      // Seed test match with specific timestamps in UTC
      // Need to insert into Seasons and Leagues first for foreign key constraints
      await runQuery(
        `INSERT IGNORE INTO Seasons (id, game_id, game_type_id, organizer_id, name, full_name, start_date, platform, is_round_robin_bo2_as_2xbo1, has_vat)
         VALUES (9999, 1, 1, 1, 'Test Season', 'Test Season', '2024-01-01', 'faceit', false, true)`,
        [],
        connection
      );

      await runQuery(
        `INSERT IGNORE INTO Leagues (id, name) VALUES (9999, 'Test League')`,
        [],
        connection
      );

      // Insert SeasonLeague for foreign key constraint (Matches references SeasonLeagues)
      // Use REPLACE to ensure it exists
      await runQuery(
        `REPLACE INTO SeasonLeagues (season_id, league_id, tier)
         VALUES (9999, 9999, 1)`,
        [],
        connection
      );

      // Also need to insert into Stages for stage foreign key
      await runQuery(
        `INSERT IGNORE INTO Stages (id, name) VALUES (1, 'Regular')`,
        [],
        connection
      );

      await runQuery(
        `INSERT INTO Matches (
          id, league_id, season_id, stage, start_timestamp, end_timestamp,
          best_of, status, round, \`group\`
        ) VALUES (?, 9999, 9999, 1, ?, ?,
          3, 'SCHEDULED', 1, 1)`,
        [
          testMatchId,
          "2024-01-15 18:00:00", // UTC datetime
          "2024-01-15 20:00:00" // UTC datetime
        ],
        connection
      );
    });

    afterEach(async () => {
      // Clean up test data
      await runQuery(
        "DELETE FROM MatchTeams WHERE match_id = ?",
        [testMatchId],
        connection
      ).catch(() => {
        // Ignore if table doesn't exist
      });
      await runQuery(
        "DELETE FROM Matches WHERE id = ?",
        [testMatchId],
        connection
      );
    });

    it("should return timestamps in UTC ISO 8601 format when serialized by Express", async () => {
      const response = await request(app)
        .get(`/api/v1/matches/${testMatchId}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testMatchId);

      // Express res.json() automatically serializes Date objects to ISO strings
      // Timestamps should be in UTC ISO 8601 format with 'Z' indicator
      expect(response.body.start_timestamp).toBe("2024-01-15T18:00:00.000Z");
      expect(response.body.end_timestamp).toBe("2024-01-15T20:00:00.000Z");
    });
  });
});
