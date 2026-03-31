import { type Request, type Response, type NextFunction } from "express";
import { redisClient } from "../../utils/redisClient";
import { scanKeysMatchingPattern } from "../../utils/redisScanKeys";
import {
  getRedisKeys,
  getRedisKeyData,
  deleteRedisKey,
  flushStandingsCaches
} from "./redis.controllers";

jest.mock("../../utils/redisScanKeys", () => ({
  scanKeysMatchingPattern: jest.fn()
}));

// Mock Redis client
jest.mock("../../utils/redisClient", () => ({
  redisClient: {
    get: jest.fn(),
    del: jest.fn(),
    type: jest.fn(),
    ttl: jest.fn()
  }
}));

const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;
const mockScanKeysMatchingPattern = jest.mocked(scanKeysMatchingPattern);

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
    mockScanKeysMatchingPattern.mockReset();
  });

  describe("getRedisKeys", () => {
    it("should return paginated Redis keys with valid pattern", async () => {
      const mockKeys = Array.from({ length: 100 }, (_, i) => `user:${i}`);
      mockScanKeysMatchingPattern.mockResolvedValue(mockKeys);
      mockReq.query = { pattern: "user:*", page: "2", limit: "25" };

      await getRedisKeys(mockReq as Request, mockRes as Response, mockNext);

      expect(mockScanKeysMatchingPattern).toHaveBeenCalledWith(
        redisClient,
        "user:*"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockKeys.slice(25, 50), // Page 2 with limit 25
        pagination: {
          page: 2,
          limit: 25,
          total: 100,
          totalPages: 4
        }
      });
    });

    it("should return first page with default pagination", async () => {
      const mockKeys = ["user:1", "user:2", "user:3"];
      mockScanKeysMatchingPattern.mockResolvedValue(mockKeys);
      mockReq.query = { pattern: "user:*" };

      await getRedisKeys(mockReq as Request, mockRes as Response, mockNext);

      expect(mockScanKeysMatchingPattern).toHaveBeenCalledWith(
        redisClient,
        "user:*"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockKeys,
        pagination: {
          page: 1,
          limit: 50,
          total: 3,
          totalPages: 1
        }
      });
    });

    it("should reject empty pattern", async () => {
      mockReq.query = { pattern: "" };

      await getRedisKeys(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Search pattern is required and cannot be empty or '*'",
          status: 400
        })
      );
    });

    it("should reject wildcard pattern", async () => {
      mockReq.query = { pattern: "*" };

      await getRedisKeys(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Search pattern is required and cannot be empty or '*'",
          status: 400
        })
      );
    });

    it("should handle invalid page number by using default", async () => {
      const mockKeys = ["user:1", "user:2", "user:3"];
      mockScanKeysMatchingPattern.mockResolvedValue(mockKeys);
      mockReq.query = { pattern: "user:*", page: "0" };

      await getRedisKeys(mockReq as Request, mockRes as Response, mockNext);

      expect(mockScanKeysMatchingPattern).toHaveBeenCalledWith(
        redisClient,
        "user:*"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockKeys,
        pagination: {
          page: 1, // Should default to 1 when page is 0
          limit: 50,
          total: 3,
          totalPages: 1
        }
      });
    });

    it("should handle invalid limit by using default", async () => {
      const mockKeys = ["user:1", "user:2", "user:3"];
      mockScanKeysMatchingPattern.mockResolvedValue(mockKeys);
      mockReq.query = { pattern: "user:*", limit: "0" };

      await getRedisKeys(mockReq as Request, mockRes as Response, mockNext);

      expect(mockScanKeysMatchingPattern).toHaveBeenCalledWith(
        redisClient,
        "user:*"
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockKeys,
        pagination: {
          page: 1,
          limit: 50, // Should default to 50 when limit is 0
          total: 3,
          totalPages: 1
        }
      });
    });

    it("should reject limit over 1000", async () => {
      mockReq.query = { pattern: "user:*", limit: "1001" };

      await getRedisKeys(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Limit must be between 1 and 1000",
          status: 400
        })
      );
    });

    it("should handle Redis errors by throwing", async () => {
      const error = new Error("Redis connection failed");
      mockScanKeysMatchingPattern.mockRejectedValue(error);
      mockReq.query = { pattern: "user:*" };

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

  describe("flushStandingsCaches", () => {
    it("should delete all faceit-match-stats-* keys and return count", async () => {
      const mockKeys = [
        "faceit-match-stats-abc-123",
        "faceit-match-stats-def-456"
      ];
      mockScanKeysMatchingPattern.mockResolvedValue(mockKeys);
      mockRedisClient.del.mockResolvedValue(2);

      await flushStandingsCaches(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockScanKeysMatchingPattern).toHaveBeenCalledWith(
        redisClient,
        "faceit-match-stats-*"
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith(...mockKeys);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        deletedCount: 2,
        message: "Flushed 2 Faceit standings cache key(s)."
      });
    });

    it("should return zero when no keys found", async () => {
      mockScanKeysMatchingPattern.mockResolvedValue([]);

      await flushStandingsCaches(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        deletedCount: 0,
        message: "No Faceit standings cache keys found."
      });
    });
  });
});
