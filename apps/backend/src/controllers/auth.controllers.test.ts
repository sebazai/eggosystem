/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";
import * as uuid from "uuid";

import { redisClient } from "../utils/redisClient";

import * as authControllers from "../controllers/auth.controllers";
import * as authServices from "../services/auth.services";
import { type UserPayload, createMockUserPayload } from "@eggosystem/types";

describe("AuthControllers utils", () => {
  describe("generateTokens", () => {
    it("should generate tokens", () => {
      const user = createMockUserPayload({
        provider_id: "12345",
        nickname: "enzoj",
        account_id: 1
      });
      const jti = "123123";

      const signSpy = jest
        .spyOn(jwt, "sign")
        .mockImplementation(() => "mockedToken");

      const tokens = authServices.generateTokens(user, jti);

      expect(signSpy).toHaveBeenCalledTimes(2);
      expect(signSpy).toHaveBeenNthCalledWith(
        1,
        {
          account_id: 1,
          provider: "steam",
          provider_id: "12345",
          permissions: [],
          roles: [],
          nickname: "enzoj",
          jti: "123123"
        },
        "mock-private-key",
        { expiresIn: 1200, algorithm: "RS256" }
      );
      expect(signSpy).toHaveBeenNthCalledWith(
        2,
        {
          account_id: 1,
          provider: "steam",
          provider_id: "12345",
          permissions: [],
          roles: [],
          nickname: "enzoj",
          jti: "123123"
        },
        "mock-refresh-private-key",
        { expiresIn: 604800, algorithm: "RS256" }
      );

      expect(tokens).toEqual({
        accessToken: "mockedToken",
        refreshToken: "mockedToken"
      });
    });
  });
});

