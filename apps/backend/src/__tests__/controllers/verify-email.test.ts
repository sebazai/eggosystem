import request from "supertest";
import express from "express";
import { verifyEmailController } from "../../controllers/account.controllers";
import { redisClient } from "../../utils/redisClient";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock dependencies
jest.mock("../../utils/redisClient");
jest.mock("../../db/mysqlRunQuery");
jest.mock("../../utils/app-logger");

const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("POST /verify-email", () => {
  const app = express();
  app.use(express.json());
  app.post("/verify-email", verifyEmailController);

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
      mockRunQuery.mockResolvedValueOnce([{ id: 456 }]); // First call for SELECT
      mockRunQuery.mockResolvedValueOnce([]); // Second call for UPDATE

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Email verified successfully" });

      // Verify database interactions
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT id FROM Accounts WHERE work_email_token = ?"
        ),
        [token]
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE Accounts"),
        [456]
      );
    });
  });

  describe("Validation Errors", () => {
    it("should return 400 when no token is provided", async () => {
      const response = await request(app).post("/verify-email").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "No token provided" });

      // Should not call Redis or database
      expect(mockRedisClient.get).not.toHaveBeenCalled();
      expect(mockRunQuery).not.toHaveBeenCalled();
    });

    it("should return 400 when token is empty string", async () => {
      const response = await request(app)
        .post("/verify-email")
        .send({ token: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "No token provided" });
    });

    it("should return 400 when token is null", async () => {
      const response = await request(app)
        .post("/verify-email")
        .send({ token: null });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "No token provided" });
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
      expect(response.body).toEqual({ message: "Invalid or expired token." });

      // Should not update database or delete from Redis
      expect(mockRunQuery).not.toHaveBeenCalled();
      expect(mockRedisClient.del).not.toHaveBeenCalled();
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
      expect(response.body).toEqual({ message: "Invalid or expired token." });
    });

    it("should return 400 when token exists in database but account not found", async () => {
      const token = "orphaned-token";

      mockRedisClient.get.mockResolvedValue(null);
      mockRunQuery.mockResolvedValue([undefined]); // Account not found

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Invalid or expired token." });
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when database query fails", async () => {
      const token = "db-error-token";

      mockRedisClient.get.mockResolvedValue(null);
      mockRunQuery.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed JSON in Redis data", async () => {
      const token = "malformed-json-token";
      mockRedisClient.get.mockResolvedValue("invalid-json");

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Internal server error" });
    });

    it("should handle Redis data with missing fields", async () => {
      const token = "incomplete-data-token";
      const incompleteData = { accountId: "123" }; // Missing email and expirationTime

      mockRedisClient.get.mockResolvedValue(JSON.stringify(incompleteData));

      const response = await request(app).post("/verify-email").send({ token });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Internal server error" });
    });

    it("should handle very long token strings", async () => {
      const longToken = "a".repeat(1000);
      mockRedisClient.get.mockResolvedValue(null);
      mockRunQuery.mockResolvedValue([]);

      const response = await request(app)
        .post("/verify-email")
        .send({ token: longToken });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Invalid or expired token." });
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
      mockRunQuery.mockResolvedValueOnce([{ id: 999 }]);
      mockRunQuery.mockResolvedValueOnce([]);

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
      expect(updateCall![1]).toEqual([999]);
    });
  });
});
