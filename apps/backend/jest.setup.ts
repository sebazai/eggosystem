import { endDbConnection } from "./src/db/mysqlConnection";
import { closeRedis } from "./src/utils/redisClient";

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

afterAll(async () => {
  await endDbConnection();
  await closeRedis();
});