describe("AuthControllers", () => {
  const mockResponse = () => {
    const res = {} as any;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
  };

  describe("login", () => {
    let req: any, res: any;

    beforeEach(() => {
      jest.spyOn(authServices, "generateTokens").mockReturnValue({
        accessToken: "newAccessToken",
        refreshToken: "newRefreshToken"
      });

      jest
        .spyOn(authServices, "getPermissionsForAccountId")
        .mockResolvedValue([]);
      jest.spyOn(authServices, "getRolesForAccountId").mockResolvedValue([]);

      jest
        .spyOn(uuid, "v4")
        .mockImplementation((() => "123123") as typeof uuid.v4);
      req = {
        user: createMockUserPayload({
          account_id: 1,
          provider_id: "12345",
          nickname: "enzoj"
        })
      };
    });

    it("should return 200 and set cookies", async () => {
      res = mockResponse();

      await authControllers.login(req, res);

      expect(authServices.generateTokens).toHaveBeenCalledWith(
        {
          provider_id: "12345",
          nickname: "enzoj",
          permissions: [],
          roles: [],
          provider: "steam",
          account_id: 1
        } satisfies UserPayload,
        "123123"
      );

      expect(redisClient.set as jest.Mock).toHaveBeenCalledWith(
        "123123",
        "newRefreshToken",
        "EX",
        604800
      );
      expect(res.cookie).toHaveBeenCalledTimes(3);
      expect(res.cookie).toHaveBeenNthCalledWith(
        1,
        "access_token",
        "newAccessToken",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "strict",
          secure: false
        })
      );
    });
    // Should return error when no req.user
    it("should throw error when no req.user", async () => {
      res = mockResponse();
      req.user = undefined;
      try {
        await authControllers.login(req, res);
      } catch (error: unknown) {
        expect((error as Error).message).toBe("No user");
      }
    });
  });

  describe("logout", () => {
    let req: any, res: any;

    beforeEach(() => {
      jest.spyOn(authServices, "generateTokens").mockReturnValue({
        accessToken: "newAccessToken",
        refreshToken: "newRefreshToken"
      });

      jest
        .spyOn(uuid, "v4")
        .mockImplementation((() => "123123") as typeof uuid.v4);
      req = {
        cookies: { refresh_token: "mockRefreshToken" }
      };
    });
    // Should clear cookies and return 200
    it("should clear cookies, redis, and return 200", async () => {
      (jest.spyOn(jwt, "verify") as jest.Mock).mockImplementation(() => {
        return { steamId: "12345", jti: "123123" };
      });
      res = mockResponse();
      await authControllers.logout(req, res);
      expect(redisClient.del as jest.Mock).toHaveBeenCalledWith("123123");
      expect(res.clearCookie).toHaveBeenCalledTimes(3);
      expect(res.clearCookie).toHaveBeenNthCalledWith(1, "access_token", {
        path: "/"
      });
      expect(res.clearCookie).toHaveBeenNthCalledWith(2, "refresh_token", {
        path: "/api/v1/auth/refresh"
      });
      expect(res.clearCookie).toHaveBeenNthCalledWith(3, "refresh_token", {
        path: "/api/v1/auth/logout"
      });
    });
  });

  describe("refreshToken", () => {
    let req: any, res: any;

    beforeEach(() => {
      jest.spyOn(authServices, "generateTokens").mockReturnValue({
        accessToken: "newAccessToken",
        refreshToken: "newRefreshToken"
      });

      jest
        .spyOn(uuid, "v4")
        .mockImplementation((() => "123123") as typeof uuid.v4);
      req = { cookies: { refresh_token: "mockRefreshToken" } };
      res = mockResponse();
    });

    it("should return 401 if no refresh token is provided", async () => {
      req.cookies.refresh_token = undefined;

      const mockNext = jest.fn();
      await authControllers.refreshToken(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No refresh token",
          status: 401
        })
      );
    });

    it("should return 403 if refresh token is invalid", async () => {
      (jest.spyOn(jwt, "verify") as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const mockNext = jest.fn();
      await authControllers.refreshToken(req, res, mockNext);

      expect(res.clearCookie).toHaveBeenCalledWith("access_token", {
        path: "/"
      });
      expect(res.clearCookie).toHaveBeenCalledWith("refresh_token", {
        path: "/api/v1/auth/refresh"
      });
      expect(res.clearCookie).toHaveBeenCalledWith("refresh_token", {
        path: "/api/v1/auth/logout"
      });
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Error while updating refresh token",
          status: 403
        })
      );
    });

    it("should return 403 if stored token does not match", async () => {
      (jest.spyOn(jwt, "verify") as jest.Mock).mockImplementation(() => {
        return { steamId: "12345", jti: "123124" };
      });

      const mockNext = jest.fn();
      await authControllers.refreshToken(req, res, mockNext);

      expect(res.clearCookie).toHaveBeenCalledWith("access_token", {
        path: "/"
      });
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid refresh token",
          status: 403
        })
      );
    });

    it("should refresh token and set new cookies if valid token is provided", async () => {
      (jest.spyOn(jwt, "verify") as jest.Mock).mockImplementation(() => {
        return { steamId: "12345", jti: "123123" };
      });

      // Set up the refresh token in Redis to match the cookie token
      (redisClient.get as jest.Mock).mockResolvedValue("mockRefreshToken");

      jest
        .spyOn(authServices, "getPermissionsForAccountId")
        .mockResolvedValue([]);
      jest.spyOn(authServices, "getRolesForAccountId").mockResolvedValue([]);

      const mockNext = jest.fn();
      await authControllers.refreshToken(req, res, mockNext);

      expect(authServices.generateTokens).toHaveBeenCalledWith({
        steamId: "12345",
        permissions: [],
        roles: [],
        jti: "123123"
      });

      expect(redisClient.set as jest.Mock).toHaveBeenCalledWith(
        "123123",
        "newRefreshToken",
        "EX",
        604800
      );

      expect(res.cookie).toHaveBeenCalledTimes(3);
      expect(res.cookie).toHaveBeenNthCalledWith(
        1,
        "access_token",
        "newAccessToken",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "strict",
          secure: false
        })
      );

      expect(res.cookie).toHaveBeenNthCalledWith(
        2,
        "refresh_token",
        "newRefreshToken",
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          path: "/api/v1/auth/refresh",
          sameSite: "strict"
        })
      );
      expect(res.cookie).toHaveBeenNthCalledWith(
        3,
        "refresh_token",
        "newRefreshToken",
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          path: "/api/v1/auth/logout",
          sameSite: "strict"
        })
      );
      expect(res.status).not.toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Token refreshed" });
    });
    // Should have refresh_token and access_token secure: true if NODE_ENV === production
    it("should have refresh_token and access_token secure: true if NODE_ENV === production", async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = "production";
        jest
          .spyOn(authServices, "getPermissionsForAccountId")
          .mockResolvedValue(["captain:edit:season-1:team-2"]);
        jest
          .spyOn(authServices, "getRolesForAccountId")
          .mockResolvedValue(["captain"]);
        (jest.spyOn(jwt, "verify") as jest.Mock).mockImplementation(() => {
          return { steamId: "12345", jti: "123123" };
        });

        // Set up the refresh token in Redis to match the cookie token
        (redisClient.get as jest.Mock).mockResolvedValue("mockRefreshToken");

        const mockNext = jest.fn();
        await authControllers.refreshToken(req, res, mockNext);
        expect(authServices.generateTokens).toHaveBeenCalledWith({
          steamId: "12345",
          jti: "123123",
          permissions: ["captain:edit:season-1:team-2"],
          roles: ["captain"]
        });

        expect(redisClient.set as jest.Mock).toHaveBeenCalledWith(
          "123123",
          "newRefreshToken",
          "EX",
          604800
        );
        expect(res.cookie).toHaveBeenNthCalledWith(
          1,
          "access_token",
          "newAccessToken",
          expect.objectContaining({
            httpOnly: true,
            sameSite: "strict",
            secure: true
          })
        );
        expect(res.cookie).toHaveBeenNthCalledWith(
          2,
          "refresh_token",
          "newRefreshToken",
          expect.objectContaining({
            httpOnly: true,
            secure: true,
            path: "/api/v1/auth/refresh",
            sameSite: "strict"
          })
        );
        expect(res.cookie).toHaveBeenNthCalledWith(
          3,
          "refresh_token",
          "newRefreshToken",
          expect.objectContaining({
            httpOnly: true,
            secure: true,
            path: "/api/v1/auth/logout",
            sameSite: "strict"
          })
        );
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });
});
