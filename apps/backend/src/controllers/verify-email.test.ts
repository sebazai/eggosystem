import request from "supertest";
import express from "express";
import { verifyEmailController } from "./account.controllers";
import { redisClient } from "../utils/redisClient";
import { runQuery } from "../db/mysqlRunQuery";
import { expressErrorHandler } from "../middlewares/express-error-handler";

// Mock dependencies
jest.mock("../utils/redisClient");
jest.mock("../db/mysqlRunQuery");
jest.mock("../utils/app-logger");

const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("POST /verify-email", () => {
  const app = express();
  app.use(express.json());
  app.post("/verify-email", verifyEmailController);
  app.use(expressErrorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Success Cases", () => {
    it("should verify email successfully using Redis token", async () => {
      const token = "valid-redis-token";
      const mockRedisData = {
        accountId: "123",
        email: "test@example.com",
        expirationTime: new Date(Date.now() + 86400000).toISOString() // 1 day from now
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockRedisData));
      mockRedisClient.del.mockResolvedValue(1);
      mockRunQuery.mockResolvedValue([]);

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Email verified successfully" });

      // Verify Redis interactions
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        `verify:work-email:${token}`
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        `verify:work-email:${token}`
      );

      // Verify database update
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE Accounts"),
        ["123"]
      );
    });

    it("should verify email successfully using database token fallback", async () => {
      const token = "valid-db-token";

      // Redis returns null (no data found)
      mockRedisClient.get.mockResolvedValue(null);

      // Database returns account
      mockRunQuery.mockResolvedValueOnce({ affectedRows: 1 }); // First call for UPDATE

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Email verified successfully" });

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE Accounts"),
        [token]
      );
    });
  });

  describe("Validation Errors", () => {
    it("should return 400 when no token is provided", async () => {
      const response = await request(app).post("/verify-email").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "No token provided",
        instance: "/verify-email"
      });

      // Should not call Redis or database
      expect(mockRedisClient.get).not.toHaveBeenCalled();
      expect(mockRunQuery).not.toHaveBeenCalled();
    });

    it("should return 400 when token is empty string", async () => {
      const response = await request(app)
        .post("/verify-email")
        .send({ token: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "No token provided",
        instance: "/verify-email"
      });
    });

    it("should return 400 when token is null", async () => {
      const response = await request(app)
        .post("/verify-email")
        .send({ token: null });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "No token provided",
        instance: "/verify-email"
      });
    });
  });

  describe("Token Expiration", () => {
    it("should return 400 when Redis token is expired", async () => {
      const token = "expired-redis-token";
      const mockRedisData = {
        accountId: "123",
        email: "test@example.com",
        expirationTime: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockRedisData));

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid or expired token.",
        instance: "/verify-email"
      });

      // Should not update database or delete from Redis
      expect(mockRunQuery).not.toHaveBeenCalled();
      expect(mockRedisClient.del).toHaveBeenCalled();
    });

    it("should return 400 when database token is expired", async () => {
      const token = "expired-db-token";

      // Redis returns null (no data found)
      mockRedisClient.get.mockResolvedValue(null);

      // Database query should properly check expiration with NOW()
      // This should return empty array for expired tokens
      mockRunQuery.mockResolvedValue([]);

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid or expired token.",
        instance: "/verify-email"
      });

      // Verify the database query includes expiration check
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("work_email_token_expires_at > NOW()"),
        [token]
      );
    });

    it("should verify successfully when database token is not expired", async () => {
      const token = "valid-db-token";

      mockRedisClient.get.mockResolvedValue(null);
      mockRunQuery.mockResolvedValueOnce({ affectedRows: 1 }); // Update query

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Email verified successfully" });
    });

    it("should handle Redis valid token when database token is expired", async () => {
      const token = "redis-valid-db-expired-token";
      const mockRedisData = {
        accountId: "123",
        email: "test@example.com",
        expirationTime: new Date(Date.now() + 86400000).toISOString() // Valid in Redis (1 day from now)
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockRedisData));
      mockRedisClient.del.mockResolvedValue(1);
      mockRunQuery.mockResolvedValue([]);

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Email verified successfully" });

      // Should use Redis data and update database
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE Accounts"),
        ["123"]
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        `verify:work-email:${token}`
      );
    });
  });

  describe("Invalid Tokens", () => {
    it("should return 400 when token is not found in Redis or database", async () => {
      const token = "invalid-token";

      // Redis returns null
      mockRedisClient.get.mockResolvedValue(null);

      // Database returns empty array
      mockRunQuery.mockResolvedValue([]);

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid or expired token.",
        instance: "/verify-email"
      });
    });

    it("should return 400 when token exists in database but account not found", async () => {
      const token = "orphaned-token";

      mockRedisClient.get.mockResolvedValue(null);
      mockRunQuery.mockResolvedValue([undefined]); // Account not found

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid or expired token.",
        instance: "/verify-email"
      });
    });
  });

  describe("Error Handling", () => {
    it("should return 400 when database query fails to update", async () => {
      const token = "db-token";

      mockRedisClient.get.mockResolvedValue(null);
      mockRunQuery.mockResolvedValue({ affectedRows: 0 });

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid or expired token.",
        instance: "/verify-email"
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed JSON in Redis data", async () => {
      const token = "malformed-json-token";
      mockRedisClient.get.mockResolvedValue("invalid-json");

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Unexpected token 'i', \"invalid-json\" is not valid JSON",
        instance: "/verify-email"
      });
    });

    it("should handle Redis data with missing fields", async () => {
      const token = "incomplete-data-token";
      const incompleteData = { accountId: "123" }; // Missing email and expirationTime

      mockRedisClient.get.mockResolvedValue(JSON.stringify(incompleteData));

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Internal Server Error",
        status: 500,
        detail: "Internal server error",
        instance: "/verify-email"
      });
    });

    it("should handle very long token strings", async () => {
      const longToken = "a".repeat(1000);
      mockRedisClient.get.mockResolvedValue(null);
      mockRunQuery.mockResolvedValue([]);

      const response = await request(app)
        .post("/verify-email")
        .send({ token: longToken });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid or expired token.",
        instance: "/verify-email"
      });
    });
  });

  describe("Database Update Verification", () => {
    it("should update all required fields when verifying via Redis", async () => {
      const token = "redis-update-token";
      const mockRedisData = {
        accountId: "789",
        email: "update@example.com",
        expirationTime: new Date(Date.now() + 86400000).toISOString()
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockRedisData));
      mockRedisClient.del.mockResolvedValue(1);
      mockRunQuery.mockResolvedValue([]);

      await request(app).post("/verify-email").send({ token });

      // Verify the UPDATE query contains all required fields
      const updateCall = mockRunQuery.mock.calls.find((call) =>
        call[0].includes("UPDATE Accounts")
      );

      expect(updateCall).toBeDefined();
      expect(updateCall![0]).toContain("work_email_verified = true");
      expect(updateCall![0]).toContain("work_email_token = NULL");
      expect(updateCall![0]).toContain("work_email_token_expires_at = NULL");
      expect(updateCall![1]).toEqual(["789"]);
    });

    it("should update all required fields when verifying via database", async () => {
      const token = "db-update-token";

      mockRedisClient.get.mockResolvedValue(null);
      mockRunQuery.mockResolvedValueOnce({ affectedRows: 1 });

      await request(app).post("/verify-email").send({ token });

      // Find the UPDATE query
      const updateCall = mockRunQuery.mock.calls.find(
        (call) =>
          call[0].includes("UPDATE Accounts") &&
          call[0].includes("work_email_verified = true")
      );

      expect(updateCall).toBeDefined();
      expect(updateCall![0]).toContain("work_email_verified = true");
      expect(updateCall![0]).toContain("work_email_token = NULL");
      expect(updateCall![0]).toContain("work_email_token_expires_at = NULL");
      expect(updateCall![1]).toEqual([token]);
    });
  });

  describe("Interface Correction Verification", () => {
    it("should verify email successfully with corrected Redis interface", async () => {
      const token = "redis-interface-corrected-test";

      // This simulates the actual data stored by handleEmailVerification service
      const actualRedisData = {
        accountId: 456, // Number type, as stored
        email: "test@test.com", // Email field, not work_email
        expirationTime: new Date(Date.now() + 86400000).toISOString()
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(actualRedisData));
      mockRedisClient.del.mockResolvedValue(1);
      mockRunQuery.mockResolvedValue([]);

      const response = await request(app).post("/verify-email").send({ token });

      // Should succeed with corrected interface
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Email verified successfully" });

      // Verify database update was called with correct accountId
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE Accounts"),
        [456]
      );

      // Verify Redis cleanup
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        `verify:work-email:${token}`
      );
    });
  });
});
