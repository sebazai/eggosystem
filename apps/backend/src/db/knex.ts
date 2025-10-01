import knex from "knex";
import dotenv from "dotenv";
import { dbEnvConfig } from "../configs/db-env";

dotenv.config();

const db = knex({
  client: "mysql2",
  connection: {
    ...dbEnvConfig
  },
  pool: {
    min: 5,
    max: 100,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  }
  // debug: process.env.NODE_ENV === "development"
});

export { db as knex };
