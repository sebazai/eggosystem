import knex from "knex";
import dotenv from "dotenv";
import { dbEnvConfig } from "../configs/db-env";

dotenv.config();

const db = knex({
  client: "mysql2",
  connection: {
    ...dbEnvConfig
  },
  pool: { min: 0, max: 10 },
  debug: process.env.NODE_ENV === "development"
});

export { db as knex };
