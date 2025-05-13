import { endDbConnection } from "./src/db/mysqlConnection";
import { closeRedis } from "./src/utils/redisClient";

jest.mock("fs", () => {
  const actualFs = jest.requireActual("fs"); // keep everything else

  return {
    ...actualFs,
    readFileSync: jest.fn((filePath: string) => {
      if (filePath.includes("public_access_token.pem")) {
        return "mock-public-key";
      } else if (filePath.includes("private_access_token.pem")) {
        return "mock-private-key";
      } else if (filePath.includes("public_refresh_token.pem")) {
        return "mock-refresh-public-key";
      } else if (filePath.includes("private_refresh_token.pem")) {
        return "mock-refresh-private-key";
      }
      // fallback to actual read if needed
      return actualFs.readFileSync(filePath, "utf8");
    })
  };
});

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

afterAll(async () => {
  await endDbConnection();
  await closeRedis();
});
