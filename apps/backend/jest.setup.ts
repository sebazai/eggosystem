/* eslint-disable @typescript-eslint/no-explicit-any */
import { app } from "./src/app";
import { endDbConnection } from "./src/db/mysqlConnection";

let server: any;

beforeAll(() => {
  server = app.listen();
});

afterAll(async () => {
  await endDbConnection();
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err?: Error) => (err ? reject(err) : resolve(null)));
    });
  }
});
