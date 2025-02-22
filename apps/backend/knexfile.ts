import type { Knex } from "knex";
import { config as dotEnvConfig } from "dotenv";
import * as fs from "fs";

// Update with your config settings.
if (fs.existsSync(`.env.${process.env.NODE_ENV}`)) {
  dotEnvConfig({ path: `.env.${process.env.NODE_ENV}` });
}

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST ?? "localhost",
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 6666,
      user: process.env.DB_USER ?? "kanadbuser",
      password: process.env.DB_PASSWORD ?? "dev-pass",
      database: "kanaliiga",
    },
    migrations: {
      directory: "./migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./seeds",
      extension: "ts",
    },
  },
};

module.exports = config;
