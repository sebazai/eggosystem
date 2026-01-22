// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../test-utils";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import discordRouter from "./discord.routes";
import {
  getUserDiscordStatus,
  unlinkDiscordAccountController
} from "../../controllers/discord.controllers";
import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../../utils/errors";
import { createMockUserPayload } from "@eggosystem/types";

// Mock dependencies
jest.mock("../../middlewares/auth.middleware");
jest.mock("../../controllers/discord.controllers");

const mockAuthenticateJWT = authenticateJWT as jest.MockedFunction<
  typeof authenticateJWT
>;
const mockGetUserDiscordStatus = getUserDiscordStatus as jest.MockedFunction<
  typeof getUserDiscordStatus
>;
const mockUnlinkDiscordAccountController =
  unlinkDiscordAccountController as jest.MockedFunction<
    typeof unlinkDiscordAccountController
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
          req.auth = createMockUserPayload({
            account_id: 123,
            provider_id: "steam123",
            nickname: "testuser"
          });
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
          req.auth = createMockUserPayload({
            account_id: 123,
            provider_id: "steam123",
            nickname: "testuser"
          });
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

  describe("DELETE /unlink", () => {
    it("should return 401 Unauthorized when no authentication token is provided", async () => {
      mockAuthenticateJWT.mockImplementation(
        async (req: Request, res: Response, next: NextFunction) => {
          return next(new UnauthorizedError("Unauthorized"));
        }
      );

      const response = await request(app).delete("/unlink").expect(401);

      expect(response.body).toEqual({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Unauthorized",
        instance: "/unlink"
      });
      expect(mockAuthenticateJWT).toHaveBeenCalled();
      expect(mockUnlinkDiscordAccountController).not.toHaveBeenCalled();
    });

    it("should return 401 Unauthorized when invalid token is provided", async () => {
      mockAuthenticateJWT.mockImplementation(
        async (req: Request, res: Response, next: NextFunction) => {
          return next(new UnauthorizedError("Unauthorized"));
        }
      );

      const response = await request(app)
        .delete("/unlink")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);

      expect(response.body).toEqual({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Unauthorized",
        instance: "/unlink"
      });
      expect(mockAuthenticateJWT).toHaveBeenCalled();
    });

    it("should return 401 Unauthorized when authenticateJWT middleware rejects", async () => {
      mockAuthenticateJWT.mockImplementation(
        async (req: Request, res: Response, next: NextFunction) => {
          return next(new UnauthorizedError("Unauthorized"));
        }
      );

      const response = await request(app).delete("/unlink").expect(401);

      expect(response.body).toEqual({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Unauthorized",
        instance: "/unlink"
      });
      expect(mockUnlinkDiscordAccountController).not.toHaveBeenCalled();
    });

    it("should successfully call controller when authenticated", async () => {
      mockAuthenticateJWT.mockImplementation(
        async (req: Request, res: Response, next: NextFunction) => {
          req.auth = createMockUserPayload({
            account_id: 123,
            provider_id: "steam123",
            nickname: "testuser"
          });
          next();
        }
      );

      mockUnlinkDiscordAccountController.mockImplementation(
        async (req: Request, res: Response) => {
          res.json({
            message: "Discord account unlinked successfully"
          });
        }
      );

      const response = await request(app).delete("/unlink").expect(200);

      expect(response.body).toEqual({
        message: "Discord account unlinked successfully"
      });
      expect(mockUnlinkDiscordAccountController).toHaveBeenCalled();
    });

    it("should handle errors from controller", async () => {
      mockAuthenticateJWT.mockImplementation(
        async (req: Request, res: Response, next: NextFunction) => {
          req.auth = createMockUserPayload({
            account_id: 123,
            provider_id: "steam123",
            nickname: "testuser"
          });
          next();
        }
      );

      mockUnlinkDiscordAccountController.mockImplementation(
        async (req: Request, res: Response, _next: NextFunction) => {
          res.status(500).json({ error: "Internal server error" });
        }
      );

      const response = await request(app).delete("/unlink").expect(500);

      expect(response.body).toEqual({ error: "Internal server error" });
    });
  });
});
