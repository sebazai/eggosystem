import request from "supertest";
import { app } from "../app";
import { redisClient } from "../utils/redisClient";
import { runQuery } from "../db/mysqlRunQuery";
import { expressErrorHandler } from "../middlewares/express-error-handler";

// Add error handler to app for RFC 7807 responses
app.use(expressErrorHandler);

describe("Email Verification Token Mismatch", () => {
  afterAll(async () => {
    await redisClient.quit();
  });

  beforeEach(async () => {
    // Clear Redis before each test
    await redisClient.flushall();
  });

  it("should reject old token when email has been changed", async () => {
    const accountId = 1;
    const oldEmail = "old@example.com";
    const newEmail = "new@example.com";
    const oldToken = "old-token-123";

    // Setup: Account has been updated with new email
    await runQuery(
      "INSERT INTO Accounts (id, work_email, work_email_verified) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE work_email = ?, work_email_verified = ?",
      [accountId, newEmail, false, newEmail, false]
    );

    // Old token still exists in Redis with old email
    await redisClient.set(
      `verify:work-email:${oldToken}`,
      JSON.stringify({
        accountId,
        email: oldEmail, // Old email that doesn't match current
        expirationTime: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
      }),
      "EX",
      7 * 24 * 60 * 60 // 7 days
    );

    // Attempt to verify with old token
    const response = await request(app)
      .post("/api/v1/verify-email")
      .send({ token: oldToken })
      .expect(400)
      .expect("Content-Type", /application\/problem\+json/);

    expect(response.body).toMatchObject({
      type: "about:blank",
      title: "Bad Request",
      status: 400,
      detail: "Invalid or expired token."
    });

    // Verify account is still unverified
    const [account] = await runQuery<Array<{ work_email_verified: boolean }>>(
      "SELECT work_email_verified FROM Accounts WHERE id = ?",
      [accountId]
    );
    expect(account.work_email_verified).toBe(false);

    // Verify Redis token was consumed (deleted)
    const tokenData = await redisClient.get(`verify:work-email:${oldToken}`);
    expect(tokenData).toBeNull();
  });

  it("should verify successfully when token email matches current email", async () => {
    const accountId = 1;
    const email = "current@example.com";
    const token = "valid-token-123";

    await runQuery(
      "INSERT INTO Accounts (id, work_email, work_email_verified) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE work_email = ?, work_email_verified = ?",
      [accountId, email, false, email, false]
    );

    // Token in Redis with matching email
    await redisClient.set(
      `verify:work-email:${token}`,
      JSON.stringify({
        accountId,
        email, // Matches current email
        expirationTime: Date.now() + 24 * 60 * 60 * 1000
      }),
      "EX",
      7 * 24 * 60 * 60
    );

    // Attempt to verify with valid token
    const response = await request(app)
      .post("/api/v1/verify-email")
      .send({ token })
      .expect(200);

    expect(response.body).toEqual({
      message: "Email verified successfully"
    });

    // Verify account is now verified
    const [account] = await runQuery<Array<{ work_email_verified: boolean }>>(
      "SELECT work_email_verified FROM Accounts WHERE id = ?",
      [accountId]
    );
    expect(account.work_email_verified).toBe(true);
  });
});
