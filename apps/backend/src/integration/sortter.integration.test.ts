import request from "supertest";
import { app } from "../app";

// Define a type that matches our expected player data
interface PlayerValues {
  name: string;
  steamid: string;
  cs2_rank: number;
  faceit_level: number;
  faceit_elo: number;
  hours: number;
  kanarating: number;
  fkd: number;
}

describe("Sortter API Integration Tests", () => {
  describe("GET /api/v1/sortter/season/:season/team/:team/playervalues", () => {
    it("should return player values for season 14 team 2021 including player 76561197960383236", async () => {
      const response = await request(app)
        .get("/api/v1/sortter/season/14/team/2021/playervalues")
        .expect(200);

      // Verify we get an array of players
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Find the specific player we want to test
      const testPlayer = response.body.find(
        (player: PlayerValues) => player.steamid === "76561197960383236"
      );

      // Verify the player exists and has the expected values
      expect(testPlayer).toBeDefined();
      expect(testPlayer).toMatchObject({
        name: "toNppa",
        steamid: "76561197960383236",
        cs2_rank: 17690,
        faceit_level: 9,
        faceit_elo: 1954,
        hours: 3382,
        fkd: 1.21
      });

      // Verify kanarating is approximately correct (float comparison)
      expect(testPlayer.kanarating).toBeCloseTo(1.296875, 5);
    });

    it("should return 404 if no players found", async () => {
      const response = await request(app)
        .get("/api/v1/sortter/season/14/team/99999/playervalues")
        .expect(404);

      expect(response.body).toEqual({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "No players found for team 99999 in season 14",
        instance: "/api/v1/sortter/season/14/team/99999/playervalues"
      });
    });

    it("should validate numeric parameters", async () => {
      const response = await request(app)
        .get("/api/v1/sortter/season/invalid/team/2021/playervalues")
        .expect(400);

      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid numeric param: season",
        instance: "/api/v1/sortter/season/invalid/team/2021/playervalues"
      });
    });
  });
});
