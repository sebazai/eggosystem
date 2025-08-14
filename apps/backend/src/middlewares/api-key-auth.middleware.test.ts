import { type Request, type Response } from "express";
import { createApiKeyValidator } from "./api-key-auth.middleware";

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
    process.env.BACKEND_SERVICE_API_KEY = "valid-api-key";
  });

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it("should pass request when valid API key is provided", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    req.headers["x-api-key"] = "valid-api-key";

    // Act
    createApiKeyValidator(process.env.BACKEND_SERVICE_API_KEY)(
      req,
      res,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 401 when no API key is provided in request", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();

    // Act
    createApiKeyValidator(process.env.BACKEND_SERVICE_API_KEY)(
      req,
      res,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "API key required",
        status: 401
      })
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 401 when invalid API key is provided", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    req.headers["x-api-key"] = "invalid-api-key";

    // Act
    createApiKeyValidator(process.env.BACKEND_SERVICE_API_KEY)(
      req,
      res,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid API key",
        status: 401
      })
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
