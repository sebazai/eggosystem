import type { Request, Response, NextFunction } from "express";
import { createApiKeyValidator } from "./api-key-auth.middleware";
import { logger } from "../utils/app-logger";

jest.mock("../utils/app-logger", () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn()
  }
}));

describe("createApiKeyValidator", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should call next() when valid API key is provided", () => {
    const expectedApiKey = "valid-api-key-123";
    const middleware = createApiKeyValidator(expectedApiKey);

    req.headers = {
      "x-api-key": expectedApiKey
    };

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it("should return 401 when API key is missing", () => {
    const expectedApiKey = "valid-api-key-123";
    const middleware = createApiKeyValidator(expectedApiKey);

    req.headers = {};

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "API key required",
        status: 401
      })
    );
    expect(logger.warn).toHaveBeenCalledWith("API key missing from request");
  });

  it("should return 401 when API key does not match", () => {
    const expectedApiKey = "valid-api-key-123";
    const middleware = createApiKeyValidator(expectedApiKey);

    req.headers = {
      "x-api-key": "invalid-api-key"
    };

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid API key",
        status: 401
      })
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Invalid API key provided")
    );
  });

  it("should return 401 when API key is provided as array", () => {
    const expectedApiKey = "valid-api-key-123";
    const middleware = createApiKeyValidator(expectedApiKey);

    req.headers = {
      "x-api-key": ["key1", "key2"]
    };

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "API key must be a string",
        status: 401
      })
    );
  });

  it("should handle undefined expectedApiKey", () => {
    const middleware = createApiKeyValidator(undefined);

    req.headers = {
      "x-api-key": "any-key"
    };

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid API key",
        status: 401
      })
    );
  });

  it("should handle empty string expectedApiKey", () => {
    const middleware = createApiKeyValidator("");

    req.headers = {
      "x-api-key": "any-key"
    };

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid API key",
        status: 401
      })
    );
  });

  it("should log successful API key validation", () => {
    const expectedApiKey = "valid-api-key-123";
    const middleware = createApiKeyValidator(expectedApiKey);

    req.headers = {
      "x-api-key": expectedApiKey
    };

    middleware(req as Request, res as Response, next);

    expect(logger.info).toHaveBeenCalledWith("API key validated successfully");
  });

  it("should log partial API key in error message for security", () => {
    const expectedApiKey = "valid-api-key-123";
    const middleware = createApiKeyValidator(expectedApiKey);

    const providedKey = "invalid-long-api-key-that-should-be-truncated";
    req.headers = {
      "x-api-key": providedKey
    };

    middleware(req as Request, res as Response, next);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringMatching(/Invalid API key provided: invalid\.\.\./)
    );
    // Verify it only shows first 5 characters followed by ...
    expect(logger.warn).toHaveBeenCalledWith(
      `Invalid API key provided: ${providedKey.slice(0, 5)}...`
    );
  });

  it("should handle case-sensitive API key matching", () => {
    const expectedApiKey = "Valid-Api-Key-123";
    const middleware = createApiKeyValidator(expectedApiKey);

    req.headers = {
      "x-api-key": "valid-api-key-123" // Different case
    };

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid API key",
        status: 401
      })
    );
  });

  it("should allow exact match including special characters", () => {
    const expectedApiKey = "key-with-special-chars-!@#$%";
    const middleware = createApiKeyValidator(expectedApiKey);

    req.headers = {
      "x-api-key": expectedApiKey
    };

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });
});
