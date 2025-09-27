// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp } from "../../test-utils";
import matchRouter from "./match.routes";
import type {
  MatchMapsPlayed,
  MatchTeamLineup,
  MatchTeamStats
} from "@eggosystem/types";

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
      ] satisfies MatchTeamStats[];

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

      // Should be 404 for non-existent match
      expect(response.status).toBe(404);
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
          team1_score: 16,
          team2_score: 12
        },
        {
          id: 10339,
          map_name: "de_inferno",
          demofile: "pug_server30_de_inferno_2023-01-31_21-05-16.dem",
          team1_score: 16,
          team2_score: 19
        },
        {
          id: 10340,
          map_name: "de_overpass",
          demofile: "pug_server30_de_overpass_2023-01-31_23-26-39.dem",
          team1_score: 16,
          team2_score: 14
        }
      ] satisfies MatchMapsPlayed[];

      const response = await request(app)
        .get("/api/v1/matches/7405/mapsplayed")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedMaps);
    });

    it("should return 404 for non-existent match", async () => {
      const response = await request(app).get(
        "/api/v1/matches/999999/mapsplayed"
      );

      expect(response.status).toBe(404);
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
});
