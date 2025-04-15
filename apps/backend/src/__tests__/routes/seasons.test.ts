import request from "supertest";
import * as seasonModels from "../../models/season.models";
import type TestAgent from "supertest/lib/agent";
import { SeasonPlatform, type Season } from "@eggosystem/types";
import _ from "lodash";
import express from "express";
import seasonRoutes from "../../routes/v1/season.routes";

const mockSeasonWith = (returnValue: Partial<Season> | undefined) => {
  jest.spyOn(seasonModels, "getSeasonById").mockResolvedValue(
    returnValue
      ? ({
          platform: SeasonPlatform.Kanaliiga,
          ...returnValue
        } as Season)
      : undefined
  );
};

const validSignupData = {
  organizationId: 1,
  teamId: 1,
  teamExternalId: "team-123",
  players: [
    {
      account_id: 1,
      steam_id: "12345678901234567",
      nickname: "Player One",
      discord: "playerOne#1234",
      captain: true
    },
    {
      account_id: 2,
      steam_id: "12345678901234568",
      nickname: "Player Two",
      discord: "playerTwo#1234",
      co_captain: true
    },
    {
      account_id: 3,
      steam_id: "12345678901234569",
      nickname: "Player three"
    },
    {
      account_id: 4,
      steam_id: "12345678901234570",
      nickname: "Player Four"
    },
    {
      account_id: 5,
      steam_id: "12345678901234571",
      nickname: "Player Five"
    }
  ]
};

const invalidSignupData = {
  organizationId: -1,
  teamId: -1,
  teamExternalId: "team-123",
  players: [
    {
      account_id: 1,
      steam_id: "12345678901234567",
      nickname: "Player One",
      captain: true
    },
    {
      account_id: 2,
      steam_id: "12345678901234568",
      nickname: "Player Two",
      discord: "playerTwo#1234",
      co_captain: true
    },
    {
      account_id: 3,
      steam_id: "12345678901234569",
      nickname: "Player three"
    },
    {
      account_id: 4,
      steam_id: "12345678901234570",
      nickname: "Player Four"
    },
    {
      account_id: 5,
      steam_id: "12345678901234571",
      nickname: "Player Five"
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /:id/signup", () => {
  describe("with valid data", () => {
    it("should return 404 if season does not exist", async () => {
      mockSeasonWith(undefined);
      const res = await agent.post("/123/signup").send(validSignupData);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Season not found");
    });

    it("should return 400 if season has no signup start date", async () => {
      mockSeasonWith({
        signup_start_date: null
      });
      const res = await agent.post("/123/signup").send(validSignupData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Season does not have a signup start date");
    });

    it("should return 400 if signup has not started yet", async () => {
      mockSeasonWith({
        signup_start_date: "2100-01-01T00:00:00Z"
      });
      const res = await agent.post("/123/signup").send(validSignupData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Signup has not started yet");
    });

    it("should return 400 if signup has ended", async () => {
      mockSeasonWith({
        signup_start_date: "2024-01-01T00:00:00Z",
        signup_end_date: "2024-01-02T00:00:00Z"
      });
      const res = await agent.post("/123/signup").send(validSignupData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Signup has ended");
    });

    it("should return 400 if the signup form data is invalid", async () => {
      mockSeasonWith({
        signup_start_date: "2024-01-01T00:00:00Z"
      });
      const invalidData = { ...validSignupData, players: [] }; // Invalid: not enough players
      const res = await agent.post("/123/signup").send(invalidData);
      expect(res.status).toBe(400);
    });
  });

  // Custom Schema testing
  describe("with invalid data", () => {
    it("should return 400 if organizationId -1 and missing newOrganization", async () => {
      mockSeasonWith({ signup_start_date: "2024-01-01T00:00:00Z" });
      const res = await agent.post("/123/signup").send(invalidSignupData);
      expect(res.status).toBe(400);

      expect(res.body.errors.fieldErrors.newOrganization).toEqual([
        "New organization details are required when 'Add new...' is selected."
      ]);
    });
    it("should return 400 if teamId -1 and missing newTeam", async () => {
      mockSeasonWith({ signup_start_date: "2024-01-01T00:00:00Z" });
      const res = await agent.post("/123/signup").send(invalidSignupData);
      expect(res.status).toBe(400);

      expect(res.body.errors.fieldErrors.newTeam).toEqual([
        "New team details are required when 'Add new...' is selected."
      ]);
    });
    it("should return 400 if missing discord for captain", async () => {
      mockSeasonWith({ signup_start_date: "2024-01-01T00:00:00Z" });
      const res = await agent.post("/123/signup").send(invalidSignupData);
      expect(res.status).toBe(400);

      expect(res.body.errors.fieldErrors.players).toEqual([
        "Captains and co-captains must provide a Discord username."
      ]);
    });
    it("should return 400 if duplicate steam_id", async () => {
      mockSeasonWith({ signup_start_date: "2024-01-01T00:00:00Z" });
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
