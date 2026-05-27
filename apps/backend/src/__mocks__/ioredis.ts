/* eslint-disable @typescript-eslint/no-explicit-any */
const IORedis = jest.createMockFromModule("ioredis");

// In-memory storage for the mock
const mockRedisStorage = new Map<string, string>();

(IORedis as any).prototype.get.mockImplementation((key: any) => {
  if (key === "123123") {
    return "mockRefreshToken";
  }
  if (key === "123124") {
    return "differentRefreshToken";
  }

  // Handle team placements and other keys
  return mockRedisStorage.get(key) || null;
});

(IORedis as any).prototype.set = jest
  .fn()
  .mockImplementation((key: any, value: any) => {
    mockRedisStorage.set(key, value);
    return Promise.resolve("OK");
  });

(IORedis as any).prototype.del = jest.fn().mockImplementation((key: any) => {
  const existed = mockRedisStorage.has(key);
  mockRedisStorage.delete(key);
  return Promise.resolve(existed ? 1 : 0);
});

(IORedis as any).prototype.mget = jest
  .fn()
  .mockImplementation((...keys: any[]) => {
    const flatKeys: string[] = Array.isArray(keys[0]) ? keys[0] : keys;
    return Promise.resolve(
      flatKeys.map((k) => mockRedisStorage.get(k) ?? null)
    );
  });

const mockPipeline = {
  set: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([])
};

(IORedis as any).prototype.pipeline = jest.fn(() => mockPipeline);

// Helper function to clear mock storage between tests
(IORedis as any).clearMockStorage = () => {
  mockRedisStorage.clear();
};

module.exports = IORedis as any;
