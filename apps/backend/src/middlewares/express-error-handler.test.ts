import { type Request, type Response, type NextFunction } from "express";
import { expressErrorHandler } from "./express-error-handler";
import { BaseError } from "../utils/errors";
import { type ZodError } from "zod";
import { z } from "zod";

describe("Express Error Handler", () => {
  // Mock objects
  const mockRequest = () => ({}) as Request;

  const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle UnauthorizedError correctly", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    // Create a mock UnauthorizedError object that matches the interface
    const error = {
      name: "UnauthorizedError",
      status: 401,
      message: "Unauthorized access",
      code: "invalid_token"
    };

    // Act
    expressErrorHandler(error, req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized access" });
  });

  it("should handle express-jwt UnauthorizedError correctly", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    // Simulate express-jwt error
    const error = {
      name: "UnauthorizedError",
      status: 401,
      message: "Invalid token",
      code: "invalid_token"
    };

    // Act
    expressErrorHandler(error, req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
  });

  it("should handle ZodError correctly", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();

    // Create a real ZodError
    const schema = z.object({ name: z.string() });
    let error: ZodError;
    try {
      schema.parse({ name: 123 });
    } catch (err) {
      error = err as ZodError;

      // Act
      expressErrorHandler(error, req, res, mockNext);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonArg.error).toContain("expected string, received number");
    }
  });

  it("should handle BaseError correctly", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    const error = new BaseError("Base error", 422);

    // Act
    expressErrorHandler(error, req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ error: "Base error" });
  });

  it("should handle generic Error correctly", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    const error = new Error("Generic error");

    // Act
    expressErrorHandler(error, req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Generic error" });
  });

  it("should handle unknown error correctly", () => {
    // Arrange
    const req = mockRequest();
    const res = mockResponse();
    const error = "Just a string";

    // Act
    expressErrorHandler(error, req, res, mockNext);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Something went wrong" });
  });
});
