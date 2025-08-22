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
        ["123", "test@example.com"]
      );
    });

    it("should verify email successfully using database token fallback", async () => {
      const token = "valid-db-token";

      // Redis returns null (no data found)
      mockRedisClient.get.mockResolvedValue(null);

      // SELECT by token then UPDATE by id
      mockRunQuery
        .mockResolvedValueOnce([{ id: 101, work_email_verified: false }])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Email verified successfully" });

      // Assert SELECT was called with token
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT id, work_email_verified FROM Accounts"),
        [token]
      );
      // Find UPDATE call and assert essentials without brittle whitespace
      const updateCall = mockRunQuery.mock.calls.find(
        (call) =>
          typeof call[0] === "string" && call[0].includes("UPDATE Accounts")
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![0]).toContain("work_email_verified = true");
      expect(updateCall![0]).toContain("work_email_token_expires_at = NULL");
      expect(updateCall![0]).toContain("WHERE id = ?");
      expect(updateCall![1]).toEqual([101]);
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

      mockRedisClient.get.mockResolvedValue(null);
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

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE work_email_token = ?"),
        [token]
      );
    });

    it("should verify successfully when database token is not expired", async () => {
      const token = "valid-db-token";

      mockRedisClient.get.mockResolvedValue(null);
      mockRunQuery
        .mockResolvedValueOnce([{ id: 202, work_email_verified: false }])
        .mockResolvedValueOnce({ affectedRows: 1 });

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
        ["123", "test@example.com"]
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
      mockRunQuery
        .mockResolvedValueOnce([{ id: 303, work_email_verified: false }])
        .mockResolvedValueOnce({ affectedRows: 0 });

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

      // Verify the UPDATE query sets verified flag
      const updateCall = mockRunQuery.mock.calls.find((call) =>
        call[0].includes("UPDATE Accounts")
      );

      expect(updateCall).toBeDefined();
      expect(updateCall![0]).toContain("work_email_verified = true");
      expect(updateCall![1]).toEqual(["789", "update@example.com"]);
    });

    it("should update all required fields when verifying via database", async () => {
      const token = "db-update-token";

      mockRedisClient.get.mockResolvedValue(null);
      mockRunQuery
        .mockResolvedValueOnce([{ id: 404, work_email_verified: false }])
        .mockResolvedValueOnce({ affectedRows: 1 });

      await request(app).post("/verify-email").send({ token });

      // Find the UPDATE query
      const updateCall = mockRunQuery.mock.calls.find((call) =>
        call[0].includes("UPDATE Accounts")
      );

      expect(updateCall).toBeDefined();
      expect(updateCall![0]).toContain("work_email_verified = true");
      expect(updateCall![1]).toEqual([404]);
    });
  });

  describe("Idempotency", () => {
    it("should return 200 when database token is valid but account already verified", async () => {
      const token = "already-verified-token";

      mockRedisClient.get.mockResolvedValue(null);
      // First DB call: SELECT by token with expiration check returns an already verified account
      mockRunQuery.mockResolvedValueOnce([
        { id: 42, work_email_verified: true }
      ]);

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Email verified successfully" });

      // Should not attempt UPDATE when already verified
      const updateCall = mockRunQuery.mock.calls.find(
        (call) =>
          typeof call[0] === "string" && call[0].includes("UPDATE Accounts")
      );
      expect(updateCall).toBeUndefined();

      // Should have performed a SELECT with expiration check
      const selectCall = mockRunQuery.mock.calls.find(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("WHERE work_email_token = ?")
      );
      expect(selectCall).toBeDefined();
      expect(selectCall![1]).toEqual([token]);
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
        [456, "test@test.com"]
      );

      // Verify Redis cleanup
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        `verify:work-email:${token}`
      );
    });
  });
});
