import request from "supertest";
import express from "express";
import matchRouter from "../../routes/v1/match.routes";

import type {
  MatchMapsPlayed,
  MatchTeamStats,
  MatchTopPlayerAwards
} from "@eggosystem/types";

describe("Match Routes", () => {
  const app = express();
  app.use(express.json());
  app.use(matchRouter);
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /matches/:match_id/mapsplayed", () => {
    it("should return maps played for match id 7750", async () => {
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
        .get("/7750/mapsplayed")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedMaps);
    });

    it("should handle non-existent match id", async () => {
      const response = await request(app)
        .get("/99999/mapsplayed")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe("GET /matches/:match_id/games/:game_id/topplayers", () => {
    it("should return top players for match 7750 and game id 10340", async () => {
      const expectedTopPlayers = {
        most_kills: {
          nickname: "tobbbles",
          team_id: 53,
          value: 29
        },
        most_adr: {
          nickname: "tobbbles",
          team_id: 53,
          value: 102.8
        },
        most_assists: {
          nickname: "kuula",
          team_id: 53,
          value: 8
        },
        most_awp_kills: {
          nickname: "meppi",
          team_id: 53,
          value: 10
        },
        most_utility_damage: {
          nickname: "Pronssi",
          team_id: 18,
          value: 300
        },
        most_first_kills: {
          nickname: "meppi",
          team_id: 53,
          value: 7
        },
        most_flash_assists: {
          nickname: "defektro",
          team_id: 53,
          value: 2
        },
        most_mates_flashed: {
          nickname: "enzoj",
          team_id: 53,
          value: 10
        }
      } satisfies MatchTopPlayerAwards;

      const response = await request(app)
        .get("/7750/games/10340/topplayers")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedTopPlayers);
    });

    it("should handle non-existent match id", async () => {
      const response = await request(app)
        .get("/99999/topplayers")
        .expect("Content-Type", /json/)
        .expect(400);
      expect(response.body).toEqual({
        message: "Could not find season for match id"
      });
    });
  });

  describe("GET /matches/:match_id/games/:game_id/teamstats", () => {
    it("should return team stats for match id 7750 and game id 10340", async () => {
      const expectedTeamStats = [
        {
          team_id: 18,
          name: "Efecte Gaming Club",
          score: 16,
          starting_side: "T",
          team_ht_score: 6,
          first_kills: 13,
          clutches_won: 1,
          plants: 7,
          trades: 21
        },
        {
          team_id: 53,
          name: "Polar Squad",
          score: 14,
          starting_side: "CT",
          team_ht_score: 9,
          first_kills: 17,
          clutches_won: 1,
          plants: 5,
          trades: 17
        }
      ] satisfies MatchTeamStats[];

      const response = await request(app)
        .get("/7750/games/10340/teamstats")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedTeamStats);
    });

    it("should handle non-existent match id", async () => {
      const response = await request(app)
        .get("/99999/teamstats")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
