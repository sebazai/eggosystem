// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp } from "../../test-utils";
import gameRouter from "./match-game.routes";
import {
  type MatchOrGameTopPlayerAwards,
  type GameTeamStats,
  type TeamStatsResponse
} from "@eggosystem/types";

describe("Game Routes", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      gameRouter,
      "/" // Mount at root, so internal router paths are used directly
    );
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(async () => {
    cleanup();
    // Ensure all pending operations are completed
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe("GET /games/:match_game_id/teamstats", () => {
    it("should return team stats for game id 104729", async () => {
      const expectedStats = [
        {
          team_id: 2035,
          name: "PV - 2",
          first_kills: 17,
          clutches_won: 0,
          plants: 7,
          trades: 15
        },
        {
          team_id: 2060,
          name: "Prove Testaa",
          first_kills: 12,
          clutches_won: 0,
          plants: 9,
          trades: 13
        }
      ] satisfies TeamStatsResponse[];

      const response = await request(app)
        .get("/104729/teamstats")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedStats);
    });

    it("should return team stats for match id 7750 and game id 10340", async () => {
      const expectedTeamStats = [
        {
          team_id: 18,
          name: "Efecte Gaming Club",
          first_kills: 13,
          clutches_won: 1,
          plants: 7,
          trades: 21
        },
        {
          team_id: 53,
          name: "Polar Squad",
          first_kills: 17,
          clutches_won: 1,
          plants: 5,
          trades: 17
        }
      ] satisfies GameTeamStats[];

      const response = await request(app)
        .get("/10340/teamstats")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedTeamStats);
    });
  });

  describe("GET /:match_game_id/topplayers", () => {
    it("should return top players for match 7750 and game id 10340", async () => {
      const expectedTopPlayers = {
        most_kills: {
          steam_id: "76561198077435075",
          nickname: "tobbbles",
          team_id: 53,
          value: 29
        },
        most_adr: {
          steam_id: "76561198077435075",
          nickname: "tobbbles",
          team_id: 53,
          value: 102.8
        },
        most_assists: {
          steam_id: "76561197970957130",
          nickname: "kuula",
          team_id: 53,
          value: 8
        },
        most_awp_kills: {
          steam_id: "76561198001857963",
          nickname: "meppi",
          team_id: 53,
          value: 10
        },
        most_utility_damage: {
          steam_id: "76561197996849404",
          nickname: "Pronssi",
          team_id: 18,
          value: 300
        },
        most_first_kills: {
          steam_id: "76561198001857963",
          nickname: "meppi",
          team_id: 53,
          value: 7
        },
        most_flash_assists: {
          steam_id: "76561198030886203",
          nickname: "defektro",
          team_id: 53,
          value: 2
        },
        most_mates_flashed: {
          steam_id: "76561197967885016",
          nickname: "enzoj",
          team_id: 53,
          value: 10
        }
      } satisfies MatchOrGameTopPlayerAwards;

      const response = await request(app)
        .get("/10340/topplayers")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedTopPlayers);
    });

    it("should handle non-existent match id", async () => {
      const response = await request(app).get("/99999/topplayers").expect(404);

      expect(response.body).toEqual({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "Could not find top players for match game id",
        instance: "/99999/topplayers"
      });
    });
  });
});
