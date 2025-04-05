import request from "supertest";
import * as seasonModels from "../../models/season.models";
import type TestAgent from "supertest/lib/agent";
import type { Season } from "@eggosystem/types";
import _ from "lodash";
import express from "express";
import seasonRoutes from "../../routes/v1/season.routes";

const validSignupData = {
  organizationId: 1,
  teamId: 1,
  teamExternalId: "team-123",
  players: [
    {
      steam_id: "12345678901234567",
      name: "Player One",
      work_email: "pl***@example.com",
      discord: "playerOne#1234",
      captain: true
    },
    {
      steam_id: "12345678901234568",
      name: "Player Two",
      work_email: "player.two@example.com",
      discord: "playerTwo#1234",
      co_captain: true
    },
    {
      steam_id: "12345678901234569",
      name: "Player three",
      work_email: "player.three@example.com"
    },
    {
      steam_id: "12345678901234570",
      name: "Player Four",
      work_email: "player.four@example.com"
    },
    {
      steam_id: "12345678901234571",
      name: "Player Five",
      work_email: "player.five@example.com"
    }
  ]
};

const invalidSignupData = {
  organizationId: -1,
  teamId: -1,
  teamExternalId: "team-123",
  players: [
    {
      steam_id: "12345678901234567",
      name: "Player One",
      full_name: "Player One",
      work_email: "player.one@example.com",
      captain: true
    },
    {
      steam_id: "12345678901234568",
      name: "Player Two",
      work_email: "player.two@example.com",
      discord: "playerTwo#1234",
      co_captain: true
    },
    {
      steam_id: "12345678901234569",
      name: "Player three",
      work_email: "player.three@example.com"
    },
    {
      steam_id: "12345678901234570",
      name: "Player Four",
      work_email: "player.four@example.com"
    },
    {
      steam_id: "12345678901234571",
      name: "Player Five",
      work_email: "player.five@example.com"
    }
  ]
};

let agent: TestAgent;

beforeAll(() => {
  const app = express();
  app.use(express.json());
  app.use(seasonRoutes);

  // Create a Supertest agent with default cookie set
  agent = request.agent(app);
  agent.set("Authorization", "Bearer valid_token");
});

describe("POST /:id/signup", () => {
  describe("with valid data", () => {
    it("should return 404 if season does not exist", async () => {
      jest.spyOn(seasonModels, "getSeasonById").mockResolvedValue([]);
      const res = await agent.post("/123/signup").send(validSignupData);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Season not found");
    });

    it("should return 400 if season has no signup start date", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([{ signup_start_date: null } as Season]);
      const res = await agent.post("/123/signup").send(validSignupData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Season does not have a signup start date");
    });

    it("should return 400 if signup has not started yet", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2100-01-01T00:00:00Z" } as Season
        ]);
      const res = await agent.post("/123/signup").send(validSignupData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Signup has not started yet");
    });

    it("should return 400 if signup has ended", async () => {
      jest.spyOn(seasonModels, "getSeasonById").mockResolvedValue([
        {
          signup_start_date: "2024-01-01T00:00:00Z",
          signup_end_date: "2024-01-02T00:00:00Z"
        } as Season
      ]);
      const res = await agent.post("/123/signup").send(validSignupData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Signup has ended");
    });

    it("should return 400 if the signup form data is invalid", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      const invalidData = { ...validSignupData, players: [] }; // Invalid: not enough players
      const res = await agent.post("/123/signup").send(invalidData);
      expect(res.status).toBe(400);
    });
  });

  // Custom Schema testing
  describe("with invalid data", () => {
    it("should return 400 if captain missing discord nick", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      const res = await agent.post("/123/signup").send(invalidSignupData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid signup form data");
      expect(res.body.errors.fieldErrors.players).toEqual([
        "Captains and co-captains must provide a Discord username."
      ]);
    });
    it("should return 400 if organizationId -1 and missing newOrganization", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      const res = await agent.post("/123/signup").send(invalidSignupData);
      expect(res.status).toBe(400);

      expect(res.body.errors.fieldErrors.newOrganization).toEqual([
        "New organization details are required when 'Add new...' is selected."
      ]);
    });
    it("should return 400 if teamId -1 and missing newTeam", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      const res = await agent.post("/123/signup").send(invalidSignupData);
      expect(res.status).toBe(400);

      expect(res.body.errors.fieldErrors.newTeam).toEqual([
        "New team details are required when 'Add new...' is selected."
      ]);
    });
    it("should return 400 if player full name incorrect and missing discord for captain", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      invalidSignupData.players[0].full_name = "InvalidName";
      const res = await agent.post("/123/signup").send(invalidSignupData);
      expect(res.status).toBe(400);

      expect(res.body.errors.fieldErrors.players).toEqual([
        "Full name must contain a first name and a last name, separated by a space.",
        "Captains and co-captains must provide a Discord username."
      ]);
    });
    it("should return 400 if player email incorrect", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      invalidSignupData.players[0].work_email = "invalid-email";
      const res = await agent.post("/123/signup").send(invalidSignupData);
      expect(res.status).toBe(400);
      expect(res.body.errors.fieldErrors.players).toContain(
        "Invalid email format."
      );
    });
    it("should return 400 if duplicate steam_id", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      invalidSignupData.players[0].steam_id =
        invalidSignupData.players[1].steam_id;
      const res = await agent.post("/123/signup").send(invalidSignupData);
      expect(res.status).toBe(400);
      expect(res.body.errors.fieldErrors.players).toContain(
        "Each player must have a unique Steam ID."
      );
    });
  });
});
