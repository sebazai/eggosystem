import request from "supertest";
import express from "express";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import discordRouter from "./discord.routes";
import { getUserDiscordStatus } from "../../controllers/discord.controllers";
import type { Request, Response, NextFunction } from "express";
import type { UserPayload } from "@eggosystem/types";
import { UnauthorizedError } from "../../utils/errors";
import { expressErrorHandler } from "../../middlewares/express-error-handler";

// Mock dependencies
jest.mock("../../middlewares/auth.middleware");
jest.mock("../../controllers/discord.controllers");

const mockAuthenticateJWT = authenticateJWT as jest.MockedFunction<
  typeof authenticateJWT
>;
const mockGetUserDiscordStatus = getUserDiscordStatus as jest.MockedFunction<
  typeof getUserDiscordStatus
>;

describe("Discord Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use("/api/v1/discord", discordRouter);
    app.use(expressErrorHandler);
  });

  describe("GET /api/v1/discord/user/status", () => {
    it("should require authentication", async () => {
      mockAuthenticateJWT.mockImplementation(
        async (req: Request, res: Response, next: NextFunction) => {
          return next(new UnauthorizedError("Unauthorized"));
        }
      );

      const response = await request(app)
        .get("/api/v1/discord/user/status")
        .expect(401);

      expect(response.body).toEqual({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Unauthorized",
        instance: "/api/v1/discord/user/status"
      });
      expect(mockAuthenticateJWT).toHaveBeenCalled();
    });

    it("should call getUserDiscordStatus when authenticated", async () => {
      mockAuthenticateJWT.mockImplementation(
        async (req: Request, res: Response, next: NextFunction) => {
          req.auth = {
            account_id: 123,
            provider_id: "steam123",
            permissions: [],
            roles: [],
            nickname: "testuser",
            provider: "steam"
          } as UserPayload;
          next();
        }
      );

      mockGetUserDiscordStatus.mockImplementation(
        async (req: Request, res: Response) => {
          res.json({
            hasDiscordUsername: true,
            discordUsername: "testuser#1234",
            kanahautomoRegistrations: []
          });
        }
      );

      const response = await request(app)
        .get("/api/v1/discord/user/status")
        .expect(200);

      expect(response.body).toEqual({
        hasDiscordUsername: true,
        discordUsername: "testuser#1234",
        kanahautomoRegistrations: []
      });
      expect(mockGetUserDiscordStatus).toHaveBeenCalled();
    });

    it("should handle errors from getUserDiscordStatus", async () => {
      mockAuthenticateJWT.mockImplementation(
        async (req: Request, res: Response, next: NextFunction) => {
          req.auth = {
            account_id: 123,
            provider_id: "steam123",
            permissions: [],
            roles: [],
            nickname: "testuser",
            provider: "steam"
          } as UserPayload;
          next();
        }
      );

      mockGetUserDiscordStatus.mockImplementation(
        async (req: Request, res: Response) => {
          res.status(500).json({ error: "Internal server error" });
        }
      );

      const response = await request(app)
        .get("/api/v1/discord/user/status")
        .expect(500);

      expect(response.body).toEqual({ error: "Internal server error" });
    });
  });
});
