// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import express from "express";
import request from "supertest";
import cors from "cors";
import { getCorsOptions } from "./cors.middleware";
import { logger } from "../utils/app-logger";

jest.mock("../utils/app-logger", () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe("CORS Middleware Integration Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getCorsOptions", () => {
    it("should allow requests from FRONTEND_URL origin", () => {
      process.env.FRONTEND_URL = "https://example.com";
      const corsOptions = getCorsOptions();

      const callback = jest.fn();
      corsOptions.origin?.("https://example.com", callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it("should reject requests from non-allowed origins", () => {
      process.env.FRONTEND_URL = "https://example.com";
      const corsOptions = getCorsOptions();

      const callback = jest.fn();
      corsOptions.origin?.("https://malicious.com", callback);

      // The callback is called with an Error object as first arg, false as second
      expect(callback).toHaveBeenCalled();
      const callArgs = callback.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Error);
      if (callArgs[0] instanceof Error) {
        expect(callArgs[0].message).toBe("Not allowed by CORS");
      }
      expect(callArgs[1]).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        "CORS rejection",
        expect.objectContaining({
          rejectedOrigin: "https://malicious.com",
          allowedOrigins: ["https://example.com"]
        })
      );
    });

    it("should allow requests with no origin (same-origin requests)", () => {
      process.env.FRONTEND_URL = "https://example.com";
      const corsOptions = getCorsOptions();

      const callback = jest.fn();
      corsOptions.origin?.(undefined, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it("should handle FRONTEND_URL with path", () => {
      process.env.FRONTEND_URL = "https://example.com/app";
      const corsOptions = getCorsOptions();

      const callback = jest.fn();
      corsOptions.origin?.("https://example.com", callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it("should handle FRONTEND_URL with port", () => {
      process.env.FRONTEND_URL = "http://localhost:3000";
      const corsOptions = getCorsOptions();

      const callback = jest.fn();
      corsOptions.origin?.("http://localhost:3000", callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it("should enable credentials", () => {
      process.env.FRONTEND_URL = "https://example.com";
      const corsOptions = getCorsOptions();

      expect(corsOptions.credentials).toBe(true);
    });
  });

  describe("corsMiddleware integration", () => {
    it("should allow requests from allowed origin", async () => {
      process.env.FRONTEND_URL = "https://example.com";
      const app = express();
      // Use getCorsOptions() to get fresh CORS options with updated env var
      app.use(cors(getCorsOptions()));
      app.get("/test", (req, res) => {
        res.json({ success: true });
      });

      const res = await request(app)
        .get("/test")
        .set("Origin", "https://example.com");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });

    it("should reject requests from disallowed origin", async () => {
      process.env.FRONTEND_URL = "https://example.com";
      const app = express();
      // Use getCorsOptions() to get fresh CORS options with updated env var
      app.use(cors(getCorsOptions()));
      app.get("/test", (req, res) => {
        res.json({ success: true });
      });

      await request(app).get("/test").set("Origin", "https://malicious.com");

      // CORS middleware should reject the request
      // The exact behavior depends on CORS library implementation
      expect(logger.warn).toHaveBeenCalledWith(
        "CORS rejection",
        expect.objectContaining({
          rejectedOrigin: "https://malicious.com"
        })
      );
    });

    it("should include credentials in CORS headers", async () => {
      process.env.FRONTEND_URL = "https://example.com";
      const app = express();
      // Use getCorsOptions() to get fresh CORS options with updated env var
      app.use(cors(getCorsOptions()));
      app.get("/test", (req, res) => {
        res.json({ success: true });
      });

      const res = await request(app)
        .get("/test")
        .set("Origin", "https://example.com");

      // Credentials should be enabled in CORS response
      expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("should handle multiple origin scenarios", async () => {
      process.env.FRONTEND_URL = "https://example.com";
      const app = express();
      // Use getCorsOptions() to get fresh CORS options with updated env var
      app.use(cors(getCorsOptions()));
      app.get("/test", (req, res) => {
        res.json({ success: true });
      });

      // Test allowed origin
      const allowedRes = await request(app)
        .get("/test")
        .set("Origin", "https://example.com");
      expect(allowedRes.status).toBe(200);

      await request(app).get("/test").set("Origin", "https://other.com");
      expect(logger.warn).toHaveBeenCalledWith(
        "CORS rejection",
        expect.objectContaining({
          rejectedOrigin: "https://other.com"
        })
      );
    });

    it("should handle missing FRONTEND_URL environment variable", () => {
      const originalFrontendUrl = process.env.FRONTEND_URL;
      delete process.env.FRONTEND_URL;

      try {
        // getCorsOptions() checks for FRONTEND_URL and throws if not defined
        // This tests the same validation logic as the module load-time check
        expect(() => {
          getCorsOptions();
        }).toThrow("FRONTEND_URL is not defined");
      } finally {
        // Restore original value
        if (originalFrontendUrl) {
          process.env.FRONTEND_URL = originalFrontendUrl;
        }
      }
    });

    it("should handle invalid FRONTEND_URL format", () => {
      const originalFrontendUrl = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = "not-a-valid-url";

      try {
        // getCorsOptions() will throw when trying to create a URL from invalid format
        expect(() => {
          getCorsOptions();
        }).toThrow();
      } finally {
        // Restore original value
        if (originalFrontendUrl) {
          process.env.FRONTEND_URL = originalFrontendUrl;
        } else {
          delete process.env.FRONTEND_URL;
        }
      }
    });

    it("should log rejected origins with correct metadata", () => {
      process.env.FRONTEND_URL = "https://example.com";
      const corsOptions = getCorsOptions();

      const callback = jest.fn();
      corsOptions.origin?.("https://malicious.com", callback);

      expect(logger.warn).toHaveBeenCalledWith(
        "CORS rejection",
        expect.objectContaining({
          rejectedOrigin: "https://malicious.com",
          allowedOrigins: ["https://example.com"],
          userAgent: "CORS Middleware"
        })
      );
    });

    it("should handle preflight OPTIONS requests", async () => {
      process.env.FRONTEND_URL = "https://example.com";
      const app = express();
      // Use getCorsOptions() to get fresh CORS options with updated env var
      app.use(cors(getCorsOptions()));
      app.get("/test", (req, res) => {
        res.json({ success: true });
      });

      const res = await request(app)
        .options("/test")
        .set("Origin", "https://example.com")
        .set("Access-Control-Request-Method", "GET");

      // Preflight requests should be handled by CORS middleware
      expect(res.status).toBeLessThan(500); // Should not error
    });

    it("should handle different protocols (http vs https)", () => {
      process.env.FRONTEND_URL = "https://example.com";
      const corsOptions = getCorsOptions();

      const callback = jest.fn();
      // HTTP origin should be rejected when FRONTEND_URL is HTTPS
      corsOptions.origin?.("http://example.com", callback);

      // The callback is called with an Error object as first arg, false as second
      expect(callback).toHaveBeenCalled();
      const callArgs = callback.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Error);
      if (callArgs[0] instanceof Error) {
        expect(callArgs[0].message).toBe("Not allowed by CORS");
      }
      expect(callArgs[1]).toBe(false);
    });

    it("should handle subdomain origins correctly", () => {
      process.env.FRONTEND_URL = "https://app.example.com";
      const corsOptions = getCorsOptions();

      const callback = jest.fn();
      // Different subdomain should be rejected
      corsOptions.origin?.("https://api.example.com", callback);

      // The callback is called with an Error object as first arg, false as second
      expect(callback).toHaveBeenCalled();
      const callArgs = callback.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Error);
      if (callArgs[0] instanceof Error) {
        expect(callArgs[0].message).toBe("Not allowed by CORS");
      }
      expect(callArgs[1]).toBe(false);
    });
  });
});
