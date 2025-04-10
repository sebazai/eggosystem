import { endDbConnection } from "./src/db/mysqlConnection";
import { closeRedis } from "./src/utils/redisClient";

afterAll(async () => {
  await endDbConnection();
  await closeRedis();
});
