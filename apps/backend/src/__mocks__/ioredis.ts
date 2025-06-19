/* eslint-disable @typescript-eslint/no-explicit-any */
const IORedis = jest.createMockFromModule("ioredis");
(IORedis as any).prototype.get.mockImplementation((key: any) => {
  if (key === "123123") {
    return "mockRefreshToken";
  }
  if (key === "123124") {
    return "differentRefreshToken";
  }
  return undefined;
});
(IORedis as any).prototype.set = jest.fn().mockResolvedValue("OK");
(IORedis as any).prototype.del = jest.fn();
module.exports = IORedis as any;
