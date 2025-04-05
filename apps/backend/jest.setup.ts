/* eslint-disable @typescript-eslint/no-explicit-any */
// import { app } from "./src/app";
import { endDbConnection } from "./src/db/mysqlConnection";
import { closeRedis } from "./src/utils/redisClient";

// let server: any;
// /* Test */
// beforeAll(() => {
//   server = app.listen();
// });

afterAll(async () => {
  await endDbConnection();
  await closeRedis();
  // if (server) {
  //   await new Promise((resolve, reject) => {
  //     server.close((err?: Error) => (err ? reject(err) : resolve(null)));
  //   });
  // }
});
