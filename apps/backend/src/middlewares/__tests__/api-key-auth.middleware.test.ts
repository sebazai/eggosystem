import { type Request, type Response } from "express";
import { validateApiKey } from "../api-key-auth.middleware";

describe("API Key Authentication Middleware", () => {
  // Mock objects
  const mockRequest = () => {
    const req = {} as Request;
    req.headers = {};
    return req;
  };

  const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn();

  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variables
    process.env = { ...originalEnv };
    process.env.API_KEYS = "valid-api-key-1,valid-api-key-2";
  });

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it("should pass request when valid API key is provided", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    req.headers["x-api-key"] = "valid-api-key-1";

    // Act
    validateApiKey(req, res, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 401 when no API key is provided", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();

    // Act
    validateApiKey(req, res, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "API key required" }
    });
  });

  it("should return 401 when invalid API key is provided", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    req.headers["x-api-key"] = "invalid-api-key";

    // Act
    validateApiKey(req, res, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Invalid API key" }
    });
  });

  it("should handle undefined API_KEYS environment variable", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    req.headers["x-api-key"] = "any-key";
    delete process.env.API_KEYS;

    // Act
    validateApiKey(req, res, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Invalid API key" }
    });
  });
});
