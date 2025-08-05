import request from "supertest";
import express from "express";
import matchRouter from "./match.routes";

import type { MatchMapsPlayed, MatchTeamStats } from "@eggosystem/types";

describe("Match Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/matches", matchRouter);
  });

  afterEach(async () => {
    // Ensure all pending operations are completed
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe("GET /matches/:game_id/teamstats", () => {
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
        .get("/matches/10154/teamstats")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedStats);
    });
  });

  describe("GET /matches/:match_id/mapsplayed", () => {
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
        .get("/matches/7405/mapsplayed")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedMaps);
    });

    it("should handle non-existent match id", async () => {
      const response = await request(app)
        .get("/matches/99999/mapsplayed")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toEqual({
        error: { message: "Could not find maps played for match" }
      });
    });
  });
});
