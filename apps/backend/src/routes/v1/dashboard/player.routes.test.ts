import request from "supertest";
import express from "express";
import playerRoutes from "./player.routes";
import { expressErrorHandler } from "../../../middlewares/express-error-handler";
import * as playerControllers from "../../../controllers/dashboard/player.controllers";

// Mock the controllers
jest.mock("../../../controllers/dashboard/player.controllers");

const mockAddPlayerToTeamController =
  playerControllers.addPlayerToTeamController as jest.MockedFunction<
    typeof playerControllers.addPlayerToTeamController
  >;
const mockAddSubstitutePlayerController =
  playerControllers.addSubstitutePlayerController as jest.MockedFunction<
    typeof playerControllers.addSubstitutePlayerController
  >;
const mockValidatePlayerController =
  playerControllers.validatePlayerController as jest.MockedFunction<
    typeof playerControllers.validatePlayerController
  >;
const mockPreparePlayerForSignupController =
  playerControllers.preparePlayerForSignupController as jest.MockedFunction<
    typeof playerControllers.preparePlayerForSignupController
  >;

describe("Dashboard Player Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use("/api/v1/dashboard/players", playerRoutes);
    app.use(expressErrorHandler);
  });

  describe("POST /:steam_id/team/:team_id/season/:season_id/substitute", () => {
    it("should call addSubstitutePlayerController with correct parameters", async () => {
      mockAddSubstitutePlayerController.mockImplementation(
        async (req, res, _next) => {
          res.status(200).json({
            message: "Substitute player successfully added to the team",
            steam_id: req.params.steam_id,
            team_id: Number(req.params.team_id),
            season_id: Number(req.params.season_id),
            role: "substitute",
            match_id: null
          });
        }
      );

      const response = await request(app)
        .post(
          "/api/v1/dashboard/players/76561198000000001/team/123/season/456/substitute"
        )
        .send({})
        .expect(200);

      expect(mockAddSubstitutePlayerController).toHaveBeenCalledWith(
        expect.objectContaining({
          params: {
            steam_id: "76561198000000001",
            team_id: "123",
            season_id: "456"
          }
        }),
        expect.any(Object),
        expect.any(Function)
      );

      expect(response.body).toMatchObject({
        message: "Substitute player successfully added to the team",
        steam_id: "76561198000000001",
        team_id: 123,
        season_id: 456,
        role: "substitute",
        match_id: null
      });
    });

    it("should call addSubstitutePlayerController with match_id in body", async () => {
      mockAddSubstitutePlayerController.mockImplementation(
        async (req, res, _next) => {
          res.status(200).json({
            message: "Substitute player successfully added to the team",
            steam_id: req.params.steam_id,
            team_id: Number(req.params.team_id),
            season_id: Number(req.params.season_id),
            role: "substitute",
            match_id: req.body.match_id
          });
        }
      );

      const response = await request(app)
        .post(
          "/api/v1/dashboard/players/76561198000000001/team/123/season/456/substitute"
        )
        .send({ match_id: 789 })
        .expect(200);

      expect(mockAddSubstitutePlayerController).toHaveBeenCalledWith(
        expect.objectContaining({
          params: {
            steam_id: "76561198000000001",
            team_id: "123",
            season_id: "456"
          },
          body: { match_id: 789 }
        }),
        expect.any(Object),
        expect.any(Function)
      );

      expect(response.body).toMatchObject({
        message: "Substitute player successfully added to the team",
        match_id: 789
      });
    });

    it("should validate numeric parameters", async () => {
      const response = await request(app)
        .post(
          "/api/v1/dashboard/players/76561198000000001/team/invalid/season/456/substitute"
        )
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: expect.stringContaining("team_id"),
        instance: expect.any(String)
      });

      expect(mockAddSubstitutePlayerController).not.toHaveBeenCalled();
    });
  });

  describe("POST /:steam_id/team/:team_id/season/:season_id/add", () => {
    it("should call addPlayerToTeamController", async () => {
      mockAddPlayerToTeamController.mockImplementation(
        async (req, res, _next) => {
          res.status(200).json({ success: true });
        }
      );

      await request(app)
        .post(
          "/api/v1/dashboard/players/76561198000000001/team/123/season/456/add"
        )
        .send({ kana_elo: 1500 })
        .expect(200);

      expect(mockAddPlayerToTeamController).toHaveBeenCalled();
    });
  });

  describe("GET /:steam_id/validate", () => {
    it("should call validatePlayerController", async () => {
      mockValidatePlayerController.mockImplementation(
        async (req, res, _next) => {
          res.status(200).json({ valid: true });
        }
      );

      await request(app)
        .get(
          "/api/v1/dashboard/players/76561198000000001/validate?season_id=456"
        )
        .expect(200);

      expect(mockValidatePlayerController).toHaveBeenCalled();
    });
  });

  describe("POST /:steam_id/prepare-for-signup", () => {
    it("should call preparePlayerForSignupController", async () => {
      mockPreparePlayerForSignupController.mockImplementation(
        async (req, res, _next) => {
          res.status(200).json({
            message: "Player prepared for signup successfully",
            account_id: 123,
            steam_id: req.params.steam_id
          });
        }
      );

      const response = await request(app)
        .post("/api/v1/dashboard/players/76561198012345678/prepare-for-signup")
        .expect(200);

      expect(mockPreparePlayerForSignupController).toHaveBeenCalledWith(
        expect.objectContaining({
          params: {
            steam_id: "76561198012345678"
          }
        }),
        expect.any(Object),
        expect.any(Function)
      );

      expect(response.body).toMatchObject({
        message: "Player prepared for signup successfully",
        account_id: 123,
        steam_id: "76561198012345678"
      });
    });
  });
});
