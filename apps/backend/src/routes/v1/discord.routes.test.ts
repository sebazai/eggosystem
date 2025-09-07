// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../test-utils";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import discordRouter from "./discord.routes";
import { getUserDiscordStatus } from "../../controllers/discord.controllers";
import type { Request, Response, NextFunction } from "express";
import type { UserPayload } from "@eggosystem/types";
import { UnauthorizedError } from "../../utils/errors";

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
  let cleanup: () => void;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a custom router that includes the mocked authenticateJWT middleware
    const customRouter = express.Router();
    customRouter.use(authenticateJWT);
    customRouter.use(discordRouter);

    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      customRouter,
      "/" // Mount at root, so internal router paths are used directly
    );
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /user/status", () => {
    it("should require authentication", async () => {
      mockAuthenticateJWT.mockImplementation(
        async (req: Request, res: Response, next: NextFunction) => {
          return next(new UnauthorizedError("Unauthorized"));
        }
      );

      const response = await request(app).get("/user/status").expect(401);

      expect(response.body).toEqual({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Unauthorized",
        instance: "/user/status"
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

      const response = await request(app).get("/user/status").expect(200);

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

      const response = await request(app).get("/user/status").expect(500);

      expect(response.body).toEqual({ error: "Internal server error" });
    });
  });
});
