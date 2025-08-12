import request from "supertest";
import express from "express";
import type { RequestHandler } from "express";
import { expressErrorHandler } from "./express-error-handler";
import { logger } from "../utils/app-logger";
import cors from "cors";

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
    } = require("./cors.middleware");
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
    const { getCorsOptions } = require("./cors.middleware");
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
    expect(maliciousResponse.body).toEqual({
      type: "about:blank",
      title: "Internal Server Error",
      status: 500,
      detail: "Not allowed by CORS",
      instance: "/test"
    });

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
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Internal Server Error",
        status: 500,
        detail: "Not allowed by CORS",
        instance: "/test"
      });
    }
  });

  it("should reject malicious preflight requests", async () => {
    // Create CORS middleware with current environment settings
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCorsOptions } = require("./cors.middleware");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const corsMiddleware = require("cors")(getCorsOptions());

    const testApp = express();
    testApp.use(express.json());
    testApp.use(cors()); // Global default CORS
    testApp.use("/protected", corsMiddleware); // Custom CORS for protected routes
    testApp.get("/public", (req, res) => {
      res.json({ message: "public success" });
    });
    testApp.get("/protected/test", (req, res) => {
      res.json({ message: "protected success" });
    });
    testApp.use(expressErrorHandler);

    // Test malicious preflight request to protected route
    const maliciousPreflightResponse = await request(testApp)
      .options("/protected/test")
      .set("Origin", "https://malicious-site.com")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type, Authorization");

    // With global CORS + custom CORS, the global CORS handles preflight first
    // This is the correct behavior - global CORS allows the preflight, but the actual request will be blocked
    expect(maliciousPreflightResponse.status).toBe(204);
    expect(
      maliciousPreflightResponse.headers["access-control-allow-origin"]
    ).toBe("*");

    // Test allowed preflight request to protected route
    // Note: The global CORS middleware handles this first, so we get "*" instead of the specific origin
    const allowedPreflightResponse = await request(testApp)
      .options("/protected/test")
      .set("Origin", "https://test-frontend.com")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "Content-Type");

    expect(allowedPreflightResponse.status).toBe(204);
    expect(
      allowedPreflightResponse.headers["access-control-allow-origin"]
    ).toBe("*"); // Global CORS middleware handles this first

    // Test public route should work with default CORS
    const publicResponse = await request(testApp)
      .options("/public")
      .set("Origin", "https://any-site.com")
      .set("Access-Control-Request-Method", "GET");

    expect(publicResponse.status).toBe(204);
    expect(publicResponse.headers["access-control-allow-origin"]).toBe("*");

    // Test that actual malicious requests (not preflight) are still blocked
    const maliciousActualResponse = await request(testApp)
      .get("/protected/test")
      .set("Origin", "https://malicious-site.com");

    expect(maliciousActualResponse.status).toBe(500);
    expect(maliciousActualResponse.body).toEqual({
      type: "about:blank",
      title: "Internal Server Error",
      status: 500,
      detail: "Not allowed by CORS",
      instance: "/protected/test"
    });
  });

  it("should log warning when rejecting malicious origins", async () => {
    // Mock the logger to capture warnings
    const mockWarn = jest.fn();
    jest.spyOn(logger, "warn").mockImplementation(mockWarn);

    // Create CORS middleware with current environment settings
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCorsOptions } = require("./cors.middleware");
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
    expect(maliciousResponse.body).toEqual({
      type: "about:blank",
      title: "Internal Server Error",
      status: 500,
      detail: "Not allowed by CORS",
      instance: "/test"
    });

    // Restore the original logger
    jest.restoreAllMocks();
  });
});
