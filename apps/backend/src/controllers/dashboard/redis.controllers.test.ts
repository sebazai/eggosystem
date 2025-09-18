import { type Request, type Response, type NextFunction } from "express";
import { redisClient } from "../../utils/redisClient";
import {
  getRedisKeys,
  getRedisKeyData,
  deleteRedisKey
} from "./redis.controllers";

// Mock Redis client
jest.mock("../../utils/redisClient", () => ({
  redisClient: {
    keys: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    type: jest.fn(),
    ttl: jest.fn()
  }
}));

const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;

describe("Redis Controllers", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("getRedisKeys", () => {
    it("should return all Redis keys when no pattern provided", async () => {
      const mockKeys = ["key1", "key2", "key3"];
      mockRedisClient.keys.mockResolvedValue(mockKeys);
      mockReq.query = {};

      await getRedisKeys(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRedisClient.keys).toHaveBeenCalledWith("*");
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockKeys
      });
    });

    it("should return filtered keys when pattern provided", async () => {
      const mockKeys = ["user:123", "user:456", "session:789"];
      mockRedisClient.keys.mockResolvedValue(mockKeys);
      mockReq.query = { pattern: "user:*" };

      await getRedisKeys(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRedisClient.keys).toHaveBeenCalledWith("user:*");
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockKeys
      });
    });

    it("should handle Redis errors", async () => {
      const error = new Error("Redis connection failed");
      mockRedisClient.keys.mockRejectedValue(error);
      mockReq.query = {};

      await expect(
        getRedisKeys(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow("Redis connection failed");
    });
  });

  describe("getRedisKeyData", () => {
    it("should return key data for string type", async () => {
      const mockData = "test value";
      mockRedisClient.get.mockResolvedValue(mockData);
      mockRedisClient.type.mockResolvedValue("string");
      mockRedisClient.ttl.mockResolvedValue(3600);
      mockReq.params = { key: "test-key" };

      await getRedisKeyData(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRedisClient.get).toHaveBeenCalledWith("test-key");
      expect(mockRedisClient.type).toHaveBeenCalledWith("test-key");
      expect(mockRedisClient.ttl).toHaveBeenCalledWith("test-key");
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          key: "test-key",
          type: "string",
          value: mockData,
          ttl: 3600
        }
      });
    });

    it("should handle non-existent key", async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.type.mockResolvedValue("none");
      mockRedisClient.ttl.mockResolvedValue(-1);
      mockReq.params = { key: "non-existent" };

      await getRedisKeyData(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          key: "non-existent",
          type: "none",
          value: null,
          ttl: -1
        }
      });
    });

    it("should handle Redis errors", async () => {
      const error = new Error("Redis connection failed");
      mockRedisClient.get.mockRejectedValue(error);
      mockReq.params = { key: "test-key" };

      await expect(
        getRedisKeyData(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow("Redis connection failed");
    });
  });

  describe("deleteRedisKey", () => {
    it("should delete key successfully", async () => {
      mockRedisClient.del.mockResolvedValue(1);
      mockReq.params = { key: "test-key" };

      await deleteRedisKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRedisClient.del).toHaveBeenCalledWith("test-key");
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Key deleted successfully"
      });
    });

    it("should handle non-existent key deletion", async () => {
      mockRedisClient.del.mockResolvedValue(0);
      mockReq.params = { key: "non-existent" };

      await deleteRedisKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRedisClient.del).toHaveBeenCalledWith("non-existent");
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Key not found or already deleted"
      });
    });

    it("should handle Redis errors", async () => {
      const error = new Error("Redis connection failed");
      mockRedisClient.del.mockRejectedValue(error);
      mockReq.params = { key: "test-key" };

      await expect(
        deleteRedisKey(mockReq as Request, mockRes as Response, mockNext)
      ).rejects.toThrow("Redis connection failed");
    });
  });
});
