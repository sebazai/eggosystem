import request from "supertest";
import { app } from "../../app";
import * as db from "../../db/mysqlRunQuery";

jest.mock("../../db/mysqlRunQuery");

describe("Match Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /matches/:match_id/mapsplayed", () => {
    it("should return maps played for match id 7750", async () => {
      const expectedMaps = [
        {
          id: 10338,
          map_name: "de_ancient",
          demofile: "pug_server30_de_ancient_2023-01-31_22-27-16.dem"
        },
        {
          id: 10339,
          map_name: "de_inferno",
          demofile: "pug_server30_de_inferno_2023-01-31_21-05-16.dem"
        },
        {
          id: 10340,
          map_name: "de_overpass",
          demofile: "pug_server30_de_overpass_2023-01-31_23-26-39.dem"
        }
      ];

      jest.spyOn(db, "runQuery").mockResolvedValueOnce(expectedMaps);

      const response = await request(app)
        .get("/api/v1/matches/7750/mapsplayed")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedMaps);
    });

    it("should handle non-existent match id", async () => {
      jest.spyOn(db, "runQuery").mockResolvedValueOnce([]);

      const response = await request(app)
        .get("/api/v1/matches/99999/mapsplayed")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe("GET /matches/:game_id/topplayers", () => {
    it("should return top players for match id 10340", async () => {
      const expectedTopPlayers = {
        most_kills: {
          name: "tobbbles",
          value: 29
        },
        most_adr: {
          name: "tobbbles",
          value: "102.8"
        },
        most_assists: {
          name: "kuula",
          value: 8
        },
        most_awp_kills: {
          name: "meppi",
          value: 10
        },
        most_utility_damage: {
          name: "Pronssi",
          value: 300
        },
        most_first_kills: {
          name: "meppi",
          value: 7
        },
        most_mates_flashed: {
          name: "enzoj",
          value: 10
        }
      };

      // Mock the database queries for each stat
      jest
        .spyOn(db, "runQuery")
        .mockResolvedValueOnce([{ name: "tobbbles", value: 29 }]) // kills
        .mockResolvedValueOnce([{ name: "tobbbles", value: "102.8" }]) // adr
        .mockResolvedValueOnce([{ name: "kuula", value: 8 }]) // assists
        .mockResolvedValueOnce([{ name: "meppi", value: 10 }]) // awp_kills
        .mockResolvedValueOnce([{ name: "Pronssi", value: 300 }]) // utility_damage
        .mockResolvedValueOnce([{ name: "meppi", value: 7 }]) // first_kills
        .mockResolvedValueOnce([{ name: "enzoj", value: 10 }]); // mates_flashed

      const response = await request(app)
        .get("/api/v1/matches/10340/topplayers")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedTopPlayers);
    });

    it("should handle non-existent match id", async () => {
      // Mock empty results for each stat
      jest
        .spyOn(db, "runQuery")
        .mockResolvedValueOnce([]) // kills
        .mockResolvedValueOnce([]) // adr
        .mockResolvedValueOnce([]) // assists
        .mockResolvedValueOnce([]) // awp_kills
        .mockResolvedValueOnce([]) // utility_damage
        .mockResolvedValueOnce([]) // first_kills
        .mockResolvedValueOnce([]); // mates_flashed

      const response = await request(app)
        .get("/api/v1/matches/99999/topplayers")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual({
        most_kills: null,
        most_adr: null,
        most_assists: null,
        most_awp_kills: null,
        most_utility_damage: null,
        most_first_kills: null,
        most_mates_flashed: null
      });
    });
  });

  describe("GET /matches/:game_id/teamstats", () => {
    it("should return team stats for match id 10340", async () => {
      const expectedTeamStats = [
        {
          team_id: 18,
          name: "Efecte Gaming Club",
          score: 16,
          team_ht_score: 6,
          first_kills: "13",
          clutches_won: "1",
          plants: "7",
          trades: "21"
        },
        {
          team_id: 53,
          name: "Polar Squad",
          score: 14,
          team_ht_score: 9,
          first_kills: "17",
          clutches_won: "1",
          plants: "5",
          trades: "17"
        }
      ];

      jest.spyOn(db, "runQuery").mockResolvedValueOnce(expectedTeamStats);

      const response = await request(app)
        .get("/api/v1/matches/10340/teamstats")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(expectedTeamStats);
    });

    it("should handle non-existent match id", async () => {
      jest.spyOn(db, "runQuery").mockResolvedValueOnce([]);

      const response = await request(app)
        .get("/api/v1/matches/99999/teamstats")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
