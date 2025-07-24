import request from "supertest";
import express from "express";
import gameRouter from "../../routes/v1/game.routes";
import {
  type MatchOrGameTopPlayerAwards,
  type GameTeamStats,
  type MatchTeamStats
} from "@eggosystem/types";

describe("Game Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(gameRouter);
  });

  afterEach(async () => {
    // Ensure all pending operations are completed
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe("GET /games/:game_id/teamstats", () => {
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
      ] satisfies MatchTeamStats[];

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

  describe("GET /games/:game_id/topplayers", () => {
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
        error: {
          message: "Could not find top players for match game id"
        }
      });
    });
  });
});
