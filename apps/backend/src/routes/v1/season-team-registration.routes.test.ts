import request from "supertest";
import * as seasonModels from "../../models/season.models";
import type TestAgent from "supertest/lib/agent";
import {
  type SeasonDetails,
  SeasonPlatform,
  type SignupFormValues
} from "@eggosystem/types";
import _ from "lodash";
import express from "express";
import seasonTeamRegRoute from "./season-team-registration.routes";
import { validSignupData, invalidSignupData } from "@eggosystem/shared-msw";
import { expressErrorHandler } from "../../middlewares/express-error-handler";

const mockSeasonWith = (returnValue: Partial<SeasonDetails> | undefined) => {
  jest.spyOn(seasonModels, "getSeasonDetailsById").mockResolvedValue(
    returnValue
      ? ({
          app_id: 730,
          platform: SeasonPlatform.FACEIT,
          ...returnValue
        } as SeasonDetails)
      : undefined
  );
};

let agent: TestAgent;

beforeAll(() => {
  const app = express();
  app.use(express.json());
  app.use(seasonTeamRegRoute);
  app.use(expressErrorHandler);

  // Create a Supertest agent with default cookie set
  agent = request.agent(app);
  agent.set("Authorization", "Bearer valid_token");
});

describe("POST /:id/signup", () => {
  describe("with valid data", () => {
    it("should return 404 if season does not exist", async () => {
      mockSeasonWith(undefined);
      const res = await agent.post("/season/123/signup").send(validSignupData);
      expect(res.status).toBe(404);
      expect(res.text).toContain("Season not found");
    });

    it("should return 400 if season has no signup start date", async () => {
      mockSeasonWith({
        signup_start_date: null
      });
      const res = await agent.post("/season/123/signup").send(validSignupData);
      expect(res.status).toBe(400);
      expect(res.text).toContain("Season does not have a signup start date");
    });

    it("should return 400 if signup has not started yet", async () => {
      mockSeasonWith({
        signup_start_date: "2100-01-01T00:00:00Z"
      });
      const res = await agent.post("/season/123/signup").send(validSignupData);
      expect(res.status).toBe(400);
      expect(res.text).toContain("Signup has not started yet");
    });

    it("should return 400 if signup has ended", async () => {
      mockSeasonWith({
        signup_start_date: "2024-01-01T00:00:00Z",
        signup_end_date: "2024-01-02T00:00:00Z"
      });
      const res = await agent.post("/season/123/signup").send(validSignupData);
      expect(res.status).toBe(400);
      expect(res.text).toContain("Signup has ended");
    });

    it("should return 400 if the signup form data is invalid", async () => {
      mockSeasonWith({
        signup_start_date: "2024-01-01T00:00:00Z"
      });
      const invalidData = { ...validSignupData, players: [] }; // Invalid: not enough players
      const res = await agent.post("/season/123/signup").send(invalidData);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: expect.stringContaining(
          "Too small: expected array to have >=5 items"
        ),
        instance: "/season/123/signup",
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: "too_small",
            message: "Too small: expected array to have >=5 items"
          })
        ])
      });
    });
  });

  // Custom Schema testing
  describe("with invalid data", () => {
    it("should return 400 if organizationId -1 and missing newOrganization", async () => {
      mockSeasonWith({ signup_start_date: "2024-01-01T00:00:00Z" });
      const res = await agent
        .post("/season/123/signup")
        .send(invalidSignupData);
      expect(res.status).toBe(400);

      expect(res.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: expect.stringContaining(
          "New organization details are required when 'Add new...' is selected."
        ),
        instance: "/season/123/signup",
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: "custom",
            message:
              "New organization details are required when 'Add new...' is selected."
          })
        ])
      });
    });

    it("should return 400 if teamId -1 and missing newTeam", async () => {
      mockSeasonWith({ signup_start_date: "2024-01-01T00:00:00Z" });

      const res = await agent
        .post("/season/123/signup")
        .send(invalidSignupData);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: expect.stringContaining(
          "New team details are required when 'Add new...' is selected."
        ),
        instance: "/season/123/signup",
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: "custom",
            message:
              "New team details are required when 'Add new...' is selected."
          })
        ])
      });
    });

    it("should return 400 if missing discord for captain", async () => {
      mockSeasonWith({ signup_start_date: "2024-01-01T00:00:00Z" });
      const testData = _.cloneDeep(invalidSignupData) as SignupFormValues;
      // Ensure captain doesn't have discordLinked set
      if (testData.players[0]) {
        testData.players[0].discordLinked = false;
      }

      const res = await agent.post("/season/123/signup").send(testData);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: expect.stringContaining(
          "Captains and co-captains must link their Discord account in their profile."
        ),
        instance: "/season/123/signup",
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: "custom",
            message:
              "Captains and co-captains must link their Discord account in their profile.",
            path: expect.arrayContaining([
              "players",
              expect.any(Number),
              "discordLinked"
            ])
          })
        ])
      });
    });

    it("should return 400 if duplicate steamId", async () => {
      mockSeasonWith({ signup_start_date: "2024-01-01T00:00:00Z" });
      const dataWithDuplicateSteamId = {
        ...invalidSignupData,
        players: [
          ...invalidSignupData.players.slice(0, 1),
          {
            ...invalidSignupData.players[1],
            steamId: invalidSignupData.players[0].steamId
          },
          ...invalidSignupData.players.slice(2)
        ]
      };

      const res = await agent
        .post("/season/123/signup")
        .send(dataWithDuplicateSteamId);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: expect.stringContaining(
          "Each player must have a unique Steam ID."
        ),
        instance: "/season/123/signup",
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: "custom",
            message: "Each player must have a unique Steam ID."
          })
        ])
      });
    });
  });
});
