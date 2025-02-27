import knex from "knex";
import dotenv from "dotenv";
import { envConfig } from "../configs/env";

dotenv.config();

const db = knex({
  client: "mysql2", // or "mysql"
  connection: {
    ...envConfig
  },
  pool: { min: 0, max: 10 }, // Optional connection pool settings
  debug: process.env.NODE_ENV === "development" // Enable query debugging in development
});

export { db as knex };
