import request from "supertest";
import express from "express";
import type { RequestHandler } from "express";
import { expressErrorHandler } from "../express-error-handler";
import { logger } from "../../utils/app-logger";

describe("CORS Middleware", () => {
  let app: express.Application;
  let originalFrontendUrl: string | undefined;
  let corsMiddleware: RequestHandler;

  beforeEach(() => {
    // Save original FRONTEND_URL and set a test value
    originalFrontendUrl = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = "https://test-frontend.com";

    // Import the middleware after setting the environment variable

    const {
      corsMiddleware: importedCorsMiddleware
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("../cors.middleware");
    corsMiddleware = importedCorsMiddleware;

    app = express();
    app.use(express.json());
    app.use(corsMiddleware);
    app.get("/test", (req, res) => {
      res.json({ message: "success" });
    });
    app.use(expressErrorHandler);
  });

  afterEach(() => {
    // Restore original FRONTEND_URL
    if (originalFrontendUrl) {
      process.env.FRONTEND_URL = originalFrontendUrl;
    } else {
      delete process.env.FRONTEND_URL;
    }
  });

  it("should allow requests from allowed origin", async () => {
    const response = await request(app)
      .get("/test")
      .set("Origin", "https://test-frontend.com");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://test-frontend.com"
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("should allow requests with no origin", async () => {
    const response = await request(app).get("/test");

    expect(response.status).toBe(200);
    // In non-production, CORS headers may not be set for requests without origin
    expect(response.body).toEqual({ message: "success" });
  });

  it("should handle preflight requests correctly", async () => {
    const response = await request(app)
      .options("/test")
      .set("Origin", "https://test-frontend.com")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "Content-Type");

    expect(response.status).toBe(204); // OPTIONS requests typically return 204
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://test-frontend.com"
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("should reject malicious CORS origins", async () => {
    // Create CORS middleware with current environment settings
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCorsOptions } = require("../cors.middleware");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const corsMiddleware = require("cors")(getCorsOptions());

    const testApp = express();
    testApp.use(express.json());
    testApp.use(corsMiddleware);
    testApp.get("/test", (req, res) => {
      res.json({ message: "success" });
    });
    testApp.use(expressErrorHandler);

    // Test with malicious origin
    const maliciousResponse = await request(testApp)
      .get("/test")
      .set("Origin", "https://malicious-site.com");

    // CORS rejection returns 500 when the origin is not allowed (handled by error handler)
    expect(maliciousResponse.status).toBe(500);
    expect(maliciousResponse.body).toHaveProperty("error");
    expect(maliciousResponse.body.error).toContain("Not allowed by CORS");

    // Test with allowed origin (should work)
    const allowedResponse = await request(testApp)
      .get("/test")
      .set("Origin", "https://test-frontend.com");

    expect(allowedResponse.status).toBe(200);
    expect(allowedResponse.headers["access-control-allow-origin"]).toBe(
      "https://test-frontend.com"
    );

    // Test with different malicious origins
    const maliciousOrigins = [
      "https://evil-site.com",
      "http://localhost:3000", // Different port
      "https://test-frontend.com.evil.com", // Subdomain attack
      "https://test-frontend.com.evil.com:8080", // Port + subdomain attack
      "https://test-frontend.com.evil.com", // Subdomain attack
      "https://evil.com?redirect=https://test-frontend.com", // Query parameter attack
      "https://evil.com#https://test-frontend.com" // Fragment attack
    ];

    for (const maliciousOrigin of maliciousOrigins) {
      const response = await request(testApp)
        .get("/test")
        .set("Origin", maliciousOrigin);

      // CORS rejection returns 500 when the origin is not allowed (handled by error handler)
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Not allowed by CORS");
    }
  });

  it("should reject malicious preflight requests", async () => {
    // Create CORS middleware with current environment settings
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCorsOptions } = require("../cors.middleware");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const corsMiddleware = require("cors")(getCorsOptions());

    const testApp = express();
    testApp.use(express.json());
    testApp.use(corsMiddleware);
    testApp.get("/test", (req, res) => {
      res.json({ message: "success" });
    });
    testApp.use(expressErrorHandler);

    // Test malicious preflight request
    const maliciousPreflightResponse = await request(testApp)
      .options("/test")
      .set("Origin", "https://malicious-site.com")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type, Authorization");

    // CORS rejection for preflight returns 500 when the origin is not allowed (handled by error handler)
    expect(maliciousPreflightResponse.status).toBe(500);
    expect(maliciousPreflightResponse.body).toHaveProperty("error");
    expect(maliciousPreflightResponse.body.error).toContain(
      "Not allowed by CORS"
    );

    // Test allowed preflight request
    const allowedPreflightResponse = await request(testApp)
      .options("/test")
      .set("Origin", "https://test-frontend.com")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "Content-Type");

    expect(allowedPreflightResponse.status).toBe(204);
    expect(
      allowedPreflightResponse.headers["access-control-allow-origin"]
    ).toBe("https://test-frontend.com");
  });

  it("should log warning when rejecting malicious origins", async () => {
    // Mock the logger to capture warnings
    const mockWarn = jest.fn();
    jest.spyOn(logger, "warn").mockImplementation(mockWarn);

    // Create CORS middleware with current environment settings
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCorsOptions } = require("../cors.middleware");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const corsMiddleware = require("cors")(getCorsOptions());

    const testApp = express();
    testApp.use(express.json());
    testApp.use(corsMiddleware);
    testApp.get("/test", (req, res) => {
      res.json({ message: "success" });
    });
    testApp.use(expressErrorHandler);

    // Test with malicious origin
    const maliciousResponse = await request(testApp)
      .get("/test")
      .set("Origin", "https://malicious-site.com");

    // Verify the warning was logged
    expect(mockWarn).toHaveBeenCalledWith("CORS rejection", {
      rejectedOrigin: "https://malicious-site.com",
      allowedOrigins: ["https://test-frontend.com"],
      userAgent: "CORS Middleware"
    });

    // Verify the request was rejected
    expect(maliciousResponse.status).toBe(500);
    expect(maliciousResponse.body).toHaveProperty("error");
    expect(maliciousResponse.body.error).toContain("Not allowed by CORS");

    // Restore the original logger
    jest.restoreAllMocks();
  });
});
